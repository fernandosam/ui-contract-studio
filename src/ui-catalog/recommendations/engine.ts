import { z } from "zod";
import raw from "./scenarios.json";
import lock from "../contracts.lock.json";
import alertKnowledge from "../knowledge/alert-dialog.json";
import accordionKnowledge from "../knowledge/accordion.json";
import buttonKnowledge from "../knowledge/button.json";
import reuiGuidance from "../reui-guidance.json";
import shadcnGuidance from "../shadcn-guidance.json";
import compositionPolicy from "../composition-policy.json";
import {buildSemanticCompositionProposals, type SemanticCompositionProposal} from "./semantic-gap-proposals.mjs";

export const pilotFamilies = ["AlertDialog", "Accordion", "Button"] as const;
const familySchema = z.enum([...pilotFamilies, "Form"] as const);
const strategySchema = z.enum(["reuse-contract", "declarative-composition", "react-candidate", "review-required"]);
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
export type CompositionKind = "primitive" | "declarative-composition" | "react-composition" | "authorization-review";
export type CompositionSelection = Readonly<{
  kind: CompositionKind;
  status: "available-approved-contract" | "proposal-existing-contracts" | "candidate-needs-admission" | "blocked-review";
  criteria: readonly { rule: string; reference: string }[];
}>;
export type Recommendation = Readonly<{
  scenario: Scenario;
  decision: Strategy;
  selection: CompositionSelection;
  target: string | null;
  targetApproved: boolean;
  proposedOnly: boolean;
  dependencies: readonly { name: string; piApproved: boolean }[];
  evidence: readonly { capability: string; description: string; state: string; source: string; availability: CapabilityAvailability; codeEvidence: readonly {path: string; contains: string}[] }[];
  gaps: readonly { capability: string; description: string; state: string; availability: CapabilityAvailability }[];
  tests: readonly { mode: string; description: string; status: "planned-not-executed" }[];
  provenance: readonly string[];
  authorization: "advisory-only";
  /** T23 review-only plans, each linked to audited-family gaps; never Pi contracts. */
  gapProposals: readonly SemanticCompositionProposal[];
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
  testRequirements?: readonly string[];
};
type CuratedOverlay = {
  source: string;
  component: string;
  status: string;
  capabilities: readonly CuratedCapability[];
};

/** Deliberately small rollout: these are reviewed records, not all ReUI families. */
const curated = new Map<string, CuratedOverlay>([
  ["AlertDialog", {...alertKnowledge, source:"src/ui-catalog/knowledge/alert-dialog.json"}],
  ["Accordion", {...accordionKnowledge, source:"src/ui-catalog/knowledge/accordion.json"}],
  ["Button", {...buttonKnowledge, source:"src/ui-catalog/knowledge/button.json"}],
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
    if (item.strategy === "declarative-composition" &&
      (item.target !== null || item.dependencies.length < 2 ||
       !item.dependencies.includes("Stack") || item.requiredCapabilities.length === 0))
      errors.push(item.id + ": declarative proposal requires approved Stack/children, verified capabilities and no new Pi target");
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
      else if (item.strategy === "declarative-composition" && availability !== "verified-static")
        errors.push(item.id + ": declarative proposal needs verified-static evidence: " + capability);
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


/**
 * Decides the implementation *approach*, independently of contract admission.
 * Checked family overlays and the contract lock provide the only positive evidence.
 * Unknown, undocumented and non-implemented capabilities never become Pi APIs.
 */
export function selectCompositionApproach(
  scenario: Scenario,
  evidence: Recommendation["evidence"],
): CompositionSelection {
  const criteria: {rule:string;reference:string}[] = [{
    rule: "Cenário funcional revisado; proposta consultiva sem alteração de contrato.",
    reference: "src/ui-catalog/recommendations/scenarios.json",
  }];
  for (const entry of evidence) {
    criteria.push({
      rule: entry.capability + ": " + entry.availability +
        (entry.availability === "verified-static" ? " (somente evidência no código)." :
         " (não comprova disponibilidade no contrato)."),
      reference: entry.source || "src/ui-catalog/recommendations/scenarios.json",
    });
  }
  const dependenciesApproved = scenario.dependencies.every(name => approved.has(name));
  // Never treat an omitted or substituted capability list as proof of availability.
  const capabilitySet = new Set(evidence.map(e=>e.capability));
  const requiredCovered = capabilitySet.size === scenario.requiredCapabilities.length &&
    evidence.length === scenario.requiredCapabilities.length &&
    scenario.requiredCapabilities.every(id=>capabilitySet.has(id));
  const missingRequired = !requiredCovered || evidence.some(e =>
    ["missing-record","missing-evidence","not-implemented"].includes(e.availability));
  const base = {
    criteria: [...criteria, {
      rule: dependenciesApproved
        ? "Todas as dependências constam como approved no lock; não surgem novas props ou ações."
        : "Existe dependência sem admissão approved no lock.",
      reference: "src/ui-catalog/contracts.lock.json",
    }],
  };
  const blocked = (why:string): CompositionSelection => ({
    kind:"authorization-review", status:"blocked-review",
    criteria:[...base.criteria, {rule:why,reference:"src/ui-catalog/composition-policy.json"}],
  });
  if (scenario.strategy === "review-required")
    return blocked("Efeito externo ou autorização requer revisão independente.");
  if (!dependenciesApproved)
    return blocked("Dependências não aprovadas impedem sugestão de uso.");
  if (!requiredCovered)
    return blocked("Lista de capacidades necessária está ausente, adulterada ou incompleta.");
  if (scenario.strategy === "declarative-composition") {
    if (scenario.target !== null || scenario.dependencies.length < 2 ||
        !scenario.dependencies.includes("Stack") || evidence.length === 0 ||
        evidence.some(e=>e.availability !== "verified-static"))
      return blocked("Composição declarativa exige somente estruturas Pi admitidas e capacidades verificadas; sem estado/efeitos novos.");
    return {
      kind:"declarative-composition", status:"proposal-existing-contracts",
      criteria:[...base.criteria, {
        rule:"Organizar nós e slots JSON já admitidos; sem novo estado, handler, esquema ou tipo Pi.",
        reference:"src/ui-catalog/catalog.ts",
      }, {
        rule:"O catálogo demonstra filhos declarativos em Field/Stack; a árvore proposta exige validação Pi normal.",
        reference:"pi-catalog/examples/Field.json",
      }],
    };
  }
  if (scenario.strategy === "react-candidate") {
    if (!scenario.target || approved.has(scenario.target))
      return blocked("Candidato React precisa de alvo distinto e não pode impersonar tipo Pi aprovado.");
    return {
      kind:"react-composition", status:"candidate-needs-admission",
      criteria:[...base.criteria, {
        rule:"Comportamento/estado adicional necessita adapter React com Zod estrito e revisão independente; evidência documental não o admite.",
        reference:"src/ui-catalog/composition-policy.json",
      }],
    };
  }
  if (!scenario.target || !approved.has(scenario.target) || missingRequired)
    return blocked("Reuso exige alvo aprovado e nenhuma capacidade necessária ausente ou não implementada.");
  const alreadyReact = compositionPolicy.reactComposites.includes(scenario.target);
  return {
    kind:alreadyReact ? "react-composition" : "primitive",
    status:"available-approved-contract",
    criteria:[...base.criteria, {
      rule:alreadyReact
        ? "Reusar composição React semântica já admitida em vez de criar outro adapter."
        : "A necessidade cabe em um único tipo Pi admitido sem comportamento adicional.",
      reference:alreadyReact ? "src/ui-catalog/composition-policy.json" :
        "src/ui-catalog/contracts.lock.json",
    }],
  };
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
  const selection = selectCompositionApproach(scenario, evidence);
  // Browser recommendations use curated overlay metadata; T22's Node report is
  // authoritative for checked source fragments. Do not fake a browser audit.
  const entries = evidence.map(item => ({
    component: scenario.family, capability: item.capability,
    description: item.description, state: item.state,
    availability: item.availability, source: item.source || null,
    reason: item.availability === "not-implemented"
      ? "Reviewed semantic record explicitly declares nonimplementation."
      : item.availability === "runtime-review-required"
        ? "Runtime/browser validation remains pending."
        : item.availability === "verified-static"
          ? "Static source cited by curated overlay; verify with semantic:check."
          : "Missing or insufficient implementation evidence.",
    evidenceChecks: item.codeEvidence.map(source => ({
      ...source, status: "not-verified-in-browser",
    })),
    testRequirements: familyCapabilities.get(item.capability)?.testRequirements ?? [],
  }));
  const gapProposals = buildSemanticCompositionProposals({
    capabilityAudit: {
      entries,
      gaps: entries.filter(item => item.availability !== "verified-static"),
    },
    scenarios: [scenario], approvedPiTypes: approved,
  }).proposals;
  const tests = scenario.tests.map(([mode,description]) => ({
    mode, description, status: "planned-not-executed" as const,
  }));
  return {
    scenario, decision: scenario.strategy, selection,
    target: scenario.target,
    targetApproved: selection.status === "available-approved-contract",
    proposedOnly: selection.status !== "available-approved-contract",
    dependencies: scenario.dependencies.map(name => ({name,piApproved:approved.has(name)})),
    evidence, gaps, tests, gapProposals,

    provenance: scenario.family === "Form"
      ? ["src/ui-catalog/extensions/composites/proposals/DeclarativeFormFlow.schema.ts",
         "src/ui-catalog/contracts.lock.json", "src/ui-catalog/composition-policy.json"]
      : [ ...(overlay ? [overlay.source] : []),
        scenario.family === "AlertDialog"
          ? "src/ui-catalog/shadcn-guidance.json" : "src/ui-catalog/reui-guidance.json",
        "src/ui-catalog/contracts.lock.json", "src/ui-catalog/composition-policy.json",
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
