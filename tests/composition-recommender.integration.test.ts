import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  recommendationScenarios,
  getCompositionRecommendation,
  recommendFromRequirement,
  validateRecommendationPolicy,
  classifySemanticCapability,
  selectCompositionApproach,
} from "../src/ui-catalog/recommendations/engine";
import {playgroundDefinitions} from "../src/ui-catalog/catalog";
import {extensionDefinitions} from "../src/ui-catalog/extensions/catalog";

test("15 deterministic scenarios cover the three pilot families without granting Pi types",()=>{
  assert.deepEqual(validateRecommendationPolicy(),[]);
  assert.equal(recommendationScenarios.length,JSON.parse(readFileSync("src/ui-catalog/recommendations/scenarios.json","utf8")).scenarios.length);
  assert.deepEqual([...new Set(recommendationScenarios.map(x=>x.family))].sort(),
    ["Accordion","AlertDialog","Button","Form"]);
  const lock=JSON.parse(readFileSync("src/ui-catalog/contracts.lock.json","utf8"));
  const before=new Set(lock.components.map((x:{name:string})=>x.name));
  for(const item of recommendationScenarios) {
    const result=getCompositionRecommendation(item.id);
    assert.ok(result,item.id);
    assert.equal(result.authorization,"advisory-only");
    assert.equal(result.decision,item.strategy);
    assert.equal(result.tests.length,item.tests.length);
    assert.ok(result.tests.every(x=>x.status==="planned-not-executed"));
    assert.ok(result.dependencies.every(x=>x.piApproved));
    if(item.strategy==="reuse-contract") {
      assert.equal(result.targetApproved,true);
      assert.ok(result.target && before.has(result.target));
    }else{
      assert.equal(result.targetApproved,false);
      assert.equal(result.proposedOnly,true);
      if(result.target)assert.ok(!before.has(result.target));
    }
  }
  assert.equal(getCompositionRecommendation("nonexistent"),null);
  assert.equal(lock.components.length,102);
});

test("AlertDialog makes correct reuse, missing capability and remote authorization distinctions",()=>{
  const simple=getCompositionRecommendation("alert-simple");
  assert.ok(simple);
  assert.equal(simple.target,"AlertDialog");
  assert.equal(simple.targetApproved,true);
  assert.ok(simple.evidence.some(e=>e.capability==="confirm-signal"&&e.state==="implemented-static-evidence"));
  assert.ok(simple.gaps.some(e=>e.capability==="focus-and-keyboard"));
  const typed=getCompositionRecommendation("alert-typed");
  const checkbox=getCompositionRecommendation("alert-checkbox");
  assert.ok(typed&&checkbox);
  assert.equal(typed.decision,"react-candidate");
  assert.ok(typed.gaps.some(e=>e.capability==="typed-confirmation"&&e.state==="documented-not-implemented"));
  assert.ok(typed.dependencies.some(e=>e.name==="Input"));
  assert.ok(checkbox.dependencies.some(e=>e.name==="Checkbox"));
  const remote=getCompositionRecommendation("alert-remote");
  assert.ok(remote);
  assert.equal(remote.decision,"review-required");
  assert.equal(remote.target,null);
  assert.equal(remote.targetApproved,false);
  assert.ok(remote.tests.some(t=>t.mode==="security-review"));
});

test("Accordion prefers the primitive or the already-approved semantic OnboardingChecklist",()=>{
  const faq=getCompositionRecommendation("accordion-faq");
  const onboarding=getCompositionRecommendation("accordion-onboarding");
  assert.ok(faq&&onboarding);
  assert.equal(faq.target,"Accordion");
  assert.equal(onboarding.target,"OnboardingChecklist");
  assert.equal(onboarding.decision,"reuse-contract");
  assert.equal(extensionDefinitions.OnboardingChecklist.props.safeParse({
    steps:[{id:"setup",title:"Configurar",description:"Criar projeto",status:"active"}],
  }).success,true);
  assert.equal(extensionDefinitions.OnboardingChecklist.props.safeParse({
    steps:[{id:"one",title:"Etapa 1",description:"A",status:"active"},
           {id:"two",title:"Etapa 2",description:"B",status:"active"}],
  }).success,false);
  const team=getCompositionRecommendation("accordion-members");
  assert.equal(team?.decision,"react-candidate");
  assert.equal(team?.targetApproved,false);
});

test("Button loading is already supported, but clipboard feedback is not equivalent to press",()=>{
  assert.equal(playgroundDefinitions.Button.props.safeParse({label:"Salvar",loading:true}).success,true);
  const loading=getCompositionRecommendation("button-loading");
  const copy=getCompositionRecommendation("button-copy");
  assert.equal(loading?.target,"Button");
  assert.equal(loading?.targetApproved,true);
  assert.equal(copy?.decision,"react-candidate");
  assert.ok(copy?.scenario.risks.some(x=>x.includes("permissão")));
  assert.equal(getCompositionRecommendation("button-group")?.target,"ButtonGroup");
  assert.equal(getCompositionRecommendation("button-toggle")?.target,"Toggle");
});

test("free requirements match only reviewed phrases and never invent an unrecognized recommendation",()=>{
  const confirmed=recommendFromRequirement("Preciso de confirmação por texto para excluir.","AlertDialog");
  assert.equal(confirmed.status,"matched");
  if(confirmed.status==="matched")assert.equal(confirmed.recommendation.target,"TypedConfirmationDialog");
  const ambiguous=recommendFromRequirement("Quero marcar checkbox e digitar confirmação.","AlertDialog");
  assert.equal(ambiguous.status,"ambiguous");
  if(ambiguous.status==="ambiguous") assert.ok(ambiguous.candidates.length>=2);
  const unknown=recommendFromRequirement("Gerenciar pagamentos e enviar token bancário.","AlertDialog");
  assert.equal(unknown.status,"unrecognized");
  const empty=recommendFromRequirement("");
  assert.equal(empty.status,"unrecognized");
  const wrongFamily=recommendFromRequirement("Preciso copiar com feedback.","Accordion");
  assert.equal(wrongFamily.status,"unrecognized");
});

test("explorer makes the pilot accessible and shows tests and approval boundaries",()=>{
  const shell=readFileSync("src/ui-runtime/catalog-explorer.tsx","utf8");
  const panel=readFileSync("src/ui-runtime/composition-recommendations.tsx","utf8");
  assert.match(shell,/CompositionRecommendationPanel/);
  assert.match(shell,/Pilotos de recomendação semântica/);
  assert.match(panel,/data-testid="composition-recommendations"/);
  assert.match(panel,/data-testid="recommendation-decision"/);
  assert.match(panel,/data-testid="recommendation-criteria"/);
  assert.match(panel,/data-testid="recommendation-admission-status"/);
  assert.match(panel,/Plano de testes sugerido/);
  assert.match(panel,/Não há correspondência segura/);
  assert.match(panel,/Nenhum contrato Pi é criado/);
});

test("verified static capabilities are scoped to their own reviewed family",()=>{
  const faq=getCompositionRecommendation("accordion-faq");
  const loading=getCompositionRecommendation("button-loading");
  const action=getCompositionRecommendation("button-action");
  assert.ok(faq&&loading&&action);
  assert.equal(faq.evidence.find(x=>x.capability==="textual-items")?.availability,"verified-static");
  assert.ok(faq.evidence.some(x=>x.capability==="keyboard-and-aria"&&
    x.availability==="runtime-review-required"));
  assert.ok(faq.provenance.includes("src/ui-catalog/knowledge/accordion.json"));
  assert.equal(loading.evidence.find(x=>x.capability==="loading-and-disabled")?.availability,"verified-static");
  assert.ok(loading.evidence.every(x=>x.source==="src/ui-catalog/knowledge/button.json"));
  assert.ok(loading.evidence.every(x=>x.codeEvidence.length>0));
  assert.equal(action.gaps.find(x=>x.capability==="focus-and-keyboard-runtime")?.availability,"runtime-review-required");
});

test("not implemented capabilities stay candidates, never Pi availability",()=>{
  const team=getCompositionRecommendation("accordion-members");
  const copy=getCompositionRecommendation("button-copy");
  assert.ok(team&&copy);
  assert.equal(team.evidence.find(x=>x.capability==="rich-structured-content")?.availability,"not-implemented");
  assert.equal(copy.evidence.find(x=>x.capability==="copy-or-external-action")?.availability,"not-implemented");
  assert.equal(team.targetApproved,false);
  assert.equal(copy.targetApproved,false);
  assert.equal(copy.evidence.find(x=>x.capability==="local-press-event")?.availability,"verified-static");
});

test("absent, empty, unsafe and undocumented evidence never imply implementation",()=>{
  assert.equal(classifySemanticCapability(undefined),"missing-record");
  assert.equal(classifySemanticCapability({state:"implemented-static-evidence",evidence:[]}),"missing-evidence");
  assert.equal(classifySemanticCapability({state:"implemented-static-evidence",
    evidence:[{path:"docs/guidance.md",contains:"hello"}]}),"missing-evidence");
  assert.equal(classifySemanticCapability({state:"implemented-static-evidence",
    evidence:[{path:"src/../escape.ts",contains:"x"}]}),"missing-evidence");
  assert.equal(classifySemanticCapability({state:"implemented-static-evidence",
    evidence:[{path:"src/a.ts",contains:""}]}),"missing-evidence");
  assert.equal(classifySemanticCapability({state:"documented-not-implemented",evidence:[]}),"not-implemented");
  assert.equal(classifySemanticCapability({state:"runtime-review-required",evidence:[]}),"runtime-review-required");
  assert.equal(classifySemanticCapability({state:"implemented-static-evidence",
    evidence:[{path:"src/a.ts",contains:"export const a"}]}),"verified-static");
});

test("T21 chooses a direct primitive from the verified capability and the approved Pi contract",()=>{
  const direct=getCompositionRecommendation("button-loading");
  assert.ok(direct);
  assert.equal(direct.selection.kind,"primitive");
  assert.equal(direct.selection.status,"available-approved-contract");
  assert.equal(direct.targetApproved,true);
  assert.ok(direct.selection.criteria.some(x=>x.reference==="src/ui-catalog/knowledge/button.json" &&
    x.rule.includes("verified-static")));
  assert.ok(direct.selection.criteria.some(x=>x.reference==="src/ui-catalog/contracts.lock.json"));
  assert.equal(direct.authorization,"advisory-only");
});

test("T21 proposes declarative composition only with admitted nodes and verified semantics",()=>{
  const layout=getCompositionRecommendation("button-actions-layout");
  assert.ok(layout);
  assert.equal(layout.decision,"declarative-composition");
  assert.equal(layout.selection.kind,"declarative-composition");
  assert.equal(layout.selection.status,"proposal-existing-contracts");
  assert.equal(layout.target,null);
  assert.equal(layout.targetApproved,false);
  assert.equal(layout.proposedOnly,true);
  assert.deepEqual(layout.dependencies.map(x=>x.name),["Stack","Button"]);
  assert.ok(layout.dependencies.every(x=>x.piApproved));
  assert.equal(layout.evidence.find(x=>x.capability==="local-press-event")?.availability,"verified-static");
  assert.ok(layout.selection.criteria.some(x=>x.reference==="pi-catalog/examples/Field.json"));
  assert.equal(playgroundDefinitions.Stack.props.safeParse({direction:"horizontal",gap:"sm"}).success,true);
  assert.equal(playgroundDefinitions.Stack.props.safeParse({direction:"horizontal",onClick:"deleteAll"}).success,false);
  assert.equal(playgroundDefinitions.Button.props.safeParse({label:"Salvar",backendUrl:"https://example.org"}).success,false);
});

test("T21 distinguishes approved React reuse from React candidates and authorization review",()=>{
  const reused=getCompositionRecommendation("accordion-onboarding");
  assert.ok(reused);
  assert.equal(reused.selection.kind,"react-composition");
  assert.equal(reused.selection.status,"available-approved-contract");
  assert.equal(reused.targetApproved,true);
  assert.ok(reused.selection.criteria.some(x=>x.reference==="src/ui-catalog/composition-policy.json"));
  const candidate=getCompositionRecommendation("alert-typed");
  assert.ok(candidate);
  assert.equal(candidate.selection.kind,"react-composition");
  assert.equal(candidate.selection.status,"candidate-needs-admission");
  assert.equal(candidate.targetApproved,false);
  assert.ok(candidate.gaps.some(x=>x.availability==="not-implemented"));
  const forbidden=getCompositionRecommendation("alert-remote");
  assert.ok(forbidden);
  assert.equal(forbidden.selection.kind,"authorization-review");
  assert.equal(forbidden.selection.status,"blocked-review");
  assert.equal(forbidden.target,null);
  assert.equal(forbidden.authorization,"advisory-only");
});

test("T21 fails closed when an apparent reusable contract loses admission or capability evidence",()=>{
  const button=getCompositionRecommendation("button-loading");
  const declarative=getCompositionRecommendation("button-actions-layout");
  assert.ok(button&&declarative);
  const noEvidence=button.evidence.map(e=>({...e,availability:"missing-evidence" as const}));
  assert.equal(selectCompositionApproach(button.scenario,noEvidence).kind,"authorization-review");
  assert.equal(selectCompositionApproach(button.scenario,[]).status,"blocked-review");
  assert.equal(selectCompositionApproach(button.scenario,
    button.evidence.map(e=>({...e,capability:"unrelated-capability"}))).status,"blocked-review");
  const notImplemented=button.evidence.map(e=>({...e,availability:"not-implemented" as const}));
  assert.equal(selectCompositionApproach(button.scenario,notImplemented).status,"blocked-review");
  assert.equal(selectCompositionApproach({...button.scenario,target:"UnknownUnapproved"},button.evidence).kind,"authorization-review");
  const reactCandidate=getCompositionRecommendation("alert-typed");
  assert.ok(reactCandidate);
  assert.equal(selectCompositionApproach({...reactCandidate.scenario,target:"AlertDialog"},
    reactCandidate.evidence).status,"blocked-review");
  assert.equal(selectCompositionApproach({...button.scenario,dependencies:["UnapprovedWidget"]},button.evidence).status,"blocked-review");
  assert.equal(selectCompositionApproach(declarative.scenario,
    declarative.evidence.map(e=>({...e,availability:"runtime-review-required" as const}))).status,"blocked-review");
  assert.equal(selectCompositionApproach({...declarative.scenario,dependencies:["Stack","UnknownUnapproved"]},
    declarative.evidence).status,"blocked-review");
  assert.equal(selectCompositionApproach({...declarative.scenario,target:"Stack"},declarative.evidence).status,"blocked-review");
  // Documentation must not create a new Pi event or capability on the primitive.
  assert.equal(playgroundDefinitions.Button.props.safeParse({label:"Copiar",clipboard:true}).success,false);
});

test("T23 exposes only traceable, review-only plans in the existing recommendation flow",()=>{
  const typed=getCompositionRecommendation("alert-typed");
  const copy=getCompositionRecommendation("button-copy");
  const runtime=getCompositionRecommendation("alert-simple");
  const implemented=getCompositionRecommendation("button-loading");
  assert.ok(typed&&copy&&runtime&&implemented);
  assert.equal(typed.gapProposals.length,1);
  const proposal=typed.gapProposals[0];
  assert.equal(proposal.status,"candidate-review-only");
  assert.equal(proposal.scenarioId,"alert-typed");
  assert.equal(proposal.target,"TypedConfirmationDialog");
  assert.equal(proposal.canUseInPi,false);
  assert.ok(proposal.originGaps.some(x=>x.capability==="typed-confirmation"&&
    x.source==="src/ui-catalog/knowledge/alert-dialog.json"));
  assert.ok(proposal.requiredCapabilities.some(x=>x.capability==="focus-and-keyboard"&&
    x.availability==="runtime-review-required"));
  assert.ok(proposal.admissionLimitations.some(x=>x.includes("schema Zod")));
  assert.equal(copy.gapProposals[0].status,"candidate-review-only");
  assert.equal(runtime.gapProposals[0].status,"runtime-review-required");
  assert.equal(implemented.gapProposals.length,0);
  const panel=readFileSync("src/ui-runtime/composition-recommendations.tsx","utf8");
  assert.match(panel,/data-testid="recommendation-gap-proposals"/);
  assert.match(panel,/result\.gapProposals\.map/);
  assert.match(panel,/Propostas candidatas a partir das lacunas T22/);
});
