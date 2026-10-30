import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {readLayoutPatterns,buildLayoutReuse} from "../scripts/lib/layout-reuse.mjs";

const allowed=["Card","Table","Stack","Link","Grid","Text"];
const entry=(id,origin,types,{approved=true,props={}}={})=>{
 const elements=Object.fromEntries(types.map(([nodeId,type,children])=>
  [nodeId,{type,props:nodeId==="root"?props:{},children}]));
 return {id,sourcePath:"src/ui-patterns/"+id+".json",
  metadataPath:"src/ui-patterns/"+id+".meta.json",
  meta:{id,approved,immutableContracts:true,sourceRoot:"root",originScreen:origin},
  spec:{root:"root",elements}};
};

test("E05: real reviewed layout source evidence is deterministic and recheckable",()=>{
 const lock=JSON.parse(readFileSync("src/ui-catalog/contracts.lock.json","utf8"));
 const report=buildLayoutReuse(readLayoutPatterns(),lock.components.map(x=>x.name));
 const persisted=JSON.parse(readFileSync("src/ui-requirements/layout-reuse-evidence.json","utf8"));
 assert.deepEqual(report,persisted);
 assert.equal(report.summary.approvedLayoutCount,8);
 assert.equal(report.summary.crossOriginStructureCount,3);
 assert.equal(report.summary.sameOriginCandidateCount,2);
 assert.deepEqual(report.recurrentStructures.map(x=>x.structure),[
  {parentType:"Card",childType:"Stack",relation:"children"},
  {parentType:"Card",childType:"Table",relation:"children"},
  {parentType:"Stack",childType:"Link",relation:"children"},
 ]);
 assert.equal(report.status,"static-evidence-only");
 assert.match(report.authorization,/does-not-admit/);
 assert.match(report.limitations,/not independent human approval/);
 for(const structure of report.recurrentStructures){
  assert.ok(structure.layoutCount>=2&&structure.originCount>=2);
  assert.equal(structure.evidence.length,structure.occurrenceCount);
  for(const evidence of structure.evidence){
   const source=JSON.parse(readFileSync(evidence.sourcePath,"utf8"));
   const meta=JSON.parse(readFileSync(evidence.metadataPath,"utf8"));
   assert.equal(meta.approved,true);
   assert.equal(meta.originScreen,evidence.originScreen);
   const parent=source.elements[evidence.parentId];
   const child=source.elements[evidence.childId];
   assert.equal(parent.type,structure.structure.parentType);
   assert.equal(child.type,structure.structure.childType);
   assert.equal(parent.children[evidence.index],evidence.childId);
  }
 }
 const cli=spawnSync(process.execPath,["scripts/report-layout-reuse.mjs","--check"],{encoding:"utf8"});
 assert.equal(cli.status,0,cli.stderr);
});

test("E05: repeated edges in one layout are not evidence of cross-layout reuse",()=>{
 const one=entry("one","screen-a",[
  ["root","Card",["a","b"]],["a","Table",[]],["b","Table",[]]
 ]);
 const result=buildLayoutReuse([one],allowed);
 assert.equal(result.recurrentStructures.length,0);
 assert.equal(result.sameOriginCandidates.length,0);
});

test("E05: two approved patterns sharing one origin remain tentative only",()=>{
 const a=entry("a","same-screen",[["root","Card",["t"]],["t","Table",[]]]);
 const b=entry("b","same-screen",[["root","Card",["t"]],["t","Table",[]]]);
 const report=buildLayoutReuse([a,b],allowed);
 assert.equal(report.recurrentStructures.length,0);
 assert.equal(report.sameOriginCandidates.length,1);
 assert.equal(report.sameOriginCandidates[0].status,"same-origin-candidate");
 assert.deepEqual(report.sameOriginCandidates[0].layoutIds,["a","b"]);
});

test("E05: distinguish true cross-origin recurrence, ignore IDs and content values",()=>{
 const a=entry("a","screen-a",[["root","Card",["t"]],["t","Table",[]]],{props:{title:"First"}});
 const b=entry("b","screen-b",[["root","Card",["else"]],["else","Table",[]]],{props:{title:"Second"}});
 const c=entry("c","screen-c",[["root","Card",["x"]],["x","Text",[]]],{approved:false});
 const actual=buildLayoutReuse([c,b,a],allowed);
 assert.equal(actual.recurrentStructures.length,1);
 assert.deepEqual(actual.recurrentStructures[0].layoutIds,["a","b"]);
 assert.deepEqual(actual.recurrentStructures[0].originScreens,["screen-a","screen-b"]);
 assert.deepEqual(actual.excludedLayouts,["c"]);
 assert.deepEqual(actual,buildLayoutReuse([a,b,c],allowed));
 assert.equal(actual.recurrentStructures[0].evidence[1].childId,"else");
});

test("E05: malformed approval metadata and invalid trees fail closed",()=>{
 const a=entry("a","first",[["root","Card",["t"]],["t","Table",[]]]);
 assert.throws(()=>buildLayoutReuse([{...a,meta:{...a.meta,id:"wrong"}}],allowed),/metadata ID/);
 assert.throws(()=>buildLayoutReuse([{...a,meta:{...a.meta,sourceRoot:"other"}}],allowed),/provenance/);
 assert.throws(()=>buildLayoutReuse([{...a,meta:{...a.meta,immutableContracts:false}}],allowed),/provenance/);
 assert.throws(()=>buildLayoutReuse([{...a,spec:{...a.spec,elements:{root:{type:"Unknown",props:{},children:[]}}}}],allowed),/invalid approved JSON tree/);
 assert.throws(()=>buildLayoutReuse([{...a,spec:{...a.spec,elements:{root:{type:"Card",props:{},children:["missing"]}}}}],allowed),/invalid approved JSON tree/);
 assert.throws(()=>buildLayoutReuse([a,a],allowed),/Duplicate/);
});
