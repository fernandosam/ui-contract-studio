import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync} from "node:fs";
import {join,dirname} from "node:path";
import {tmpdir} from "node:os";
import {spawnSync} from "node:child_process";
import {
  buildSemanticKnowledge, validateSemanticOverlay, selectAgentSemanticAdvice,
} from "../scripts/lib/semantic-knowledge.mjs";
import {buildCompositionAnalysis} from "../scripts/lib/composition-analysis.mjs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const seed=read("src/ui-catalog/knowledge/alert-dialog.json");
const clone=value=>JSON.parse(JSON.stringify(value));
const write=(root,path,value)=>{
  const full=join(root,path);
  mkdirSync(dirname(full),{recursive:true});
  writeFileSync(full,typeof value==="string"?value:JSON.stringify(value));
};

test("semantic knowledge covers existing ReUI and shadcn guidance without creating new Pi types",()=>{
  const analysis=buildCompositionAnalysis();
  assert.deepEqual(analysis.errors,[]);
  const knowledge=analysis.report.semanticKnowledge;
  assert.equal(knowledge.coverage.reuiFamilies,31);
  assert.equal(knowledge.coverage.shadcnGuides,12);
  assert.equal(knowledge.coverage.curatedOverlays,1);
  assert.equal(knowledge.coverage.coveredExamples,559);
  assert.equal(knowledge.reuiExampleProfiles.length,559);
  assert.ok(knowledge.reuiExampleProfiles.every(x=>!x.approvedPiType&&x.hasFamilyGuidance));
  const alert=knowledge.profiles.find(x=>x.component==="AlertDialog");
  assert.equal(alert.documentationReview,"reviewed-documentation");
  assert.equal(alert.approvedPiType,true);
  assert.ok(alert.capabilities.some(x=>x.id==="confirm-signal"&&x.state==="implemented-static-evidence"));
  assert.ok(alert.implementationGaps.some(x=>x.id==="checkbox-gating"));
  assert.ok(alert.implementationGaps.some(x=>x.id==="focus-and-keyboard"));
  assert.equal(alert.integrationCandidates.find(x=>x.component==="Button").implementedDependency,true);
  assert.equal(alert.integrationCandidates.find(x=>x.component==="Checkbox").implementedDependency,false);
  assert.equal(alert.integrationCandidates.find(x=>x.component==="Sonner").approvedPiType,false);
  assert.equal(knowledge.profiles.find(x=>x.component==="Button")?.approvedPiType,true);
});

test("enriched guidance remains advisory and is scoped to explicitly approved Pi types",()=>{
  const report=buildSemanticKnowledge().report;
  const selected=selectAgentSemanticAdvice(report,["AlertDialog","Sonner","UnknownType"]);
  assert.deepEqual(selected.map(x=>x.type),["AlertDialog"]);
  assert.equal(selected[0].guidanceOnly,true);
  assert.ok(selected[0].integrationCandidates.every(x=>x.admission==="not-granted"));
  assert.ok(selected[0].implementationGaps.every(x=>x.state!=="implemented-static-evidence"));
  const blocked=buildSemanticKnowledge({approvedNames:new Set(["Button"])}).report;
  assert.equal(blocked.profiles.find(x=>x.component==="AlertDialog")?.approvedPiType,false);
  assert.deepEqual(selectAgentSemanticAdvice(blocked,["AlertDialog"]),[]);
});

test("curated ReUI behavioral assertions require traceable first-party evidence",()=>{
  assert.deepEqual(validateSemanticOverlay(seed),[]);
  const path="src/ui-catalog/extensions/components/alert-dialog.tsx";
  const old=readFileSync(path,"utf8");
  const folder=mkdtempSync(join(tmpdir(),"ui-semantic-evidence-"));
  try{
    write(folder,path,old);
    write(folder,"src/ui-catalog/extensions/catalog.ts",
      readFileSync("src/ui-catalog/extensions/catalog.ts","utf8"));
    assert.deepEqual(validateSemanticOverlay(seed,folder),[]);
    const altered=clone(seed);
    altered.capabilities[0].evidence[0].contains="FICTITIOUS IMPLEMENTATION";
    assert.ok(validateSemanticOverlay(altered,folder).some(x=>x.includes("stale or missing code evidence")));
    const invented=clone(seed);
    invented.capabilities.find(x=>x.id==="typed-confirmation").state="implemented-static-evidence";
    assert.ok(validateSemanticOverlay(invented,folder).some(x=>x.includes("needs first-party evidence")));
    const injected=clone(seed);
    injected.capabilities[0].evidence[0].path="../../secrets.txt";
    assert.ok(validateSemanticOverlay(injected,folder).some(x=>x.includes("unsafe evidence")));
  }finally{rmSync(folder,{recursive:true,force:true})}
});

test("semantic knowledge fails closed for unknown curated components or stale source assertions",()=>{
  const folder=mkdtempSync(join(tmpdir(),"ui-semantic-knowledge-"));
  try{
    const invalid=clone(seed);
    invalid.component="UnknownComponent";
    write(folder,"src/ui-catalog/knowledge/unknown-component.json",invalid);
    const analyzed=buildSemanticKnowledge({root:folder,approvedNames:new Set()});
    assert.ok(analyzed.errors.some(x=>x.includes("unknown component")));
    assert.ok(analyzed.errors.some(x=>x.includes("invalid curated official source")));
  }finally{rmSync(folder,{recursive:true,force:true})}
});

test("Pi context exports semantic suggestions but grants no extra props, type or actions",()=>{
  const result=spawnSync(process.execPath,[
    "scripts/select-pi-context.mjs","--types=AlertDialog","--stdout","--metadata-only",
  ],{encoding:"utf8"});
  assert.equal(result.status,0,result.stderr);
  const pack=JSON.parse(result.stdout);
  assert.equal(pack.selected.length,1);
  assert.equal(pack.selected[0].contract.type,"AlertDialog");
  assert.equal(pack.metadataOnly,true);
  assert.equal(pack.semanticAdvice.length,1);
  assert.equal(pack.semanticAdvice[0].type,"AlertDialog");
  assert.ok(pack.semanticAdvice[0].implementationGaps.some(x=>x.id==="typed-confirmation"));
  assert.match(pack.semanticAdvicePolicy,/Advisory only/);
  assert.ok(pack.semanticAdvice[0].integrationCandidates.every(x=>x.admission==="not-granted"));
});
