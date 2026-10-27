import test from "node:test";
import assert from "node:assert/strict";
import {declarativeFormFlowSchema,validateDeclarativeValues} from "../src/ui-catalog/extensions/composites/proposals/DeclarativeFormFlow.schema";
import {proposeFormFlow} from "../src/ui-requirements/form-proposal";
import {resolveAnswers} from "../src/ui-requirements/engine";

test("T35: one reusable schema covers distinct registration scenarios",()=>{
 const scenarios=[
  {persistence:"local-demo"},
  {persistence:"local-demo",fields:["name","email","phone","company"],layout:"two-columns"},
  {persistence:"local-demo",confirmation:true,confirmationMessage:"Revisar dados?",fields:["name","email"]}
 ] as const;
 for(const answers of scenarios){
  const props=proposeFormFlow(resolveAnswers(answers));
  assert.equal(declarativeFormFlowSchema.safeParse(props).success,true);
  assert.equal(props.fields.length,answers.fields?.length??3);
 }
});
test("T35: unknown properties, callbacks, duplicate fields and invalid limits are rejected",()=>{
 const baseline=proposeFormFlow(resolveAnswers({persistence:"local-demo"}));
 assert.equal(declarativeFormFlowSchema.safeParse({...baseline,endpoint:"https://example.test"}).success,false);
 assert.equal(declarativeFormFlowSchema.safeParse({...baseline,onSubmit:"javascript:evil()"}).success,false);
 assert.equal(declarativeFormFlowSchema.safeParse({...baseline,fields:[baseline.fields[0],baseline.fields[0]]}).success,false);
 assert.equal(declarativeFormFlowSchema.safeParse({...baseline,fields:[{...baseline.fields[0],minLength:10,maxLength:2}]}).success,false);
 assert.equal(declarativeFormFlowSchema.safeParse({...baseline,fields:[]}).success,false);
});
test("T35: validation modes are explicit, bounded and local-only",()=>{
 const props=proposeFormFlow(resolveAnswers({persistence:"local-demo"}));
 const invalid=validateDeclarativeValues(props,{name:"",email:"broken",password:""});
 assert.ok(invalid.name?.includes("Campo obrigatório"));
 assert.ok(invalid.email?.includes("E-mail inválido"));
 assert.deepEqual(validateDeclarativeValues(props,{name:"Ana",email:"ana@example.com",password:"secure"}),{});
 assert.deepEqual(validateDeclarativeValues({...props,validation:"none"},{name:"",email:"broken"}),{});
 const bounded={...props,fields:[{...props.fields[0],minLength:4,maxLength:7}]};
 assert.ok(validateDeclarativeValues(bounded,{name:"ab"}).name?.some(e=>e.startsWith("Tamanho mínimo")));
 assert.ok(validateDeclarativeValues(bounded,{name:"longlong"}).name?.some(e=>e.startsWith("Tamanho máximo")));
});
test("T35: unsupported backend and business rules cannot be converted into a local candidate",()=>{
 assert.throws(()=>proposeFormFlow(resolveAnswers({persistence:"backend"})),/Proposta bloqueada/);
 assert.throws(()=>proposeFormFlow(resolveAnswers({persistence:"local-demo",validation:"business"})),/Proposta bloqueada/);
 assert.throws(()=>proposeFormFlow(resolveAnswers({})),/Proposta bloqueada/);
});
