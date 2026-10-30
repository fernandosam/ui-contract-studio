/**
 * E12: in-process, read/validate/generate SDK over the reviewed Pi contract surface.
 * It does not admit contracts, invoke Pi, perform IO or expose a remote endpoint.
 */
import { z } from "zod";
import piManifest from "../../pi-catalog/contracts.json";
import reviewedLock from "../ui-catalog/contracts.lock.json";
import admissionEntries from "../ui-catalog/admission-engine/entries.json";
import admissionCertificates from "../ui-catalog/admission-engine/certifications.json";
import admissionPolicy from "../ui-catalog/admission-engine/policy.json";
import {
  actionDefinitions, catalog, componentDefinitions, experimentalCatalog,
  experimentalComponentEventDescriptors, stableComponentDefinitions,
  stableComponentEventDescriptors, unifiedComponentDefinitions,
} from "../ui-catalog/catalog";
import { graphErrors } from "../../scripts/lib/spec-invariants.mjs";

export type ContractChannel = "stable" | "experimental";
export type ReviewedContractName = keyof typeof componentDefinitions & string;
export type ReviewedContractNode = {
  [Name in ReviewedContractName]: Readonly<{
    id: string;
    type: Name;
    props: z.input<(typeof componentDefinitions)[Name]["props"]>;
    children?: readonly string[];
    slots?: Readonly<Record<string, readonly string[]>>;
    on?: Readonly<Record<string, unknown>>;
  }>;
}[ReviewedContractName];

/** Experimental definitions require explicit opt-in and runtime Zod validation. */
export type ExperimentalContractNode = Readonly<{
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: readonly string[];
  slots?: Readonly<Record<string, readonly string[]>>;
  on?: Readonly<Record<string, unknown>>;
}>;
export type GenerationRequest<Node = ReviewedContractNode> = Readonly<{
  root: string;
  nodes: readonly Node[];
  state?: Readonly<Record<string, unknown>>;
}>;
export type ContractIssue = Readonly<{
  pointer: string;
  code: string;
  message: string;
}>;
export type SpecJson = Readonly<{
  root: string;
  elements: Record<string, unknown>;
  state?: Record<string, unknown>;
}>;
export type ValidationResult =
  | Readonly<{ valid: true; spec: SpecJson; issues: readonly [] }>
  | Readonly<{ valid: false; issues: readonly ContractIssue[] }>;
export type ContractSummary = Readonly<{
  type: string;
  tier: string;
  version: string;
  fingerprint: string;
  stability: string;
  description: string;
  events: readonly string[];
  slots: readonly string[];
}>;
export type ContractDetail = ContractSummary & Readonly<{ propsSchema: unknown }>;

export interface ContractSdk<Channel extends ContractChannel = "stable"> {
  readonly channel: Channel;
  list(): readonly ContractSummary[];
  inspect(type: string): ContractDetail | null;
  validate(spec: unknown): ValidationResult;
  generate(request: GenerationRequest<Channel extends "experimental"
    ? ReviewedContractNode | ExperimentalContractNode
    : ReviewedContractNode>): ValidationResult;
}

const manifestByType = new Map(piManifest.components.map(entry => [entry.type, entry] as const));
const reviewedByType = new Map(reviewedLock.components.map(entry => [entry.name, entry] as const));
const admittedByType = new Map(admissionEntries.entries.map(entry => [entry.type, entry] as const));
const safeKeys = new Set(["id", "type", "props", "children", "slots", "on"]);
const forbiddenKeys = new Set(["__proto__", "constructor", "prototype"]);
const MAX_BYTES = 512_000;
const MAX_ITEMS = 8_000;
const MAX_DEPTH = 50;
const MAX_ISSUES = 100;

const invalid = (code: string, pointer = ""): ValidationResult => ({
  valid: false,
  issues: [{ pointer, code, message: "Contract input rejected." }],
});
const pointer = (parts: readonly PropertyKey[]) => "/" + parts
  .map(part => String(part).replaceAll("~", "~0").replaceAll("/", "~1")).join("/");

/** Allow only bounded plain JSON data, without accessors, special keys or class instances. */
function copySafeJson(value: unknown): { ok: true; value: unknown } | { ok: false } {
  try {
    const pending: { value: unknown; depth: number }[] = [{ value, depth: 0 }];
    const seen = new Set<object>();
    let total = 0;
    while (pending.length) {
      const current = pending.pop()!;
      total += 1;
      if (total > MAX_ITEMS || current.depth > MAX_DEPTH) return { ok: false };
      const item = current.value;
      if (item === null || typeof item === "string" || typeof item === "boolean") continue;
      if (typeof item === "number" && Number.isFinite(item)) continue;
      if (typeof item !== "object" || seen.has(item)) return { ok: false };
      seen.add(item);
      const proto = Object.getPrototypeOf(item);
      if (!Array.isArray(item) && proto !== null && proto !== Object.prototype) return { ok: false };
      if (Object.getOwnPropertySymbols(item).length) return { ok: false };
      const descriptors = Object.getOwnPropertyDescriptors(item);
      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (forbiddenKeys.has(key) || !("value" in descriptor)) return { ok: false };
        if (Array.isArray(item) && key === "length") continue;
        pending.push({ value: descriptor.value, depth: current.depth + 1 });
      }
    }
    const encoded = JSON.stringify(value);
    if (typeof encoded !== "string" || encoded.length > MAX_BYTES) return { ok: false };
    return { ok: true, value: JSON.parse(encoded) as unknown };
  } catch {
    return { ok: false };
  }
}

/** A published projection is never sufficient without the reviewed source identity. */
function authorized(type: string, channel: ContractChannel) {
  const projected = manifestByType.get(type);
  const definitions = channel === "stable" ? stableComponentDefinitions : unifiedComponentDefinitions;
  if (!projected || !Object.hasOwn(definitions, type)) return null;
  const reviewed = reviewedByType.get(type);
  if (reviewed) {
    if (projected.version !== reviewed.version ||
        projected.fingerprint !== reviewed.semanticFingerprint ||
        projected.stability !== reviewed.stability ||
        projected.lifecycle !== reviewed.stability ||
        projected.tier !== reviewed.tier ||
        (reviewed.stability === "stable" && reviewed.status !== "approved")) return null;
    if (channel === "stable" && (reviewed.stability !== "stable" || reviewed.status !== "approved")) return null;
  } else {
    const entry = admittedByType.get(type);
    if (projected.tier !== "composition" || !entry ||
        !admissionPolicy.allowedScenarios.includes(entry.id) ||
        projected.version !== entry.version ||
        projected.fingerprint !== entry.sourceDigest ||
        projected.sourceDigest !== entry.sourceDigest ||
        projected.stability !== projected.lifecycle) return null;
    const cert = admissionCertificates.components[type as keyof typeof admissionCertificates.components];
    const certified = !!(entry.e2eProtocol && cert?.status === "passed" &&
      cert.protocol === entry.e2eProtocol && cert.sourceDigest === entry.sourceDigest);
    const autoDigest = admissionPolicy.ciAutoAdmit[
      entry.id as keyof typeof admissionPolicy.ciAutoAdmit];
    const ciApproved = autoDigest === entry.sourceDigest &&
      entry.events.length === 0 && !!entry.e2eProtocol;
    if (projected.lifecycle === "stable" && !certified && !ciApproved) return null;
    if (projected.validation?.e2e === "passed" && !certified) return null;
    if (projected.validation?.e2e === "ci-required" && !ciApproved) return null;
    if (channel === "stable" && projected.lifecycle !== "stable") return null;
  }
  const definition = definitions[type];
  if (!definition) return null;
  return { projected, definition };
}

export function createContractSdk<Channel extends ContractChannel = "stable">(
  options: Readonly<{ channel?: Channel }> = {},
): ContractSdk<Channel> {
  const channel = options.channel ?? "stable";
  if (channel !== "stable" && channel !== "experimental") throw new TypeError("Invalid SDK channel");
  const definitions = channel === "stable" ? stableComponentDefinitions : unifiedComponentDefinitions;
  const descriptors = channel === "stable"
    ? stableComponentEventDescriptors : experimentalComponentEventDescriptors;
  const validator = channel === "stable" ? catalog : experimentalCatalog;
  const names = Object.keys(definitions);
  const actions = Object.keys(actionDefinitions);

  function summary(type: string): ContractSummary | null {
    const allowed = authorized(type, channel);
    if (!allowed) return null;
    const { projected, definition } = allowed;
    const desc = descriptors[type];
    return {
      type, tier: projected.tier, version: projected.version,
      fingerprint: projected.fingerprint, stability: projected.stability,
      description: definition.description ?? "",
      events: [...(desc?.events ?? [])], slots: [...(desc?.slots ?? [])],
    };
  }

  function validate(spec: unknown): ValidationResult {
    const safe = copySafeJson(spec);
    if (!safe.ok) return invalid("invalid_json_input");
    try {
      const candidate = safe.value;
      const checked = validator.validate(candidate);
      const issues: ContractIssue[] = [];
      if (!checked.success) {
        for (const issue of checked.error?.issues ?? []) {
          issues.push({
            pointer: pointer(issue.path),
            code: String(issue.code),
            message: "Value rejected by the registered Zod contract.",
          });
        }
      }
      const structural = graphErrors(candidate, names, {
        allowedActions: actions, allowedEvents: descriptors,
      });
      for (let i = 0; i < structural.length; i += 1) {
        issues.push({
          pointer: "",
          code: "graph_invariant",
          message: "Specification graph or action violates the declared contract.",
        });
      }
      // The Zod registry alone does not verify the reviewed metadata projection.
      const elements = candidate && typeof candidate === "object" && "elements" in candidate
        ? candidate.elements : undefined;
      if (elements && typeof elements === "object" && !Array.isArray(elements)) {
        for (const [id, node] of Object.entries(elements)) {
          if (node && typeof node === "object" && "type" in node &&
              typeof node.type === "string" && !authorized(node.type, channel)) {
            issues.push({
              pointer: pointer(["elements", id, "type"]),
              code: "contract_not_authorized",
              message: "Type is unavailable or its reviewed identity is inconsistent.",
            });
          }
        }
      }
      if (issues.length) return { valid: false, issues: issues.slice(0, MAX_ISSUES) };
      const parsed = copySafeJson(checked.data);
      if (!parsed.ok) return invalid("invalid_validated_output");
      return { valid: true, spec: parsed.value as SpecJson, issues: [] };
    } catch {
      return invalid("validation_failed");
    }
  }

  function generate(request: GenerationRequest<ReviewedContractNode | ExperimentalContractNode>): ValidationResult {
    const safe = copySafeJson(request);
    if (!safe.ok) return invalid("invalid_generation_request");
    const draft = safe.value as GenerationRequest<ReviewedContractNode | ExperimentalContractNode>;
    if (!draft || typeof draft !== "object" || !Array.isArray(draft.nodes) ||
        typeof draft.root !== "string" || draft.nodes.length > 300) return invalid("invalid_generation_request");
    const elements: Record<string, unknown> = Object.create(null);
    for (const node of draft.nodes) {
      if (!node || typeof node !== "object" || typeof node.id !== "string" ||
          !node.id || forbiddenKeys.has(node.id) ||
          Object.keys(node).some(key => !safeKeys.has(key))) return invalid("invalid_node");
      if (Object.hasOwn(elements, node.id)) return invalid("duplicate_node_id");
      elements[node.id] = {
        type: node.type, props: node.props, children: node.children ?? [],
        ...(node.slots === undefined ? {} : { slots: node.slots }),
        ...(node.on === undefined ? {} : { on: node.on }),
      };
    }
    return validate({
      root: draft.root, elements,
      ...(draft.state === undefined ? {} : { state: draft.state }),
    });
  }

  return {
    channel: channel as Channel,
    list: () => names.flatMap(name => {
      const entry = summary(name);
      return entry ? [entry] : [];
    }).sort((a, b) => a.type.localeCompare(b.type)),
    inspect(type: string): ContractDetail | null {
      const entry = summary(type);
      const allowed = authorized(type, channel);
      if (!entry || !allowed) return null;
      return {
        ...entry,
        propsSchema: z.toJSONSchema(allowed.definition.props, {
          target: "draft-2020-12", unrepresentable: "any",
        }),
      };
    },
    validate,
    generate,
  } as ContractSdk<Channel>;
}
