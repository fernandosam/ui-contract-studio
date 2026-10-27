import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {registrationFlow,resolveAnswers,activeQuestions,inferFlow} from "../src/ui-requirements/engine";
import {planInterface} from "../src/ui-requirements/planner";
import {generateRegistrationScreen} from "../src/ui-requirements/generator";
import {verifyInterface} from "../src/ui-requirements/verify";
import {evaluatePredicate,evaluateValue} from "../src/ui-requirements/behavior";
import {findCapabilities,capabilityAvailable} from "../src/ui-requirements/capabilities";

type Scenario={id:string;intent:string;answers:Record<string,string|boolean|string[]>;blocked:boolean};
const fixture=JSON.parse(readFileSync("tests/fixtures/requirements-scenarios.json","utf8")) as {scenarios:Scenario[]};
test("T17/T28: 12 interface scenarios measure reusable contracts and safe blockers",()=>{
  assert.equal(fixture.scenarios.length,12);
  const generated:string[]=[];const blocked:string[]=[];
  for(const scenario of fixture.scenarios){
    assert.equal(inferFlow(scenario.intent),"registration",scenario.id);
    const requirements=resolveAnswers(scenario.answers,scenario.intent);
    const plan=planInterface(requirements);
    assert.equal(plan.blockers.length>0,scenario.blocked,scenario.id);
    if(scenario.blocked){
      blocked.push(scenario.id);
      assert.throws(()=>generateRegistrationScreen(requirements),/Geração bloqueada/);
      continue;
    }
    const screen=generateRegistrationScreen(requirements);
    assert.equal(Object.keys(screen.elements).filter(id=>screen.elements[id].type==="Input").length,requirements.fields.length);
    const compliance=verifyInterface(requirements,screen);
    assert.deepEqual(compliance.issues,[],scenario.id+": "+compliance.issues.join("; "));
    assert.equal(compliance.valid,true,scenario.id);
    assert.ok(compliance.tests.every(x=>x.status==="not-executed"));
    generated.push(scenario.id);
  }
  assert.equal(generated.length,8);
  assert.equal(blocked.length,4);
});
test("T18/T19: knowledge capability links distinguish implementation from suggestions",()=>{
  assert.equal(capabilityAvailable("Input","label-name-and-help"),true);
  assert.equal(capabilityAvailable("AlertDialog","typed-confirmation"),false);
  assert.ok(findCapabilities("confirm-signal").some(x=>x.component==="AlertDialog"));
  const rules=JSON.parse(readFileSync("src/ui-requirements/composition-rules.json","utf8"));
  for(const relation of rules.relations)
    assert.ok(findCapabilities(relation.capability).some(x=>x.component===relation.component));
});
test("T20/T21: conditional questions, default provenance, required explicit persistence",()=>{
  assert.equal(registrationFlow.schemaVersion,1);
  const unknown=resolveAnswers({});
  assert.ok(unknown.missing.includes("persistence"));
  assert.equal(unknown.provenance.validation,"default");
  assert.equal(activeQuestions(unknown.answers).some(x=>x.id==="confirmationMessage"),false);
  const selected=resolveAnswers({persistence:"local-demo",confirmation:true,confirmationMessage:"Revisar dados"});
  assert.equal(selected.missing.length,0);
  assert.equal(selected.provenance.persistence,"explicit");
  assert.ok(activeQuestions(selected.answers).some(x=>x.id==="confirmationMessage"));
  assert.throws(()=>resolveAnswers({persistence:"local-demo",dangerous:"javascript"}),/desconhecida/);
  assert.throws(()=>resolveAnswers({fields:["name","name"],persistence:"local-demo"}),/inválida/);
});
test("T23/T24: composition varies without changing schemas, actions or registry",()=>{
  const simple=generateRegistrationScreen(resolveAnswers({persistence:"local-demo"}));
  const wide=generateRegistrationScreen(resolveAnswers({persistence:"local-demo",layout:"two-columns",fields:["name","email","company"]}));
  assert.equal(simple.elements.form_fields.type,"Stack");
  assert.equal(wide.elements.form_fields.type,"Grid");
  assert.equal(wide.elements.field_2.type,"Input");
  assert.equal(Object.values(wide.elements).some(x=>x.type==="AlertDialog"),false);
  assert.equal(Object.values(generateRegistrationScreen(resolveAnswers({persistence:"local-demo",confirmation:true})).elements).some(x=>x.type==="AlertDialog"),true);
  for(const spec of [simple,wide])assert.ok(Object.values(spec.elements).every(x=>!Object.hasOwn(x.props,"className")&&!Object.hasOwn(x.props,"href")));
});
test("T25: conditional/validation grammar does not evaluate arbitrary code",()=>{
  assert.equal(evaluatePredicate({all:[{field:"company",equals:true},{not:{field:"blocked",equals:true}}]},{company:true,blocked:false}),true);
  assert.equal(evaluatePredicate({field:"x",equals:true},{x:false}),false);
  assert.deepEqual(evaluateValue("",[{kind:"required"}]),["Campo obrigatório"]);
  assert.deepEqual(evaluateValue("invalid",[{kind:"email"}]),["E-mail inválido"]);
  assert.deepEqual(evaluateValue("a@b.com",[{kind:"email"}]),[]);
});
test("T26/T27: native validation is flagged for runtime review; backend cannot be inferred",()=>{
  const validated=planInterface(resolveAnswers({persistence:"local-demo",validation:"native"}));
  assert.ok(validated.coverage.some(x=>x.id==="validation"&&x.status==="review-required"));
  const blocked=planInterface(resolveAnswers({persistence:"backend"}));
  assert.ok(blocked.blockers.some(x=>x.includes("backend")));
  const screen=generateRegistrationScreen(resolveAnswers({persistence:"local-demo"}));
  screen.elements.field_0.type="FakeUnapprovedComponent";
  assert.equal(verifyInterface(resolveAnswers({persistence:"local-demo"}),screen).valid,false);
});

test("T29 plan and generated types match; altered field properties fail conformity",()=>{
  const req=resolveAnswers({persistence:"local-demo",fields:["name","email","company"]});
  const screen=generateRegistrationScreen(req);
  assert.deepEqual([...new Set(Object.values(screen.elements).map(x=>x.type))].sort(),planInterface(req).components.slice().sort());
  const edited=structuredClone(screen);
  edited.elements.field_1.props.label="Outro campo";
  assert.equal(verifyInterface(req,edited).valid,false);
  const reordered=structuredClone(screen);
  reordered.elements.form_fields.children.reverse();
  assert.equal(verifyInterface(req,reordered).valid,false);
});
test("T29 extra field limit and duplicates are not silently ignored",()=>{
  assert.throws(()=>resolveAnswers({persistence:"local-demo",extraFields:Array.from({length:11},(_,i)=>"extra "+i).join("\n")}),/Limite de 10/);
  assert.throws(()=>resolveAnswers({persistence:"local-demo",extraFields:"Cargo\ncargo"}),/duplicados/);
});
