import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {compareLayoutReuseWithCatalog} from "../scripts/lib/layout-reuse-comparison.mjs";
const read=p=>JSON.parse(readFileSync(p,"utf8"));
const evidence=read("src/ui-requirements/layout-reuse-evidence.json");
const lock=read("src/ui-catalog/contracts.lock.json");
const manifest=read("src/ui-catalog/extensions/composites/generated-manifest.json");
const compare=(e=evidence,l=lock,m=manifest,loader=read)=>
 compareLayoutReuseWithCatalog(e,l,m,loader);
const find=(result,parent,child)=>result.comparisons.find(x=>
 x.structure.parentType===parent&&x.structure.childType===child);
test("E05: inventories both independent and same-origin structures without asserting reuse",()=>{
 const result=compare();
 assert.equal(result.summary.candidateCount,5);
 assert.equal(result.summary.crossOriginCount,3);
 assert.equal(result.summary.sameOriginCount,2);
 assert.equal(result.summary.reviewedCompositeCount,manifest.components.length);
 assert.equal(result.summary.matchedCandidateCount,3);
 assert.equal(result.summary.primitiveOnlyCount,2);
 assert.equal(find(result,"Card","Stack").matchStatus,"structural-match-in-existing-composition");
 assert.ok(find(result,"Card","Stack").existingCompositions.some(x=>x.componentName==="Login01"));
 assert.ok(find(result,"Card","Table").existingCompositions.some(x=>x.componentName==="Dashboard01"));
 assert.equal(find(result,"Stack","Link").matchStatus,"already-composable-with-primitives");
 assert.equal(find(result,"Grid","Card").existingCompositionCount,0);
 assert.equal(find(result,"Grid","Card").originEvidenceStatus,"same-origin-candidate");
 for(const comparison of result.comparisons){
  assert.equal(comparison.reuseIsProven,false);
  for(const match of comparison.existingCompositions){
   const spec=read(match.templatePath);
   assert.ok(lock.components.some(x=>x.name===match.componentName&&x.status==="approved"));
   for(const edge of match.occurrences){
    assert.equal(spec.elements[edge.parentId].type,comparison.structure.parentType);
    assert.equal(spec.elements[edge.childId].type,comparison.structure.childType);
    assert.equal(spec.elements[edge.parentId].children[edge.index],edge.childId);
   }
  }
 }
 assert.deepEqual(result,compare(evidence,lock,{...manifest,components:[...manifest.components].reverse()}));
});
test("E05: primitive coverage is not evidence of an existing composite",()=>{
 const result=compare(evidence,lock,{components:[]},()=>{throw Error("should not load")});
 assert.equal(result.summary.matchedCandidateCount,0);
 assert.equal(result.summary.primitiveOnlyCount,5);
});
test("E05: fail closed on unapproved entries, unsafe paths and malformed templates",()=>{
 assert.throws(()=>compare(evidence,lock,{components:[{name:"Login01",template:"../bad.json"}]},read),/unsafe/);
 assert.throws(()=>compare(evidence,lock,{components:[manifest.components[0],manifest.components[0]]},read),/duplicated/);
 const denied={...lock,components:lock.components.map(x=>x.name==="Login01"?{...x,status:"experimental"}:x)};
 assert.throws(()=>compare(evidence,denied,{components:[manifest.components.find(x=>x.name==="Login01")]},read),/not approved/);
 assert.throws(()=>compare(evidence,lock,{components:[manifest.components[0]]},()=>({root:"root",elements:{root:{type:"Unknown",props:{},children:[]}}})),/Invalid composite template/);
 assert.throws(()=>compare({...evidence,recurrentStructures:[evidence.recurrentStructures[0],evidence.recurrentStructures[0]]}),/duplicate E05/);
 assert.throws(()=>compare({...evidence,recurrentStructures:[{...evidence.recurrentStructures[0],originCount:1}]}),/Inconsistent E05/);
});
test("E05: CLI offline check is reproducible and does not authorize new APIs",()=>{
 const first=spawnSync(process.execPath,["scripts/report-layout-reuse-comparison.mjs","--check"],{encoding:"utf8"});
 assert.equal(first.status,0,first.stderr);
 const again=spawnSync(process.execPath,["scripts/report-layout-reuse-comparison.mjs","--check"],{encoding:"utf8"});
 assert.equal(again.status,0,again.stderr);
 assert.equal(first.stdout,again.stdout);
 assert.match(compare().authorization,/does-not-create-admit/);
});
