import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync,existsSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {buildSemanticKnowledge,validateSemanticOverlay,selectAgentSemanticAdvice} from "../scripts/lib/semantic-knowledge.mjs";

const readJson=path=>JSON.parse(readFileSync(path,"utf8"));
const baseline=readJson("src/ui-catalog/reui-primitive-source-baseline.json");
const reuiGuidance=readJson("src/ui-catalog/reui-guidance.json");
const knowledgePath="src/ui-catalog/knowledge";
const slug=name=>name.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();
const records=readdirSync(knowledgePath).filter(name=>name.endsWith(".json")).map(filename=>({
  filename,
  record:readJson(`${knowledgePath}/${filename}`),
}));
const reuiFamilies=[...new Set(baseline.entries.map(item=>item.family))].sort();
const knownExtraRecords=[
  "AlertDialog","Combobox","Command","DataTable","DatePicker","Field","Radio","Sheet",
].sort();

test("T19: 31 families and 559 versioned ReUI examples match guidance and curated overlays",()=>{
  assert.equal(baseline.entries.length,559);
  assert.equal(reuiFamilies.length,31);
  assert.deepEqual(Object.keys(reuiGuidance).sort(),reuiFamilies);
  assert.equal(new Set(baseline.entries.map(x=>x.exampleId)).size,559);
  assert.equal(new Set(baseline.entries.map(x=>x.sourcePath)).size,559);
  assert.ok(baseline.entries.every(x=>existsSync(x.sourcePath)),
    "Each inventory entry must refer to a local versioned source");
  const names=records.map(x=>x.record.component);
  assert.equal(new Set(names).size,records.length,"No duplicate curated components");
  assert.deepEqual(names.filter(x=>reuiFamilies.includes(x)).sort(),reuiFamilies);
  assert.deepEqual(names.filter(x=>!reuiFamilies.includes(x)).sort(),knownExtraRecords);
  assert.equal(records.length,39,"31 ReUI families plus eight separate known overlays");
});

test("T19: every curated overlay satisfies T01 and links each capability to a derived test",()=>{
  for(const {filename,record} of records){
    assert.equal(filename,`${slug(record.component)}.json`,record.component);
    assert.deepEqual(validateSemanticOverlay(record),[],record.component);
    assert.equal(record.status,"reviewed-documentation",record.component);
    assert.ok(record.source?.reviewedOn,record.component);
    assert.ok(record.faqDecisions.length>0,`${record.component}: FAQ decisions required`);
    assert.ok(record.integrations.length>0,`${record.component}: integration candidates required`);
    const referenced=new Set(record.derivedTestCases.flatMap(x=>x.capabilities));
    for(const cap of record.capabilities){
      assert.ok(referenced.has(cap.id),`${record.component}: capability ${cap.id} lacks derived test`);
      if(cap.state==="documented-not-implemented"){
        assert.ok(record.derivedTestCases.some(x=>
          x.kind==="candidate-not-executable"&&x.capabilities.includes(cap.id)),
          `${record.component}: candidate ${cap.id} may not be described as executable`);
      }
      if(cap.state==="implemented-static-evidence"){
        assert.ok(cap.evidence.every(x=>x.path.startsWith("src/")),
          `${record.component}: implemented capability must rely on local source`);
      }else{
        assert.deepEqual(cap.evidence,[],`${record.component}: pending capability cannot claim evidence`);
      }
    }
  }
});

test("T19: family-to-overlay mapping remains one-to-one without inventing families",()=>{
  const overlays=new Map(records.map(x=>[x.record.component,x.record]));
  for(const family of reuiFamilies){
    const record=overlays.get(family);
    assert.ok(record,`Missing semantic overlay for ${family}`);
    assert.ok(["ReUI","shadcn"].includes(record.source.provider),
      `${family}: official ReUI or installed shadcn variant required`);
    if(record.source.provider==="ReUI")
      assert.equal(record.source.url,`https://reui.io/components/${slug(family)}`);
    else
      assert.ok(record.source.url.startsWith("https://ui.shadcn.com/docs/components/"),
        `${family}: official shadcn provenance required`);
    assert.match(record.source.reviewedOn,/^\d{4}-\d{2}-\d{2}$/);
    assert.ok(baseline.entries.some(x=>x.family===family));
  }
  assert.equal(overlays.get("AlertDialog")?.component,"AlertDialog",
    "AlertDialog remains a separate existing reference");
});

test("T19: report preserves advisory semantics and Pi admission boundaries",()=>{
  const {report,errors}=buildSemanticKnowledge({reuiExamples:baseline.entries.map(x=>({
    id:x.exampleId,family:x.family,sourcePath:x.sourcePath,decision:x.semanticDecision,
  }))});
  assert.deepEqual(errors,[]);
  assert.equal(report.coverage.curatedOverlays,39);
  assert.equal(report.coverage.reuiFamilies,31);
  assert.equal(report.coverage.coveredExamples,559);
  assert.ok(report.reuiExampleProfiles.every(x=>x.hasFamilyGuidance&&!x.approvedPiType));
  for(const {record} of records){
    const profile=report.profiles.find(x=>x.component===record.component);
    assert.ok(profile,`Missing profile: ${record.component}`);
    assert.equal(profile.curatedSource,`${knowledgePath}/${slug(record.component)}.json`);
    assert.equal(profile.documentationReview,"reviewed-documentation");
    assert.ok(profile.integrationCandidates.every(x=>x.admission==="advisory-only"));
    assert.ok(profile.implementationGaps.every(x=>x.state!=="implemented-static-evidence"));
  }
  const candidates=["Combobox","Command","Sheet"];
  for(const component of candidates){
    assert.equal(report.profiles.find(x=>x.component===component)?.approvedPiType,false,
      `Candidate ${component} must not become a Pi type by documentation`);
  }
  assert.deepEqual(selectAgentSemanticAdvice(report,candidates),[],
    "Candidate records are never admitted merely by semantic enrichment");
});

test("T19: bilingual coverage matrices are traceable to versioned source counts",()=>{
  const counts=new Map(reuiFamilies.map(name=>[name,
    baseline.entries.filter(x=>x.family===name).length,
  ]));
  const source=new Map(records.map(x=>[x.record.component,x.record]));
  for(const file of [
    "docs/semantic-knowledge-coverage-t19.md",
    "docs/semantic-knowledge-coverage-t19.pt-BR.md",
  ]){
    const md=readFileSync(file,"utf8");
    const rowPattern=/^\| \[([A-Z][A-Za-z0-9]+)\]\(\.\.\/src\/ui-catalog\/knowledge\/([a-z-]+)\.json\) \| (\d+) \| (\d+)\/(\d+)\/(\d+) \| (\d+) \|$/gm;
    const rows=[...md.matchAll(rowPattern)];
    assert.equal(rows.length,31,`${file}: expected 31 ReUI-family rows`);
    assert.deepEqual(rows.map(x=>x[1]).sort(),reuiFamilies);
    for(const [,name,filename,examples,implemented,documented,runtime,cases] of rows){
      assert.equal(filename,slug(name),name);
      const doc=source.get(name);
      assert.ok(doc,`${name}: missing overlay`);
      assert.equal(Number(examples),counts.get(name),name);
      assert.equal(Number(implemented),doc.capabilities.filter(x=>x.state==="implemented-static-evidence").length,name);
      assert.equal(Number(documented),doc.capabilities.filter(x=>x.state==="documented-not-implemented").length,name);
      assert.equal(Number(runtime),doc.capabilities.filter(x=>x.state==="runtime-review-required").length,name);
      assert.equal(Number(cases),doc.derivedTestCases.length,name);
    }
    assert.match(md,/\*\*559\*\* \| \*\*181\/103\/72\*\* \| \*\*257\*\*/);
  }
  assert.equal(records.reduce((n,x)=>n+x.record.capabilities.length,0),444);
  assert.equal(records.reduce((n,x)=>n+x.record.derivedTestCases.length,0),315);
});

test("T19: the semantic CLI reports 559 inventory examples, not zero",()=>{
  const result=spawnSync(process.execPath,["scripts/analyze-semantic-knowledge.mjs","--check"],{encoding:"utf8"});
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/"reuiFamilies":31/);
  assert.match(result.stdout,/"curatedOverlays":39/);
  assert.match(result.stdout,/"coveredExamples":559/);
});
