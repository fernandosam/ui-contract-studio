import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {buildSemanticKnowledge} from "../scripts/lib/semantic-knowledge.mjs";

const read=file=>JSON.parse(readFileSync(file,"utf8"));
const matrix=read("tests/e2e/semantic-risk-cases.json");
const overlay=read("src/ui-catalog/knowledge/alert-dialog.json");
const recommendation=read("src/ui-catalog/recommendations/scenarios.json").scenarios;
const baseline=read("src/ui-catalog/reui-primitive-source-baseline.json");
const scenarios=new Map(recommendation.map(item=>[item.id,item]));
const capabilities=new Map(overlay.capabilities.map(item=>[item.id,item]));
const spec=readFileSync("tests/e2e/semantic-risk-t29.spec.ts","utf8");
const quality=readFileSync(".github/workflows/quality.yml","utf8");
const manual=readFileSync(".github/workflows/e2e-manual.yml","utf8");

test("T29 matrix covers high-impact cases and every browser case has a source reference",()=>{
 assert.equal(matrix.schemaVersion,1);
 const ids=new Set();
 for(const item of matrix.cases){
  assert.match(item.id,/^T29-R\\d{2}$/);
  assert.ok(!ids.has(item.id),item.id+" duplicate");
  ids.add(item.id);
  assert.ok(["P0","P1"].includes(item.priority),item.id);
  assert.ok(item.risk.length>35,item.id+" missing impact");
  assert.ok(existsSync(item.source),item.id+" missing source: "+item.source);
  assert.ok(item.scenarioIds.length>0,item.id);
  assert.match(spec,new RegExp('test\\("'+item.id+' @semantic-risk:'),item.id+" absent in E2E");
  for(const id of item.scenarioIds){
   assert.ok(scenarios.has(id),item.id+" references unknown recommendation "+id);
  }
  for(const id of item.capabilities){
   const cap=capabilities.get(id);
   assert.ok(cap,item.id+" references unknown capability "+id);
   assert.ok(item.scenarioIds.some(s=>scenarios.get(s).requiredCapabilities.includes(id)),
      item.id+" capability not used by source recommendation "+id);
  }
 }
 assert.equal(ids.size,9);
 assert.ok(matrix.cases.filter(item=>item.priority==="P0").length>=5);
 assert.deepEqual([...ids].sort(),matrix.cases.map(item=>item.id).sort());
});

test("T29 capability risks reconcile with current semantic coverage and evidence states",()=>{
 const reuiExamples=baseline.entries.map(item=>({
  id:item.exampleId,family:item.family,sourcePath:item.sourcePath,decision:item.semanticDecision,
 }));
 const {report,errors}=buildSemanticKnowledge({reuiExamples});
 assert.deepEqual(errors,[]);
 const profile=report.profiles.find(item=>item.component==="AlertDialog");
 const coverage=report.semanticCoverage.components.find(item=>item.component==="AlertDialog");
 assert.ok(profile&&coverage);
 assert.equal(coverage.overlay,"src/ui-catalog/knowledge/alert-dialog.json");
 for(const item of matrix.cases.filter(item=>item.capabilities.length)){
  for(const id of item.capabilities){
   const cap=profile.capabilities.find(x=>x.id===id);
   assert.ok(cap,id);
   const index=cap.state==="documented-not-implemented"?"notImplementedCapabilityIds":
    cap.state==="runtime-review-required"?"insufficientRuntimeEvidenceCapabilityIds":
    "verifiedStaticCapabilityIds";
   assert.ok(coverage[index].includes(id),item.id+" coverage drift for "+id);
   if(cap.state==="implemented-static-evidence"){
    for(const e of cap.evidence){
     assert.ok(readFileSync(e.path,"utf8").includes(e.contains),item.id+" missing code needle: "+e.path);
    }
   }else assert.equal(cap.evidence.length,0);
  }
 }
 assert.ok(coverage.capabilityCounts.documentedNotImplemented>=2);
 assert.ok(coverage.capabilityCounts.runtimeReviewRequired>=1);
});

test("T29 is included in existing focused and full E2E paths, without permission changes",()=>{
 assert.match(quality,/tests\\/e2e\\/semantic-risk-t29\\.spec\\.ts/);
 assert.match(quality,/reports\\/semantic-e2e\\//);
 assert.match(manual,/npm run test:e2e/);
 assert.match(manual,/github.ref == 'refs\\/heads\\/main'/);
 assert.match(spec,/certification:"not-granted"/);
 assert.match(spec,/matrixSha256/);
 assert.match(spec,/sourceRevision:process\\.env\\.GITHUB_SHA\\?\\?null/);
 assert.doesNotMatch(spec,/admission:promote|admission:certify|pi:api --write/);
});
