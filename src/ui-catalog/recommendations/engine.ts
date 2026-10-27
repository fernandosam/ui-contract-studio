import { z } from "zod";
import raw from "./scenarios.json";
import lock from "../contracts.lock.json";
import alertKnowledge from "../knowledge/alert-dialog.json";
import accordionKnowledge from "../knowledge/accordion.json";
import buttonKnowledge from "../knowledge/button.json";
import reuiGuidance from "../reui-guidance.json";
import shadcnGuidance from "../shadcn-guidance.json";

export const pilotFamilies = ["AlertDialog", "Accordion", "Button"] as const;
const familySchema = z.enum([...pilotFamilies, "Form"] as const);
const strategySchema = z.enum(["reuse-contract", "react-candidate", "review-required"]);
const testModeSchema = z.enum(["integration", "manual-a11y", "security-review", "visual"]);
const scenarioSchema = z.object({
  id: z.string().regex(/^[a-z]+(?:-[a-z]+)+$/),
  family: familySchema,
  title: z.string().min(10),
  need: z.string().min(20),
  keywords: z.array(z.string().min(4)).min(2),
  strategy: strategySchema,
  target: z.string().regex(/^[A-Z][A-Za-z0-9]+$/).nullable(),
  dependencies: z.array(z.string().regex(/^[A-Z][A-Za-z0-9]+$/)).min(1),
  requiredCapabilities: z.array(z.string().regex(/^[a-z]+(?:-[a-z]+)*$/)),
  reason: z.string().min(40),
  risks: z.array(z.string().min(12)).min(1),
  tests: z.array(z.tuple([testModeSchema, z.string().min(20)])).min(1),
}).strict();
const documentSchema = z.object({
  schemaVersion: z.literal(1),
  policy: z.string().min(30),
  scenarios: z.array(scenarioSchema).min(3),
}).strict();
export type PilotFamily = z.infer<typeof familySchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type Strategy = z.infer<typeof strategySchema>;
export type Recommendation = Readonly<{
  scenario: Scenario;
  decision: Strategy;
  target: string | null;
  targetApproved: boolean;
  proposedOnly: boolean;
  dependencies: readonly { name: string; piApproved: boolean }[];
  evidence: readonly { capability: string; description: string; state: string; source: string; availability: CapabilityAvailability; codeEvidence: readonly {path: string; contains: string}[] }[];
  gaps: readonly { capability: string; description: string; state: string; availability: CapabilityAvailability }[];
  tests: readonly { mode: string; description: string; status: "planned-not-executed" }[];
  provenance: readonly string[];
  authorization: "advisory-only";
}>;

const file = documentSchema.parse(raw);
export const recommendationScenarios: readonly Scenario[] = file.scenarios;
const byId = new Map(recommendationScenarios.map(item => [item.id, item]));
const approved = new Set(lock.components.filter(x => x.status === "approved").map(x => x.name));
export type CapabilityAvailability =
  | "verified-static"
  | "not-implemented"
  | "runtime-review-required"
  | "missing-evidence"
  | "missing-record";

type CuratedCapability = {
  id: string;
  description: string;
  state: string;
  evidence: readonly {path: string; contains: string}[];
};
type CuratedOverlay = {
  source: string;
  component: string;
  status: string;
  capabilities: readonly CuratedCapability[];
};

/** Deliberately small rollout: these are reviewed records, not all ReUI families. */
const curated = new Map<string, CuratedOverlay>([
  ["AlertDialog", {source:"src/ui-catalog/knowledge/alert-dialog.json", ...alertKnowledge}],
  ["Accordion", {source:"src/ui-catalog/knowledge/accordion.json", ...accordionKnowledge}],
  ["Button", {source:"src/ui-catalog/knowledge/button.json", ...buttonKnowledge}],
]);
const capabilitiesFor = (family: string) =>
  new Map((curated.get(family)?.capabilities ?? []).map(item => [item.id, item]));

/**
 * Only first-party static evidence is eligible for an "available" suggestion.
 * semantic:check checks the literal needles against source files on every CI run.
 * A proposed feature or a pending browser review is never promoted by this helper.
 */
export function classifySemanticCapability(
  capability?: Pick<CuratedCapability, "state" | "evidence">,
): CapabilityAvailability {
  if (!capability) return "missing-record";
  if (capability.state === "documented-not-implemented") return "not-implemented";
  if (capability.state === "runtime-review-required") return "runtime-review-required";
  if (capability.state !== "implemented-static-evidence") return "missing-evidence";
  if (!Array.isArray(capability.evidence) || capability.evidence.length === 0 ||
    capability.evidence.some(item =>
      typeof item.path !== "string" || !/^src\/[a-zA-Z0-9_./-]+$/.test(item.path) ||
      item.path.includes("..") || typeof item.contains !== "string" || !item.contains.trim()))
    return "missing-evidence";
  return "verified-static";
}
const normalized = (text: string): string => text.toLocaleLowerCase("pt-BR")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

export function validateRecommendationPolicy(): string[] {
  const errors: string[] = [];
  const seen = new Set<string>(), families = new Set<string>();
  for (const item of recommendationScenarios) {
    families.add(item.family);
    if (seen.has(item.id)) errors.push(item.id + ": duplicate scenario ID");
    seen.add(item.id);
    if (item.strategy === "reuse-contract" && (!item.target || !approved.has(item.target)))
      errors.push(item.id + ": reuse target must be an approved Pi contract");
    if (item.strategy === "react-candidate" && (!item.target || approved.has(item.target)))
      errors.push(item.id + ": a proposed composite must not impersonate an approved Pi contract");
    if (item.strategy === "review-required" && item.target !== null)
      errors.push(item.id + ": review-required must not grant a target");
    for (const dependency of item.dependencies)
      if (!approved.has(dependency)) errors.push(item.id + ": unapproved dependency " + dependency);

    const overlay = curated.get(item.family);
    if (item.requiredCapabilities.length && (!overlay || overlay.status !== "reviewed-documentation" ||
      overlay.component !== item.family))
      errors.push(item.id + ": capabilities require a reviewed family overlay");
    const familyCapabilities = capabilitiesFor(item.family);
    for (const capability of item.requiredCapabilities) {
      const known = familyCapabilities.get(capability);
      const availability = classifySemanticCapability(known);
      if (!known) errors.push(item.id + ": capability not in reviewed family overlay: " + capability);
      else if (availability === "missing-evidence")
        errors.push(item.id + ": implemented capability lacks usable code evidence: " + capability);
      else if (availability === "not-implemented" && item.strategy === "reuse-contract")
        errors.push(item.id + ": cannot reuse the target for missing capability " + capability);
    }
    if (new Set(item.keywords.map(normalized)).size !== item.keywords.length)
      errors.push(item.id + ": duplicate normalized keywords");
  }
  for (const family of pilotFamilies) {
    if (!families.has(family)) errors.push("Missing pilot family " + family);
    if (family === "AlertDialog" && !shadcnGuidance[family])
      errors.push("AlertDialog: missing official shadcn guidance");
    if (family !== "AlertDialog" && !reuiGuidance[family])
      errors.push(family + ": missing ReUI family guidance");
  }
  return errors.sort();
}

/** Produces an implementation/test plan; never a validated UI spec or an action. */
export function getCompositionRecommendation(id: string): Recommendation | null {
  const scenario = byId.get(id);
  if (!scenario) return null;

  const overlay = curated.get(scenario.family);
  const familyCapabilities = capabilitiesFor(scenario.family);
  const evidence = scenario.requiredCapabilities.map(capability => {
    const item = familyCapabilities.get(capability);
    return {
      capability,
      description: item?.description ?? "Sem registro semântico revisado para esta capacidade.",
      state: item?.state ?? "missing-record",
      source: overlay?.source ?? "",
      availability: classifySemanticCapability(item),
      codeEvidence: item?.evidence ?? [],
    };
  });
  const gaps = evidence.filter(item => item.availability !== "verified-static")
    .map(({capability, description, state, availability}) =>
      ({capability, description, state, availability}));
  const tests = scenario.tests.map(([mode,description]) => ({
    mode, description, status: "planned-not-executed" as const,
  }));
  return {
    scenario, decision: scenario.strategy,
    target: scenario.target,
    targetApproved: scenario.strategy === "reuse-contract" && !!scenario.target && approved.has(scenario.target),
    proposedOnly: scenario.strategy !== "reuse-contract",
    dependencies: scenario.dependencies.map(name => ({name,piApproved:approved.has(name)})),
    evidence, gaps, tests,

    provenance: scenario.family === "Form"
      ? ["src/ui-catalog/extensions/composites/proposals/DeclarativeFormFlow.schema.ts",
         "src/ui-catalog/contracts.lock.json"]
      : [ ...(overlay ? [overlay.source] : []),
        scenario.family === "AlertDialog"
          ? "src/ui-catalog/shadcn-guidance.json" : "src/ui-catalog/reui-guidance.json",
        "src/ui-catalog/contracts.lock.json",
        ...(scenario.target === "OnboardingChecklist"
          ? ["src/ui-catalog/semantic-contract-guidance.json"] : [])],
    authorization: "advisory-only",
  };
}

export type RequirementMatch =
  | {status: "matched"; recommendation: Recommendation}
  | {status: "ambiguous"; candidates: readonly Pick<Scenario,"id"|"title"|"family">[]}
  | {status: "unrecognized"; candidates: readonly Pick<Scenario,"id"|"title"|"family">[]};

/**
 * Conservative phrase matching. Ambiguous or unfamiliar requirements require an
 * explicit scenario selection; no LLM-inferred authorization or arbitrary JSX.
 */
export function recommendFromRequirement(input: string, family?: PilotFamily): RequirementMatch {
  const available = recommendationScenarios.filter(x => !family || x.family === family);
  const query = normalized(input.slice(0,500));
  const matches = query.length >= 4
    ? available.filter(x => x.keywords.some(keyword => query.includes(normalized(keyword))))
    : [];
  if (matches.length === 1) {
    const recommendation = getCompositionRecommendation(matches[0].id);
    if (recommendation) return {status:"matched",recommendation};
  }
  const options = (matches.length ? matches : available)
    .map(({id,title,family:familyName}) => ({id,title,family:familyName}));
  return {status:matches.length>1 ? "ambiguous" : "unrecognized",candidates:options};
}
