import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {inspectEvidence} from "../scripts/admission-evidence.mjs";
import {evaluatePolicy} from "../scripts/admission-engine.mjs";

const json=path=>JSON.parse(readFileSync(path,"utf8"));
const protocolCatalog=json("src/ui-catalog/admission-engine/protocols.json");
const policy=json("src/ui-catalog/admission-engine/policy.json");
const entries=json("src/ui-catalog/admission-engine/entries.json").entries;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.from("synthetic-unit-only")]);

test("every eligible experimental candidate has a distinct, declared browser protocol",()=>{
 assert.deepEqual([...policy.e2eEligible].sort(),policy.allowedScenarios.slice().sort());
 assert.deepEqual(Object.keys(protocolCatalog.candidates).sort(),policy.e2eEligible.slice().sort());
 assert.equal(new Set(Object.values(protocolCatalog.candidates).map(x=>x.protocol)).size,4);
 for(const id of policy.e2eEligible){
  const entry=entries.find(x=>x.id===id),protocol=protocolCatalog.candidates[id];
  assert.ok(entry);
  assert.equal(entry.type,protocol.target);
  assert.equal(entry.e2eProtocol,protocol.protocol);
  assert.ok(protocol.cases.length>=3);
  assert.equal(new Set(protocol.cases).size,protocol.cases.length);
 }
});
function createEvidence(root,id,entry,protocol,revision) {
 for(const project of protocolCatalog.projects)for(const caseId of protocol.cases){
  const dir=join(root,protocol.evidenceRoot,project);
  mkdirSync(dir,{recursive:true});
  const record={
   schemaVersion:1,scenarioId:id,target:entry.type,sourceDigest:entry.sourceDigest,
   protocol:protocol.protocol,project,caseId,status:"passed",
   expectedStatus:"passed",retry:0,screenshotStatus:"captured",errors:[]
  };
  writeFileSync(join(dir,caseId+".json"),JSON.stringify(record));
  writeFileSync(join(dir,caseId+".png"),png);
 }
 const screenshots=inspectEvidence(root,id,entry,protocol).screenshots;
 const summary={
  schemaVersion:1,scenarioId:id,target:entry.type,sourceDigest:entry.sourceDigest,
  sourceRevision:revision,protocol:protocol.protocol,
  browserChecks:{status:"passed",projects:protocolCatalog.projects,cases:protocol.cases,executions:screenshots.length},
  screenshots
 };
 writeFileSync(join(root,protocol.evidenceRoot,"summary.json"),JSON.stringify(summary));
}
test("candidate evidence is fail-closed on screenshot loss, wrong digest, wrong revision or failed case",t=>{
 const root=mkdtempSync(join(tmpdir(),"admission-cases-"));
 t.after(()=>rmSync(root,{recursive:true,force:true}));
 const id="accordion-members",entry=entries.find(x=>x.id===id),protocol=protocolCatalog.candidates[id];
 const revision="a".repeat(40);
 createEvidence(root,id,entry,protocol,revision);
 assert.equal(inspectEvidence(root,id,entry,protocol,revision).executions,6);
 assert.throws(()=>inspectEvidence(root,id,entry,protocol,"b".repeat(40)),/stale/);
 const file=join(root,protocol.evidenceRoot,"mobile",protocol.cases[0]+".json");
 const content=JSON.parse(readFileSync(file,"utf8"));
 content.sourceDigest="f".repeat(64);
 writeFileSync(file,JSON.stringify(content));
 assert.throws(()=>inspectEvidence(root,id,entry,protocol,revision),/failed\/incompatible/);
 content.sourceDigest=entry.sourceDigest;
 content.status="failed";
 writeFileSync(file,JSON.stringify(content));
 assert.throws(()=>inspectEvidence(root,id,entry,protocol,revision),/failed\/incompatible/);
 content.status="passed";
 writeFileSync(file,JSON.stringify(content));
 rmSync(join(root,protocol.evidenceRoot,"mobile",protocol.cases[0]+".png"));
 assert.throws(()=>inspectEvidence(root,id,entry,protocol,revision),/missing evidence/);
});
test("unknown E2E protocol remains ineligible even when recipe allowlisted",()=>{
 const clone=structuredClone(protocolCatalog);
 delete clone.candidates["button-copy"];
 const recipes=json("scripts/composition-codegen/recipes.json");
 const scenarios=json("src/ui-catalog/recommendations/scenarios.json");
 const lock=json("src/ui-catalog/contracts.lock.json");
 const pi=json("pi-catalog/contracts.json");
 const sources=json("src/ui-catalog/sources.json");
 const errors=evaluatePolicy({policy,recipes,scenarios,lock,pi,sources,protocols:clone});
 assert.ok(errors.some(x=>x.includes("button-copy: no verified browser evidence protocol")));
});
