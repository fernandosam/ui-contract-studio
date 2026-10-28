/**
 * T23: turn T22's audited semantic gaps into REVIEW-ONLY composition plans.
 * This is a pure, deterministic advisor. It never writes specs, registry
 * entries, Zod schemas, actions, or Pi permissions.
 */
const key = (component,capability) => component + "/" + capability;
const uniq = values => [...new Set(values)].sort((a,b)=>a.localeCompare(b));

const statuses = [
  "candidate-review-only","runtime-review-required",
  "blocked-implementation","blocked-evidence","blocked-authorization",
];
const kinds = {
  "reuse-contract":"primitive",
  "declarative-composition":"declarative-composition",
  "react-candidate":"react-composition",
  "review-required":"authorization-review",
};

function reference(entry) {
  return {
    component:entry.component, capability:entry.capability,
    description:entry.description ?? "Sem descrição revisada.",
    state:entry.state ?? "missing-record",
    availability:entry.availability ?? "missing-record",
    source:entry.source ?? null,
    reason:entry.reason ?? "Capacidade não verificada na auditoria T22.",
    evidenceChecks:(entry.evidenceChecks ?? []).map(x=>({
      path:x.path ?? null, contains:x.contains ?? null, status:x.status,
    })),
    testRequirements:entry.testRequirements ?? [],
  };
}

/**
 * A proposal needs a reviewed scenario referencing one or more T22 gaps.
 * Unmapped gaps remain explicitly visible instead of receiving an invented API.
 * @param {{capabilityAudit: object, scenarios: object[], approvedPiTypes: string[]|Set<string>}} input
 */
export function buildSemanticCompositionProposals({
  capabilityAudit,scenarios=[],approvedPiTypes=[],
}) {
  const entries=capabilityAudit?.entries ?? [];
  const auditGaps=capabilityAudit?.gaps ?? entries.filter(x=>x.availability!=="verified-static");
  const indexed=new Map(entries.map(x=>[key(x.component,x.capability),x]));
  const approved=new Set(approvedPiTypes);
  const proposals=[];
  const covered=new Set();

  for(const scenario of scenarios) {
    // No declared semantic need, no claim of a T22-derived composition.
    if(!scenario.requiredCapabilities?.length)continue;
    const required=scenario.requiredCapabilities.map(capability=>
      indexed.get(key(scenario.family,capability)) ?? {
        component:scenario.family,capability,availability:"missing-record",
        state:"missing-record",source:null,
        reason:"Capacidade ausente da auditoria T22; criar/revisar registro antes de propor implementação.",
        evidenceChecks:[],testRequirements:[],
      });
    const origins=required.filter(x=>x.availability!=="verified-static" &&
      indexed.has(key(x.component,x.capability)));
    if(!origins.length)continue;
    origins.forEach(x=>covered.add(key(x.component,x.capability)));

    const dependencies=(scenario.dependencies ?? []).map(name=>({
      name,approvedPiType:approved.has(name),
      source:"src/ui-catalog/contracts.lock.json",
    }));
    const allAdmitted=dependencies.every(x=>x.approvedPiType);
    const missingProof=required.some(x=>
      x.availability==="missing-evidence" || x.availability==="missing-record");
    const notImplemented=required.some(x=>x.availability==="not-implemented");
    const runtimePending=required.some(x=>x.availability==="runtime-review-required");
    const targetApproved=scenario.target!==null && approved.has(scenario.target);
    const invalidReactTarget=scenario.strategy==="react-candidate" &&
      (!scenario.target || targetApproved);
    const invalidReuseTarget=scenario.strategy==="reuse-contract" &&
      (!scenario.target || !targetApproved);
    const invalidDeclarative=scenario.strategy==="declarative-composition" &&
      (scenario.target!==null || !scenario.dependencies?.includes("Stack") ||
       scenario.dependencies.length<2);

    // Order is intentional: authorization issues cannot be excused by evidence;
    // evidence defects cannot masquerade as a declaration of nonimplementation.
    let status;
    if(scenario.strategy==="review-required" || !allAdmitted ||
       invalidReactTarget || invalidReuseTarget || invalidDeclarative ||
       !Object.hasOwn(kinds,scenario.strategy))status="blocked-authorization";
    else if(missingProof)status="blocked-evidence";
    else if(notImplemented && scenario.strategy!=="react-candidate")status="blocked-implementation";
    else if(runtimePending && scenario.strategy!=="react-candidate")status="runtime-review-required";
    else if(scenario.strategy==="react-candidate")status="candidate-review-only";
    else status="blocked-implementation";

    const implementationLimitations=[];
    if(notImplemented)implementationLimitations.push(
      "Há capacidade explicitamente não implementada: implementar e testar antes de qualquer uso.");
    if(missingProof)implementationLimitations.push(
      "Faltam registros ou evidências verificáveis; ausência de prova não demonstra ausência de código.");
    if(runtimePending)implementationLimitations.push(
      "Há comportamento pendente de testes de navegador/acessibilidade; evidência estática não certifica runtime.");
    if(!implementationLimitations.length)implementationLimitations.push(
      "A proposta não certifica comportamento; executar os testes planejados antes de adoção.");
    const admissionLimitations=[
      "Proposta consultiva: não registra novo tipo, prop, evento, schema Zod, ação, API ou permissão Pi.",
      "A composição só poderá ser usada após implementação, testes e revisão pelos controles existentes.",
    ];
    if(!allAdmitted)admissionLimitations.push(
      "Dependências fora do lock aprovado impedem uso e exigem admissão independente.");
    if(invalidReactTarget || invalidReuseTarget || invalidDeclarative)
      admissionLimitations.push("Alvo/estratégia incompatível com os contratos atuais.");
    if(scenario.strategy==="review-required")
      admissionLimitations.push("Efeitos externos/autorizações não são delegados ao recomendador.");

    proposals.push({
      id:"gap-"+scenario.id,
      scenarioId:scenario.id,family:scenario.family,
      title:scenario.title,target:scenario.target,
      strategy:scenario.strategy,kind:kinds[scenario.strategy]??"authorization-review",
      status,approval:"candidate-not-admitted",canUseInPi:false,
      originGaps:origins.map(reference),
      requiredCapabilities:required.map(reference),
      evidence:required.filter(x=>x.availability==="verified-static").map(reference),
      dependencies,
      implementationLimitations,admissionLimitations,
      suggestedTests:[
        ...(scenario.tests ?? []).map(([mode,description])=>({
          mode,description,status:"planned-not-executed",
        })),
        ...uniq(origins.flatMap(x=>x.testRequirements ?? [])).map(description=>({
          mode:"derived-semantic",description,status:"planned-not-executed",
        })),
      ],
      provenance:uniq([
        ...origins.map(x=>x.source).filter(Boolean),
        "src/ui-catalog/recommendations/scenarios.json",
        "src/ui-catalog/contracts.lock.json",
      ]),
    });
  }
  proposals.sort((a,b)=>a.id.localeCompare(b.id));
  const uncoveredGaps=auditGaps.filter(x=>!covered.has(key(x.component,x.capability)))
    .map(x=>({...reference(x),
      limitation:"Sem cenário revisado que exija esta capacidade; nenhuma composição é inferida."}))
    .sort((a,b)=>key(a.component,a.capability).localeCompare(key(b.component,b.capability)));
  const byStatus=Object.fromEntries(statuses.map(x=>[x,proposals.filter(p=>p.status===x).length]));
  return {
    schemaVersion:1,authority:"advisory-only",
    disclaimer:"T22 gaps are diagnostic, not executable contracts. No Zod, Pi, API or backend authorization is created by a proposal.",
    source:"T22 capabilityAudit / src/ui-catalog/knowledge/",
    summary:{auditGaps:auditGaps.length,coveredGaps:covered.size,
      uncoveredGaps:uncoveredGaps.length,proposals:proposals.length,byStatus},
    proposals,uncoveredGaps,
  };
}
