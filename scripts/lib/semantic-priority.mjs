/**
 * T25: deterministic, advisory-only ordering of semantic enrichment work.
 * Consumes the existing semantic profiles and versioned ReUI examples.
 * This module does not read or mutate contract schemas or admission policy.
 */
const list = value => Array.isArray(value) ? value : [];
const sortedUnique = values => [...new Set(values.filter(value => typeof value === "string" && value.length > 0))].sort();
const byName = (a,b) => a < b ? -1 : a > b ? 1 : 0;
const capped = (value,limit) => Math.min(value,limit);

export const ENRICHMENT_CRITERIA = Object.freeze([
  {id:"reuiExamples",max:16,reason:"Recorrência da família em exemplos ReUI versionados (impacto potencial em composições de IA).",rule:"0=0; 1..5=4; 6..15=8; 16..30=12; acima de 30=16"},
  {id:"inboundIntegrations",max:20,reason:"Quantos outros componentes apontam para este como integração candidata.",rule:"4 pontos por origem distinta, até 20"},
  {id:"outboundIntegrations",max:12,reason:"Quantidade de integrações que agentes precisam interpretar ao compor este componente.",rule:"2 pontos por destino distinto, até 12"},
  {id:"unimplemented",max:18,reason:"Capacidades documentadas mas não implementadas exigem limites explícitos para evitar APIs inventadas.",rule:"3 pontos por capacidade, até 18"},
  {id:"runtimeReview",max:12,reason:"Comportamentos ainda não verificados em runtime exigem orientação e teste.",rule:"3 pontos por capacidade, até 12"},
  {id:"highRiskTests",max:8,reason:"Casos derivados para acessibilidade manual ou candidatos inexequíveis tornam visíveis as restrições.",rule:"2 pontos por caso, até 8; teste descrito não é teste executado"},
  {id:"documentationGaps",max:20,reason:"Falta de curadoria ou orientação para agentes demanda revisão, mas não prova risco nem capacidade.",rule:"sem overlay +12; rascunho +6; sem notas IA +4; sem orientação quando evitar +4; teto 20"},
]);

/**
 * Scores observed inputs only. Missing fields are listed as unknown, rather
 * than being interpreted as confirmed absence of risks or functionality.
 *
 * No permission/admission status contributes points or is changed by ranking.
 */
export function rankSemanticEnrichment(profiles = [], reuiExamples = []) {
  const sourceProfiles = list(profiles);
  const components = new Set();
  for (const profile of sourceProfiles) {
    if (typeof profile?.component !== "string" || !profile.component.trim())
      throw new Error("Semantic priority requires a component name");
    if (components.has(profile.component))
      throw new Error("Duplicate semantic priority component: " + profile.component);
    components.add(profile.component);
  }
  const countByFamily = new Map();
  for (const example of list(reuiExamples)) {
    const family = example?.family;
    if(typeof family === "string" && family.length)
      countByFamily.set(family,(countByFamily.get(family) ?? 0) + 1);
  }
  const inbound = new Map();
  for (const profile of sourceProfiles) {
    const targets = sortedUnique(list(profile.integrations ?? profile.integrationCandidates)
      .map(item => item?.component).filter(target => target !== profile.component));
    for (const target of targets) {
      if (!components.has(target)) continue;
      if (!inbound.has(target)) inbound.set(target, []);
      inbound.get(target).push(profile.component);
    }
  }
  const entries = sourceProfiles.map(profile => {
    const name = profile.component;
    const examples = countByFamily.get(name) ?? 0;
    const incoming = sortedUnique(inbound.get(name) ?? []);
    const outgoing = sortedUnique(list(profile.integrations ?? profile.integrationCandidates)
      .map(item => item?.component).filter(target => target !== name));
    const caps = list(profile.capabilities);
    const unimplemented = sortedUnique(caps.filter(cap => cap?.state === "documented-not-implemented").map(cap => cap.id));
    const runtime = sortedUnique(caps.filter(cap => cap?.state === "runtime-review-required").map(cap => cap.id));
    const riskyTests = sortedUnique(list(profile.derivedTestCases)
      .filter(item => ["manual-a11y","candidate-not-executable"].includes(item?.kind)).map(item => item.id));
    const hasOverlay = typeof profile.curatedSource === "string" && profile.curatedSource.length > 0;
    const documentationIssues = [];
    if (!hasOverlay) documentationIssues.push("missing-curated-overlay");
    if (profile.documentationReview === "draft") documentationIssues.push("draft-review");
    if (!list(profile.agentNotes).length) documentationIssues.push("missing-agent-notes");
    if (!list(profile.whenNotUse).length) documentationIssues.push("missing-avoidance-guidance");
    const missingData = [];
    if (!hasOverlay) missingData.push("curated-capability-evidence-not-reviewed");
    if (!caps.length) missingData.push("capabilities-not-inventoried");
    if (!list(profile.derivedTestCases).length) missingData.push("derived-tests-not-inventoried");
    if (!Array.isArray(profile.integrations) && !Array.isArray(profile.integrationCandidates))
      missingData.push("integration-candidates-unknown");
    const points = {
      reuiExamples: examples === 0 ? 0 : examples <= 5 ? 4 : examples <= 15 ? 8 : examples <= 30 ? 12 : 16,
      inboundIntegrations: capped(incoming.length * 4,20),
      outboundIntegrations: capped(outgoing.length * 2,12),
      unimplemented: capped(unimplemented.length * 3,18),
      runtimeReview: capped(runtime.length * 3,12),
      highRiskTests: capped(riskyTests.length * 2,8),
      documentationGaps: capped((!hasOverlay ? 12 : 0) +
        (profile.documentationReview === "draft" ? 6 : 0) +
        (!list(profile.agentNotes).length ? 4 : 0) +
        (!list(profile.whenNotUse).length ? 4 : 0),20),
    };
    const score = Object.values(points).reduce((sum,value) => sum+value,0);
    return {
      component:name, score, points,
      signals:{reuiExampleCount:examples,referencedBy:incoming,integratesWith:outgoing,
        unimplementedCapabilities:unimplemented,runtimeReviewCapabilities:runtime,
        highRiskDerivedTests:riskyTests,documentationIssues},
      evidenceSources:sortedUnique([...list(profile.sources),profile.curatedSource,
        examples ? "src/ui-catalog/reui-primitive-source-baseline.json" : null].filter(Boolean)),
      dataCompleteness:missingData.length ? "partial" : "inventoried",
      missingData:sortedUnique(missingData),
      authorization:"advisory-only",
    };
  }).sort((a,b) => b.score-a.score || byName(a.component,b.component));
  entries.forEach((entry,index) => {entry.rank=index+1;});
  return {
    schemaVersion:1,
    purpose:"Prioritization of semantic documentation and review only; never contract admission or Pi authorization.",
    criteria:ENRICHMENT_CRITERIA,
    entries,
  };
}
