import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {catalog,experimentalCatalog} from "../src/ui-catalog/catalog";
import {experimentalFormScenarios} from "../src/ui-catalog/admission-engine/form-scenarios";
import {declarativeFormFlowSchema,validateDeclarativeValues} from "../src/ui-catalog/admission-engine/generated/DeclarativeFormFlow.schema";

const standard=JSON.parse(readFileSync("pi-catalog/experimental-examples/DeclarativeFormFlow.json","utf8"));
const cases=[["minimal",experimentalFormScenarios.minimal],["standard",standard],["corporate",experimentalFormScenarios.corporate]] as const;

test("T35: three different forms reuse one strict contract promoted by required CI",()=>{
 const sizes=[1,3,5];
 cases.forEach(([name,spec],i)=>{
  const props=spec.elements[spec.root].props;
  assert.equal(props.fields.length,sizes[i],name);
  assert.equal(declarativeFormFlowSchema.safeParse(props).success,true,name);
  assert.equal(experimentalCatalog.validate(spec).success,true,name);
  assert.equal(catalog.validate(spec).success,true,name+" is available in stable Pi after required CI");
  assert.equal(spec.elements[spec.root].type,"DeclarativeFormFlow");
 });
});

test("T35: required/email/length rules work without arbitrary callbacks",()=>{
 const basic=experimentalFormScenarios.minimal.elements.example.props;
 const invalid=validateDeclarativeValues(basic,{email:"invalid"});
 assert.deepEqual(invalid.email,["E-mail inválido"]);
 assert.deepEqual(validateDeclarativeValues(basic,{email:"hello@example.org"}),{});
 const corporate=experimentalFormScenarios.corporate.elements.example.props;
 const result=validateDeclarativeValues(corporate,{name:"Ana",email:"ana@example.org",password:"123",company:"Empresa"});
 assert.deepEqual(result.password,["Tamanho mínimo: 6"]);
 assert.equal(result.phone,undefined);
 const valid=validateDeclarativeValues(corporate,{name:"Ana",email:"ana@example.org",password:"123456",company:"Empresa"});
 assert.deepEqual(valid,{});
});

test("T35: no unreviewed props, endpoints or duplicate field names",()=>{
 const original=experimentalFormScenarios.corporate.elements.example.props;
 assert.equal(declarativeFormFlowSchema.safeParse({...original,endpoint:"https://example.org"}).success,false);
 assert.equal(declarativeFormFlowSchema.safeParse({...original,onSubmit:"fetch('/delete')"}).success,false);
 assert.equal(declarativeFormFlowSchema.safeParse({...original,fields:[...original.fields,original.fields[0]]}).success,false);
 const entries=JSON.parse(readFileSync("src/ui-catalog/admission-engine/entries.json","utf8")).entries;
 const entry=entries.find((x:{type:string})=>x.type==="DeclarativeFormFlow");
 assert.equal(entry?.tier,"composition");
 const manifest=JSON.parse(readFileSync("pi-catalog/contracts.json","utf8")).components;
 assert.equal(manifest.find((x:{type:string})=>x.type==="DeclarativeFormFlow")?.lifecycle,"stable");
});
