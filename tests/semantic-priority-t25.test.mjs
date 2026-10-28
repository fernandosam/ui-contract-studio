import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {rankSemanticEnrichment,ENRICHMENT_CRITERIA} from "../scripts/lib/semantic-priority.mjs";
import {buildSemanticKnowledge} from "../scripts/lib/semantic-knowledge.mjs";

const profile = (component,extra={}) => ({
  component,curatedSource:`src/ui-catalog/knowledge/${component.toLowerCase()}.json`,
  documentationReview:"reviewed-documentation",
  whenNotUse:["avoid"],agentNotes:["do not invent APIs"],
  capabilities:[],integrations:[],derivedTestCases:[],approvedPiType:false,...extra,
});
const clone = value => structuredClone(value);
const examples = Array.from({length:31},(_,index) => ({exampleId:`a-${index}`,family:"Alpha"}));

test("T25 scoring is reproducible, evidence-backed and sorted by score then stable name",() => {
  const profiles = [
    profile("Alpha",{
      approvedPiType:true,integrations:[{component:"Beta"},{component:"Gamma"}],
      capabilities:[
        {id:"not-implemented-2",state:"documented-not-implemented"},
        {id:"not-implemented-1",state:"documented-not-implemented"},
        {id:"browser",state:"runtime-review-required"},
        {id:"available",state:"implemented-static-evidence"},
      ],
      derivedTestCases:[{id:"manual",kind:"manual-a11y"},{id:"proposal",kind:"candidate-not-executable"}],
    }),
    profile("Beta",{integrations:[{component:"Alpha"},{component:"Alpha"}]}),
    {component:"Gamma",whenUse:["foo"],integrations:[],capabilities:[],derivedTestCases:[]},
  ];
  const before=clone(profiles);
  const report=rankSemanticEnrichment(profiles,examples);
  assert.equal(report.entries.length,3);
  assert.deepEqual(report.entries.map(x=>x.component),["Alpha","Gamma","Beta"]);
  const a=report.entries[0];
  assert.equal(a.points.reuiExamples,16);
  assert.deepEqual(a.signals.referencedBy,["Beta"]);
  assert.deepEqual(a.signals.unimplementedCapabilities,["not-implemented-1","not-implemented-2"]);
  assert.equal(a.points.unimplemented,6);
  assert.equal(a.points.runtimeReview,3);
  assert.equal(a.points.highRiskTests,4);
  assert.equal(a.score,37);
  assert.equal(a.authorization,"advisory-only");
  assert.equal(a.rank,1);
  assert.deepEqual(profiles,before,"ranking must not mutate input or approve a candidate");
  const reversed=rankSemanticEnrichment(clone(profiles).reverse(),clone(examples).reverse());
  assert.deepEqual(report,reversed,"input ordering cannot change any scores, evidence or ranks");
  assert.equal(ENRICHMENT_CRITERIA.reduce((sum,x)=>sum+x.max,0),106);
});

test("T25 partial knowledge is explicit uncertainty, never invented runtime or implementation evidence",() => {
  const results=rankSemanticEnrichment([
    {component:"Sparse",integrationCandidates:[]},
    profile("Complete",{approvedPiType:true}),
  ]).entries;
  const sparse=results.find(x=>x.component==="Sparse");
  assert.equal(sparse.score,20);
  assert.equal(sparse.points.unimplemented,0);
  assert.equal(sparse.points.runtimeReview,0);
  assert.equal(sparse.dataCompleteness,"partial");
  assert.ok(sparse.missingData.includes("capabilities-not-inventoried"));
  assert.ok(sparse.missingData.includes("derived-tests-not-inventoried"));
  assert.ok(sparse.missingData.includes("curated-capability-evidence-not-reviewed"));
  assert.deepEqual(results.find(x=>x.component==="Complete").missingData,[]);
  assert.deepEqual(rankSemanticEnrichment([],[]).entries,[]);
  assert.throws(()=>rankSemanticEnrichment([{component:"One"},{component:"One"}]),/Duplicate/);
  assert.throws(()=>rankSemanticEnrichment([{}]),/component name/);
});

test("T25 ties, caps and approval neutrality preserve stable scoring independently of Pi status",() => {
  const caps=Array.from({length:20},(_,i)=>({id:`gap-${i}`,state:"documented-not-implemented"}));
  const p=profile("Same",{capabilities:caps,integrations:Array.from({length:20},(_,i)=>({component:`Target${i}`}))});
  const q=profile("Another",{capabilities:caps,integrations:Array.from({length:20},(_,i)=>({component:`Target${i}`}))});
  const [a,b]=rankSemanticEnrichment([p,q]).entries;
  assert.deepEqual([a.component,b.component],["Another","Same"]);
  assert.equal(a.points.unimplemented,18);
  assert.equal(a.points.outboundIntegrations,12);
  const modified=clone(p);
  modified.approvedPiType=true;
  modified.knowledgeAdmission="existing-catalog-guidance";
  modified.contractDependencies=["Admin"];
  const compare=rankSemanticEnrichment([p]).entries[0];
  const after=rankSemanticEnrichment([modified]).entries[0];
  assert.deepEqual(after,compare,"Pi status and authorized dependencies must not enter ranking");
});

test("T25 integrates into the existing semantic report using only inventoried data",() => {
  const baseline=JSON.parse(readFileSync("src/ui-catalog/reui-primitive-source-baseline.json","utf8"));
  const reuiExamples=baseline.entries.map(x=>({id:x.exampleId,family:x.family,sourcePath:x.sourcePath}));
  const {report,errors}=buildSemanticKnowledge({reuiExamples});
  assert.deepEqual(errors,[]);
  const priority=report.enrichmentPriorities;
  assert.equal(priority.schemaVersion,1);
  assert.equal(priority.entries.length,report.profiles.length);
  assert.ok(priority.entries.length>=39);
  assert.ok(priority.entries.every((x,i)=>
    x.authorization==="advisory-only" && x.rank===i+1 && x.score===Object.values(x.points).reduce((a,b)=>a+b,0)));
  assert.ok(priority.entries.every((x,i)=>i===0 || priority.entries[i-1].score>=x.score));
  assert.equal(priority.entries.find(x=>x.component==="Button").signals.reuiExampleCount,61);
  assert.equal(priority.entries.find(x=>x.component==="AlertDialog").signals.reuiExampleCount,0);
  assert.ok(priority.entries.some(x=>x.signals.unimplementedCapabilities.length>0));
  assert.ok(priority.entries.every(x=>!Object.hasOwn(x,"approvedPiType") && !Object.hasOwn(x,"admitted")));
  const contextBefore=report.profiles.find(x=>x.component==="AlertDialog");
  assert.ok(contextBefore.approvedPiType);
  assert.ok(contextBefore.integrationCandidates.every(x=>x.admission==="advisory-only"));
});

test("T25 semantic CLI checks and publishes a ranked advisory report",() => {
  for(const argument of ["--check","--write"]) {
    const result=spawnSync(process.execPath,["scripts/analyze-semantic-knowledge.mjs",argument],{encoding:"utf8"});
    assert.equal(result.status,0,result.stderr || result.stdout);
  }
  const report=JSON.parse(readFileSync("reports/composition-analysis/semantic-knowledge.json","utf8"));
  assert.ok(report.enrichmentPriorities.entries.length);
  assert.match(report.enrichmentPriorities.purpose,/never contract admission/);
  assert.match(report.disclaimer,/do not authorize/);
});
