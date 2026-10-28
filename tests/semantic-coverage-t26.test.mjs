import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, readdirSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {buildSemanticKnowledge} from "../scripts/lib/semantic-knowledge.mjs";
import {buildSemanticCoverage} from "../scripts/lib/semantic-coverage.mjs";

const read = path => JSON.parse(readFileSync(path, "utf8"));
const baselinePath = "src/ui-catalog/reui-primitive-source-baseline.json";
const recordsPath = "src/ui-catalog/knowledge/";
const count = (caps,state) => caps.filter(cap => cap.state === state).length;
const examples = baseline => baseline.entries.map(x => ({
  id:x.exampleId,family:x.family,sourcePath:x.sourcePath,decision:x.semanticDecision,
}));

test("T26: documentary gaps, implementation gaps and runtime evidence remain distinct",()=>{
  const cap = (id,state,evidence=[]) => ({id,state,evidence});
  const profiles = [
    {component:"Beta",sources:["src/ui-catalog/reui-guidance.json"],capabilities:[],approvedPiType:true},
    {component:"Alpha",curatedSource:recordsPath+"alpha.json",
      documentationReview:"reviewed-documentation",sources:[recordsPath+"alpha.json"],
      approvedPiType:false,capabilities:[
        cap("static","implemented-static-evidence",[{path:"src/alpha.tsx",contains:"return"}]),
        cap("missing","documented-not-implemented"),
        cap("browser","runtime-review-required"),
      ]},
    {component:"Extra",curatedSource:recordsPath+"extra.json",
      documentationReview:"reviewed-documentation",sources:[recordsPath+"extra.json"],
      approvedPiType:false,capabilities:[cap("future","documented-not-implemented")]},
  ];
  const args={profiles,reuiFamilies:["Beta","Alpha"],reuiExamples:[
    {family:"Alpha",exampleId:"ex-2"},{family:"Alpha",exampleId:"ex-1"},
  ]};
  const actual=buildSemanticCoverage(args);
  assert.deepEqual(actual.families.map(x=>x.family),["Alpha","Beta"]);
  assert.deepEqual(actual.components.map(x=>x.component),["Alpha","Beta","Extra"]);
  assert.deepEqual(actual.families[0].inventoryExampleIds,["ex-1","ex-2"]);
  assert.equal(actual.families[1].documentationGap,true);
  assert.equal(actual.families[1].documentation,"guidance-only");
  assert.deepEqual(actual.totals.capabilities,{
    implementedStaticEvidence:1,documentedNotImplemented:2,runtimeReviewRequired:1,
  });
  assert.equal(actual.totals.inventoryFamilies,1);
  assert.equal(actual.totals.curatedFamilies,1);
  assert.equal(actual.totals.curatedComponents,2);
  assert.equal(actual.totals.implementationGaps,2);
  assert.equal(actual.totals.insufficientRuntimeEvidence,1);
  assert.deepEqual(actual.components[0].verifiedStaticCapabilityIds,["static"]);
  assert.deepEqual(actual.components[0].notImplementedCapabilityIds,["missing"]);
  assert.deepEqual(actual.components[0].insufficientRuntimeEvidenceCapabilityIds,["browser"]);
  assert.equal(actual.components[1].piContractListed,true);
  assert.equal(actual.components[1].authorization,"not-granted-by-semantic-coverage");
  assert.deepEqual(actual,buildSemanticCoverage({
    ...args,profiles:profiles.toReversed(),reuiExamples:args.reuiExamples.toReversed(),
  }));
});

test("T26: family, component and code-evidence indexes reconcile with real source files",()=>{
  const baseline=read(baselinePath);
  const reuiGuidance=read("src/ui-catalog/reui-guidance.json");
  const overlays=readdirSync(recordsPath).filter(x=>x.endsWith(".json")).map(filename=>({
    path:recordsPath+filename,record:read(recordsPath+filename),
  }));
  const {report,errors}=buildSemanticKnowledge({reuiExamples:examples(baseline)});
  assert.deepEqual(errors,[]);
  const coverage=report.semanticCoverage;
  assert.equal(coverage.sourcePaths.inventory,baselinePath);
  assert.deepEqual(coverage.families.map(x=>x.family),Object.keys(reuiGuidance).sort());
  assert.equal(coverage.totals.inventoryExamples,baseline.entries.length);
  assert.equal(coverage.totals.curatedComponents,overlays.length);
  assert.equal(coverage.totals.curatedFamilies,overlays.filter(x=>
    Object.hasOwn(reuiGuidance,x.record.component)).length);
  assert.equal(coverage.totals.familiesWithDocumentationGaps,0);
  const totals={implementedStaticEvidence:0,documentedNotImplemented:0,runtimeReviewRequired:0};
  for(const {path,record} of overlays){
    const component=coverage.components.find(x=>x.component===record.component);
    const profile=report.profiles.find(x=>x.component===record.component);
    assert.ok(component,record.component);
    assert.equal(component.overlay,path);
    assert.equal(component.documentation,record.status);
    assert.deepEqual(profile.capabilities,record.capabilities);
    for(const [property,state] of [
      ["implementedStaticEvidence","implemented-static-evidence"],
      ["documentedNotImplemented","documented-not-implemented"],
      ["runtimeReviewRequired","runtime-review-required"],
    ]){
      assert.equal(component.capabilityCounts[property],count(record.capabilities,state));
      totals[property]+=component.capabilityCounts[property];
    }
    for(const [field,state] of [
      ["verifiedStaticCapabilityIds","implemented-static-evidence"],
      ["notImplementedCapabilityIds","documented-not-implemented"],
      ["insufficientRuntimeEvidenceCapabilityIds","runtime-review-required"],
    ]) assert.deepEqual(component[field],record.capabilities.filter(x=>x.state===state).map(x=>x.id).sort());
    for(const capability of record.capabilities){
      if(capability.state==="implemented-static-evidence"){
        assert.ok(capability.evidence.length>0);
        for(const evidence of capability.evidence)
          assert.ok(readFileSync(evidence.path,"utf8").includes(evidence.contains),
            record.component+"/"+capability.id+": "+evidence.path);
      }else assert.deepEqual(capability.evidence,[]);
    }
  }
  assert.deepEqual(coverage.totals.capabilities,totals);
  assert.equal(coverage.totals.implementationGaps,totals.documentedNotImplemented);
  assert.equal(coverage.totals.insufficientRuntimeEvidence,totals.runtimeReviewRequired);
  for(const family of coverage.families){
    const entries=baseline.entries.filter(x=>x.family===family.family);
    assert.equal(family.inventoryExampleCount,entries.length);
    assert.deepEqual(family.inventoryExampleIds,entries.map(x=>x.exampleId).sort());
    assert.equal(family.overlay,coverage.components.find(x=>x.component===family.family)?.overlay);
    for(const id of family.inventoryExampleIds)
      assert.ok(report.reuiExampleProfiles.some(x=>x.exampleId===id&&x.family===family.family));
  }
  assert.ok(coverage.components.every(x=>x.authorization==="not-granted-by-semantic-coverage"));
  for(const name of ["Combobox","Command","Sheet"])
    assert.equal(coverage.components.find(x=>x.component===name)?.piContractListed,false);
});

test("T26: semantic:check and semantic:report use one validated output path",()=>{
  const check=spawnSync(process.execPath,["scripts/analyze-semantic-knowledge.mjs","--check"],{encoding:"utf8"});
  assert.equal(check.status,0,check.stderr);
  const result=spawnSync(process.execPath,["scripts/analyze-semantic-knowledge.mjs","--write"],{encoding:"utf8"});
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/reports\/composition-analysis\/semantic-knowledge.json/);
  const generated=read("reports/composition-analysis/semantic-knowledge.json");
  const expected=buildSemanticKnowledge({reuiExamples:examples(read(baselinePath))}).report;
  assert.deepEqual(generated,expected);
});
