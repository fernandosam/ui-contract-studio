import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {compareLayoutReuseWithCatalog} from "../scripts/lib/layout-reuse-comparison.mjs";
import {buildLayoutCompositionProposals} from "../scripts/lib/layout-composition-proposals.mjs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const evidence=read("src/ui-requirements/layout-reuse-evidence.json");
const lock=read("src/ui-catalog/contracts.lock.json");
const manifest=read("src/ui-catalog/extensions/composites/generated-manifest.json");
const schema=read("pi-catalog/props-json-schema.json");
const compare=()=>compareLayoutReuseWithCatalog(evidence,lock,manifest,read);
const build=(c=compare(),e=evidence,l=lock,s=schema,loader=read)=>
 buildLayoutCompositionProposals(c,e,l,s,loader);
const find=(output,parent,child)=>output.proposals.find(x=>
 x.structure.parentType===parent&&x.structure.childType===child);

test("E05: all proposals have purpose, actual primitive props, slots and pinned dependencies",()=>{
 const result=build();
 assert.equal(result.status,"proposals-only-not-authorized");
 assert.deepEqual(result.summary,{
  candidateCount:5,independentOriginCount:3,sameOriginCount:2,
  existingCompositeReviewCount:2,primitiveAssemblyCount:1
 });
 for(const item of result.proposals){
  assert.ok(item.purpose.length>20);
  assert.equal(item.status,"advisory-not-admitted");
  assert.ok(item.slots.some(x=>x.name==="content"&&x.proposedBinding.startsWith("parent.")));
  assert.equal(item.permissionImpact,"none");
  assert.ok(item.evidence.length>=2);
  assert.ok(item.dependencies.primitives.length>=2);
  for(const dependency of item.dependencies.primitives){
   assert.match(dependency.fingerprint,/^[0-9a-f]{64}$/);
   assert.equal(dependency.lockPath,"src/ui-catalog/contracts.lock.json");
  }
  for(const role of ["parent","child"]){
   const type=item.structure[role+"Type"];
   const declared=schema.types[type].properties;
   assert.deepEqual(item.properties[role].map(x=>x.name).sort(),
    Object.keys(declared).sort());
   for(const field of item.properties[role]){
    assert.equal(field.scope,"primitive-property-only-not-an-admitted-composite-property");
    assert.equal(field.required,(schema.types[type].required??[]).includes(field.name));
    assert.ok(field.schemaPointer.includes("/properties/"));
   }
  }
 }
 assert.equal(find(result,"Card","Stack").strategy,"review-existing-compositions-first");
 assert.equal(find(result,"Card","Table").strategy,"review-existing-compositions-first");
 assert.ok(find(result,"Card","Table").dependencies.inspectExistingCompositions.some(x=>x.name==="Dashboard01"));
 assert.equal(find(result,"Stack","Link").strategy,"compose-admitted-primitives");
 assert.ok(find(result,"Stack","Link").properties.child.find(x=>x.name==="href").observedIn.length>0);
 assert.equal(find(result,"Card","Grid").strategy,"observe-until-independent-origins");
 assert.equal(find(result,"Grid","Card").strategy,"observe-until-independent-origins");
 assert.equal(find(result,"Grid","Card").slots.length,2);
 assert.doesNotMatch(JSON.stringify(result),/TRT-DEMO-001|Voltar ao dashboard/);
 assert.deepEqual(result,build());
});

test("E05: properties must come from exported closed schemas, not invented APIs",()=>{
 const invalid=structuredClone(schema);
 delete invalid.types.Link.properties.href;
 assert.throws(()=>build(compare(),evidence,lock,invalid),/Source properties not in admitted primitive schema/);
 const missing=structuredClone(schema);
 delete missing.types.Grid;
 assert.throws(()=>build(compare(),evidence,lock,missing),/Missing closed primitive JSON schema/);
 const open=structuredClone(schema);
 open.types.Card.additionalProperties=true;
 assert.throws(()=>build(compare(),evidence,lock,open),/Missing closed primitive JSON schema/);
});

test("E05: stale pointers, missing comparisons and unapproved primitives fail closed",()=>{
 const source=compare();
 assert.throws(()=>build({...source,comparisons:source.comparisons.slice(1)}),/missing candidates/);
 const changed=structuredClone(evidence);
 changed.recurrentStructures[0].evidence[0].childId="invented";
 assert.throws(()=>build(source,changed),/no longer matches/);
 const denied=structuredClone(lock);
 denied.components.find(x=>x.name==="Link").status="experimental";
 assert.throws(()=>build(source,evidence,denied),/Missing approved, versioned primitive/);
 const corrupt=structuredClone(source);
 corrupt.comparisons[0].existingCompositionCount++;
 assert.throws(()=>build(corrupt),/Invalid E05 candidate metadata/);
});

test("E05: CLI check is repeatable without writing artifacts or publishing",()=>{
 const call=()=>spawnSync(process.execPath,["scripts/report-layout-composition-proposals.mjs","--check"],{encoding:"utf8"});
 const first=call(),second=call();
 assert.equal(first.status,0,first.stderr);
 assert.equal(second.status,0,second.stderr);
 assert.equal(first.stdout,second.stdout);
 assert.match(first.stdout,/No admission/);
});
