import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  recommendationScenarios,
  getCompositionRecommendation,
  recommendFromRequirement,
  validateRecommendationPolicy,
  classifySemanticCapability,
} from "../src/ui-catalog/recommendations/engine";
import {playgroundDefinitions} from "../src/ui-catalog/catalog";
import {extensionDefinitions} from "../src/ui-catalog/extensions/catalog";

test("13 deterministic scenarios cover the three pilot families without granting Pi types",()=>{
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
