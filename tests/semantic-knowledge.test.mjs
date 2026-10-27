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
import {extractReuiMarkdown} from "../scripts/lib/extract-reui-markdown.mjs";

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
  assert.ok(knowledge.coverage.curatedOverlays >= 2);
  assert.equal(knowledge.coverage.coveredExamples,559);
  assert.equal(knowledge.reuiExampleProfiles.length,559);
  assert.ok(knowledge.reuiExampleProfiles.every(x=>!x.approvedPiType&&x.hasFamilyGuidance));
  const alert=knowledge.profiles.find(x=>x.component==="AlertDialog");
  assert.equal(alert.documentationReview,"reviewed-documentation");
  assert.equal(alert.approvedPiType,true);
  assert.ok(alert.capabilities.some(x=>x.id==="confirm-signal"&&x.state==="implemented-static-evidence"));
  assert.ok(alert.capabilities.some(x=>x.id==="explicit-cancel"&&x.state==="implemented-static-evidence"));
  assert.ok(alert.capabilities.some(x=>x.id==="small-size-footer"&&x.state==="implemented-static-evidence"));
  assert.ok(alert.implementationGaps.some(x=>x.id==="checkbox-gating"));
  assert.ok(alert.implementationGaps.some(x=>x.id==="focus-and-keyboard"));
  assert.equal(alert.integrationCandidates.find(x=>x.component==="Button").implementedDependency,true);
  assert.equal(alert.integrationCandidates.find(x=>x.component==="Checkbox").implementedDependency,false);
  assert.equal(alert.integrationCandidates.find(x=>x.component==="Sonner").approvedPiType,false);
  assert.equal(knowledge.profiles.find(x=>x.component==="Button")?.approvedPiType,true);
});

test("DropdownMenu T03 distinguishes local Pi features from navigation, authorization, and runtime gaps",()=>{
  const dropdown=read("src/ui-catalog/knowledge/dropdown-menu.json");
  assert.deepEqual(validateSemanticOverlay(dropdown),[]);
  assert.equal(dropdown.source.url,"https://reui.io/components/dropdown-menu");
  assert.equal(dropdown.source.reviewedOn,"2026-10-26");
  const {report,errors}=buildSemanticKnowledge();
  assert.deepEqual(errors,[]);
  const menu=report.profiles.find(x=>x.component==="DropdownMenu");
  assert.equal(menu.documentationReview,"reviewed-documentation");
  assert.equal(menu.approvedPiType,true);
  assert.ok(menu.capabilities.some(x=>x.id==="single-level-submenu"&&x.state==="implemented-static-evidence"));
  assert.ok(menu.capabilities.some(x=>x.id==="local-checkbox"&&x.state==="implemented-static-evidence"));
  assert.ok(menu.capabilities.some(x=>x.id==="select-signal"&&x.state==="implemented-static-evidence"));
  for(const id of ["item-link-navigation","action-permission-policy","radio-or-exclusive-choice","nested-submenus"]){
    assert.ok(menu.implementationGaps.some(x=>x.id===id&&x.state==="documented-not-implemented"));
    assert.ok(!menu.capabilities.find(x=>x.id===id).evidence.length);
  }
  for(const id of ["group-label-semantics","keyboard-focus-a11y"]){
    assert.ok(menu.implementationGaps.some(x=>x.id===id&&x.state==="runtime-review-required"));
  }
  assert.ok(menu.derivedTestCases.some(x=>x.id==="restricted-navigation-and-permissions"&&x.kind==="candidate-not-executable"));
  assert.ok(menu.derivedTestCases.some(x=>x.id==="keyboard-and-submenu-a11y"&&x.kind==="manual-a11y"));
  const advice=selectAgentSemanticAdvice(report,["DropdownMenu"]);
  assert.equal(advice.length,1);
  assert.equal(advice[0].guidanceOnly,true);
  assert.ok(advice[0].integrationCandidates.every(x=>x.admission==="not-granted"));
  assert.ok(!advice[0].verifiedStaticCapabilities.some(x=>x.id==="action-permission-policy"));
  const stale=clone(dropdown);
  stale.capabilities.find(x=>x.id==="single-level-submenu").evidence[0].contains="not real submenu implementation";
  assert.ok(validateSemanticOverlay(stale).some(x=>x.includes("stale or missing code evidence")));
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
    write(folder,"src/components/ui/alert-dialog.tsx",
      readFileSync("src/components/ui/alert-dialog.tsx","utf8"));
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


test("ReUI Markdown ingestion produces review-only proposals, never public contract authority",()=>{
  const source=[
    "## For AI Agents",
    "**When to use**",
    "- Confirm critical decisions",
    "**When not to use**",
    "- Ordinary notification",
    "**Agent notes**",
    "- Do not infer backend authorization",
    "### What is Shadcn Alert Dialog?",
    "This modal is for confirmations.",
    "### Shadcn Alert Dialog Features",
    "- Keyboard and focus behavior require testing",
    "## Integrating with Other Components",
    "Use Shadcn Button, Shadcn Checkbox and Shadcn Input.",
    "## Frequently Asked Questions",
    "### When should I use a checkbox?",
    "For high impact actions."
  ].join("\n");
  const proposal=extractReuiMarkdown(source,"AlertDialog","https://reui.io/components/alert-dialog");
  assert.equal(proposal.proposalStatus,"review-required");
  assert.equal(proposal.piAdmission,"not-authorized");
  assert.deepEqual(proposal.guidance.whenUse,["Confirm critical decisions"]);
  assert.deepEqual(proposal.guidance.whenNotUse,["Ordinary notification"]);
  assert.deepEqual(proposal.integrationCandidates.map(x=>x.component),["Button","Checkbox","Input"]);
  assert.equal(proposal.faqQuestions.length,1);
  assert.throws(()=>extractReuiMarkdown(source,"AlertDialog","https://evil.example/docs"),/exact official/);
});

test("UI explorer renders curated semantics as advisory capability/test panels",()=>{
  const shell=readFileSync("src/ui-runtime/catalog-explorer.tsx","utf8");
  assert.match(shell,/SemanticKnowledgePanel/);
  assert.match(shell,/data-testid="semantic-knowledge"/);
  assert.match(shell,/Capacidades e lacunas/);
  assert.match(shell,/Integrações sugeridas/);
  assert.match(shell,/Regras de decisão e dúvidas frequentes/);
  assert.match(shell,/Testes recomendados/);
  assert.match(shell,/não novas permissões/);
});

test("semantic:check and semantic:report validate the overlay and generate an advisory-only report",()=>{
  const script="scripts/analyze-semantic-knowledge.mjs";
  const check=spawnSync(process.execPath,[script,"--check"],{encoding:"utf8"});
  assert.equal(check.status,0,check.stderr||check.stdout);
  const generated=spawnSync(process.execPath,[script,"--write"],{encoding:"utf8"});
  assert.equal(generated.status,0,generated.stderr||generated.stdout);
  const report=read("reports/composition-analysis/semantic-knowledge.json");
  assert.equal(report.disclaimer,"Documentation guidance and code evidence do not authorize new props, events, backend actions, or Pi contracts.");
  const profile=report.profiles.find(x=>x.component==="AlertDialog");
  assert.equal(profile.provenance.reviewedOn,"2026-10-26");
  assert.equal(profile.documentationReview,"reviewed-documentation");
  assert.ok(profile.capabilities.some(x=>x.id==="small-size-footer"));
  assert.ok(profile.implementationGaps.some(x=>x.id==="typed-confirmation"));
  assert.ok(profile.derivedTestCases.some(x=>x.id==="cancel-no-confirm"));
  assert.ok(profile.integrationCandidates.every(x=>x.admission==="advisory-only"));
  const dropdownReport=report.profiles.find(x=>x.component==="DropdownMenu");
  assert.equal(dropdownReport.provenance.reviewedOn,"2026-10-26");
  assert.ok(dropdownReport.capabilities.some(x=>x.id==="single-level-submenu"));
  assert.ok(dropdownReport.implementationGaps.some(x=>x.id==="action-permission-policy"));
  assert.ok(dropdownReport.integrationCandidates.every(x=>x.admission==="advisory-only"));
});
