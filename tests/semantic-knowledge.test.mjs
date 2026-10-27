import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync, readdirSync} from "node:fs";
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
const selectSeed=read("src/ui-catalog/knowledge/select.json");
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
  assert.equal(knowledge.coverage.curatedOverlays,readdirSync("src/ui-catalog/knowledge").filter(x=>x.endsWith(".json")).length);
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
});


test("Dialog T02 follows the AlertDialog checklist without expanding Pi contracts",()=>{
  const dialog=read("src/ui-catalog/knowledge/dialog.json");
  assert.deepEqual(validateSemanticOverlay(dialog),[]);
  assert.equal(dialog.schemaVersion,1);
  assert.equal(dialog.component,"Dialog");
  assert.equal(dialog.source.provider,"ReUI");
  assert.equal(dialog.source.url,"https://reui.io/components/dialog");
  assert.equal(dialog.source.reviewedOn,"2026-10-26");
  const {report,errors}=buildSemanticKnowledge();
  assert.deepEqual(errors,[]);
  assert.equal(report.coverage.curatedOverlays,readdirSync("src/ui-catalog/knowledge").filter(x=>x.endsWith(".json")).length);
  const profile=report.profiles.find(x=>x.component==="Dialog");
  assert.equal(profile.documentationReview,"reviewed-documentation");
  assert.equal(profile.approvedPiType,true);
  assert.ok(profile.capabilities.some(x=>x.id==="controlled-open-and-event"&&x.state==="implemented-static-evidence"));
  assert.ok(profile.capabilities.some(x=>x.id==="title-description-and-children"&&x.state==="implemented-static-evidence"));
  assert.ok(profile.implementationGaps.some(x=>x.id==="native-form-workflow-pi"&&x.state==="documented-not-implemented"));
  assert.ok(profile.implementationGaps.some(x=>x.id==="unsaved-changes-guard"));
  assert.ok(profile.implementationGaps.some(x=>x.id==="focus-management"&&x.state==="runtime-review-required"));
  assert.ok(profile.derivedTestCases.some(x=>x.id==="form-submission-proposal"&&x.kind==="candidate-not-executable"));
  assert.ok(profile.derivedTestCases.some(x=>x.id==="focus-trap-and-return"&&x.kind==="manual-a11y"));
  assert.ok(profile.faqDecisions.some(x=>x.question.includes("AlertDialog")));
  assert.ok(profile.integrationCandidates.every(x=>x.admission==="advisory-only"));
  const advice=selectAgentSemanticAdvice(report,["Dialog"]);
  assert.equal(advice.length,1);
  assert.equal(advice[0].guidanceOnly,true);
  assert.ok(advice[0].integrationCandidates.every(x=>x.admission==="not-granted"));
});


test("Dialog T02 rejects invented functionality and stale source evidence",()=>{
  const dialog=read("src/ui-catalog/knowledge/dialog.json");
  const stale=clone(dialog);
  stale.capabilities.find(x=>x.id==="automatic-trigger").evidence[0].contains="not in repo";
  assert.ok(validateSemanticOverlay(stale).some(x=>x.includes("stale or missing code evidence")));
  const invented=clone(dialog);
  invented.capabilities.find(x=>x.id==="native-form-workflow-pi").state="implemented-static-evidence";
  assert.ok(validateSemanticOverlay(invented).some(x=>x.includes("needs first-party evidence")));
  const falseApproval=clone(dialog);
  falseApproval.capabilities.find(x=>x.id==="focus-management").evidence=[{path:"src/components/ui/dialog.tsx",contains:"DialogPrimitive.Root"}];
  assert.ok(validateSemanticOverlay(falseApproval).some(x=>x.includes("unverified capability may not claim implementation evidence")));
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


test("Popover overlay separa capacidades do contrato Pi, exemplos ReUI e verificações de runtime",()=>{
  const popover=read("src/ui-catalog/knowledge/popover.json");
  assert.deepEqual(validateSemanticOverlay(popover),[]);
  assert.equal(popover.status,"reviewed-documentation");
  assert.equal(popover.source.provider,"ReUI");
  assert.equal(popover.source.url,"https://reui.io/components/popover");
  assert.equal(popover.source.reviewedOn,"2026-10-26");
  assert.ok(popover.capabilities.some(x=>x.id==="portal-and-positioner"&&x.state==="implemented-static-evidence"));
  assert.ok(popover.capabilities.some(x=>x.id==="offset-and-width-customization"&&x.state==="documented-not-implemented"));
  assert.ok(popover.capabilities.some(x=>x.id==="screen-reader-semantics"&&x.state==="runtime-review-required"));
  assert.ok(popover.derivedTestCases.some(x=>x.id==="position-matrix"&&x.kind==="visual"));
  assert.ok(popover.derivedTestCases.some(x=>x.id==="keyboard-and-dismiss"&&x.kind==="manual-a11y"));
  assert.ok(popover.derivedTestCases.some(x=>x.id==="future-rich-editing"&&x.kind==="candidate-not-executable"));
});


test("Select semantic overlay distinguishes code-backed selection from form and accessibility gaps",()=>{
  assert.deepEqual(validateSemanticOverlay(selectSeed),[]);
  const knowledge=buildSemanticKnowledge().report;
  const selected=knowledge.profiles.find(x=>x.component==="Select");
  assert.ok(selected);
  assert.equal(selected.documentationReview,"reviewed-documentation");
  assert.equal(selected.approvedPiType,true);
  assert.equal(selected.provenance.reviewedOn,"2026-10-26");
  assert.ok(selected.capabilities.some(x=>x.id==="grouped-text-options"&&x.state==="implemented-static-evidence"));
  assert.ok(selected.capabilities.some(x=>x.id==="value-defaultvalue-and-change"&&x.state==="implemented-static-evidence"));
  assert.ok(selected.capabilities.some(x=>x.id==="required-forwarding"&&x.state==="implemented-static-evidence"));
  assert.ok(selected.implementationGaps.some(x=>x.id==="named-native-form-serialization"&&x.state==="documented-not-implemented"));
  assert.ok(selected.implementationGaps.some(x=>x.id==="business-checks-and-errors"));
  assert.ok(selected.implementationGaps.some(x=>x.id==="selected-label-fidelity"&&x.state==="runtime-review-required"));
  assert.ok(selected.derivedTestCases.some(x=>x.id==="keyboard-screen-reader"&&x.kind==="manual-a11y"));
  assert.ok(selected.derivedTestCases.some(x=>x.id==="native-form-and-validation-proposal"&&x.kind==="candidate-not-executable"));
  assert.ok(selected.integrationCandidates.every(x=>x.admission==="advisory-only"));
  const advice=selectAgentSemanticAdvice(knowledge,["Select"]);
  assert.equal(advice.length,1);
  assert.equal(advice[0].guidanceOnly,true);
  assert.ok(advice[0].implementationGaps.some(x=>x.id==="named-native-form-serialization"));
  assert.ok(advice[0].integrationCandidates.every(x=>x.admission==="not-granted"));
  const noSelect=buildSemanticKnowledge({approvedNames:new Set(["Button"])}).report;
  assert.deepEqual(selectAgentSemanticAdvice(noSelect,["Select"]),[]);
});


test("Select code evidence fails closed when altered or claimed without implementation",()=>{
  const stale=clone(selectSeed);
  stale.capabilities.find(x=>x.id==="single-select-text-options").evidence[0].contains="NONEXISTENT SELECT PROP";
  assert.ok(validateSemanticOverlay(stale).some(x=>x.includes("stale or missing code evidence")));
  const invented=clone(selectSeed);
  invented.capabilities.find(x=>x.id==="multi-select").state="implemented-static-evidence";
  assert.ok(validateSemanticOverlay(invented).some(x=>x.includes("needs first-party evidence")));
  const unverified=clone(selectSeed);
  unverified.capabilities.find(x=>x.id==="selected-label-fidelity").evidence=[{
    path:"src/components/ui/select.tsx",contains:"<SelectPrimitive.Value",
  }];
  assert.ok(validateSemanticOverlay(unverified).some(x=>x.includes("unverified capability may not claim implementation evidence")));
});


test("T07 Button documentation distinguishes static support from async composition",()=>{
  const button=read("src/ui-catalog/knowledge/button.json");
  assert.deepEqual(validateSemanticOverlay(button),[]);
  assert.equal(button.component,"Button");
  assert.equal(button.status,"reviewed-documentation");
  assert.equal(button.source.url,"https://reui.io/components/button");
  const byId=new Map(button.capabilities.map(cap=>[cap.id,cap]));
  for(const id of ["local-press-event","visual-variants","sizes-and-icon-sizes",
    "explicit-form-type","loading-and-disabled","icon-position-and-label","inline-count-badge"])
    assert.equal(byId.get(id)?.state,"implemented-static-evidence");
  for(const id of ["async-lifecycle","post-action-success-error","copy-or-external-action"])
    assert.equal(byId.get(id)?.state,"documented-not-implemented");
  assert.equal(byId.get("focus-and-keyboard-runtime")?.state,"runtime-review-required");
  assert.ok(button.derivedTestCases.some(test=>test.kind==="candidate-not-executable" &&
    test.capabilities.includes("async-lifecycle")));
  const profile=buildSemanticKnowledge().report.profiles.find(x=>x.component==="Button");
  assert.equal(profile.documentationReview,"reviewed-documentation");
  assert.equal(profile.provenance.reviewedOn,"2026-10-27");
  assert.ok(profile.integrationCandidates.every(item=>item.admission==="advisory-only"));
  const advice=selectAgentSemanticAdvice(buildSemanticKnowledge().report,["Button"]);
  assert.equal(advice.length,1);
  assert.equal(advice[0].guidanceOnly,true);
  assert.ok(advice[0].implementationGaps.some(gap=>gap.id==="async-lifecycle"));
  assert.ok(advice[0].integrationCandidates.every(item=>item.admission==="not-granted"));
});

const t08Targets=[
  ["Dialog","dialog",[5,3,3]],["DropdownMenu","dropdown-menu",[9,5,3]],
  ["Popover","popover",[5,4,4]],["Select","select",[9,6,4]],
  ["Accordion","accordion",[7,3,2]],["Button","button",[8,3,2]],
];
const t08States=["implemented-static-evidence","documented-not-implemented","runtime-review-required"];

test("T08 integrated evidence and checklist across six components",()=>{
  const {report,errors}=buildSemanticKnowledge();
  assert.deepEqual(errors,[]);
  const files=readdirSync("src/ui-catalog/knowledge").filter(x=>x.endsWith(".json"));
  assert.ok(files.length>=7,"AlertDialog and six T02-T07 overlays must remain available as the catalog grows");
  assert.equal(report.coverage.curatedOverlays,files.length);
  let totalStates=[0,0,0],proofs=0,integrations=0,faq=0,derived=0;
  for(const [name,slug,expected] of t08Targets){
    assert.ok(files.includes(slug+".json"));
    const doc=read("src/ui-catalog/knowledge/"+slug+".json");
    assert.deepEqual(validateSemanticOverlay(doc),[],name);
    assert.equal(doc.component,name);
    assert.equal(doc.schemaVersion,1);
    assert.equal(doc.language,"pt-BR");
    assert.equal(doc.status,"reviewed-documentation");
    assert.equal(doc.source.provider,"ReUI");
    assert.equal(doc.source.url,"https://reui.io/components/"+slug);
    assert.ok(["2026-10-26","2026-10-27"].includes(doc.source.reviewedOn));
    assert.ok(doc.source.sections.length>=4);
    for(const key of ["purpose","rationale","whenUse","whenNotUse","agentNotes"])
      assert.ok(doc[key]?.length,name+":"+key);
    const got=t08States.map(s=>doc.capabilities.filter(c=>c.state===s).length);
    assert.deepEqual(got,expected,name+" classification");
    got.forEach((n,i)=>totalStates[i]+=n);
    const ids=new Set(doc.capabilities.map(x=>x.id));
    assert.equal(ids.size,doc.capabilities.length);
    for(const cap of doc.capabilities){
      assert.ok(cap.testRequirements.length>0,name+":"+cap.id);
      if(cap.state==="implemented-static-evidence"){
        assert.ok(cap.evidence.length>0);
        for(const evidence of cap.evidence){
          assert.ok(readFileSync(evidence.path,"utf8").includes(evidence.contains),name+":"+cap.id);
          proofs++;
        }
      }else{
        assert.deepEqual(cap.evidence,[]);
        assert.ok(doc.derivedTestCases.some(t=>t.capabilities.includes(cap.id)&&
          (cap.state==="documented-not-implemented"
            ?t.kind==="candidate-not-executable"
            :t.kind!=="candidate-not-executable")),name+":"+cap.id+" not covered");
      }
    }
    assert.ok(doc.derivedTestCases.every(t=>t.capabilities.every(id=>ids.has(id))));
    const profile=report.profiles.find(p=>p.component===name);
    assert.equal(profile.documentationReview,"reviewed-documentation");
    assert.equal(profile.provenance.reviewedOn,doc.source.reviewedOn);
    assert.ok(profile.integrationCandidates.every(x=>x.admission==="advisory-only"));
    assert.deepEqual(profile.implementationGaps.map(x=>x.id).sort(),
      doc.capabilities.filter(c=>c.state!=="implemented-static-evidence").map(c=>c.id).sort());
    integrations+=doc.integrations.length;
    faq+=doc.faqDecisions.length;
    derived+=doc.derivedTestCases.length;
  }
  assert.deepEqual(totalStates,[43,24,18]);
  assert.deepEqual({proofs,integrations,faq,derived},{proofs:108,integrations:61,faq:51,derived:62});
});

test("T08 semantic advice does not elevate capabilities or grant Pi admission",()=>{
  const report=buildSemanticKnowledge().report;
  const types=t08Targets.map(x=>x[0]);
  const selected=selectAgentSemanticAdvice(report,types);
  assert.deepEqual(selected.map(x=>x.type).sort(),types.slice().sort());
  for(const advice of selected){
    assert.equal(advice.guidanceOnly,true);
    assert.ok(advice.integrationCandidates.every(x=>x.admission==="not-granted"));
    assert.ok(advice.implementationGaps.every(x=>x.state!=="implemented-static-evidence"));
    const profile=report.profiles.find(p=>p.component===advice.type);
    assert.deepEqual(advice.verifiedStaticCapabilities.map(x=>x.id).sort(),
      profile.capabilities.filter(x=>x.state==="implemented-static-evidence").map(x=>x.id).sort());
  }
  const denied=buildSemanticKnowledge({approvedNames:new Set(["AlertDialog"])}).report;
  assert.deepEqual(selectAgentSemanticAdvice(denied,types),[]);
  assert.match(report.disclaimer,/do not authorize new props, events, backend actions, or Pi contracts/);
});

test("T08 prevents regressions from stale proofs and unreviewed implementation claims",()=>{
  for(const [name,slug] of t08Targets){
    const source=read("src/ui-catalog/knowledge/"+slug+".json");
    const yes=source.capabilities.find(c=>c.state==="implemented-static-evidence");
    const no=source.capabilities.find(c=>c.state==="documented-not-implemented");
    const runtime=source.capabilities.find(c=>c.state==="runtime-review-required");
    const stale=clone(source);
    stale.capabilities.find(c=>c.id===yes.id).evidence[0].contains="T08 fictitious evidence";
    assert.ok(validateSemanticOverlay(stale).some(x=>x.includes("stale or missing code evidence")),name);
    const promoted=clone(source);
    promoted.capabilities.find(c=>c.id===no.id).state="implemented-static-evidence";
    assert.ok(validateSemanticOverlay(promoted).some(x=>x.includes("needs first-party evidence")),name);
    const runtimeClaim=clone(source);
    runtimeClaim.capabilities.find(c=>c.id===runtime.id).evidence=[
      {path:"src/components/ui/button.tsx",contains:"buttonVariants"},
    ];
    assert.ok(validateSemanticOverlay(runtimeClaim).some(x=>x.includes("unverified capability may not claim implementation evidence")),name);
  }
});

test("T08 preserves Accordion onboarding and Button asynchronous gaps",()=>{
  const accordion=read("src/ui-catalog/knowledge/accordion.json");
  for(const id of ["rich-structured-content","onboarding-status-in-basic-contract","keep-mounted-ssr"])
    assert.equal(accordion.capabilities.find(c=>c.id===id)?.state,"documented-not-implemented");
  assert.ok(accordion.faqDecisions.some(x=>/onboarding/i.test(x.question)));
  const button=read("src/ui-catalog/knowledge/button.json");
  for(const id of ["async-lifecycle","post-action-success-error","copy-or-external-action"])
    assert.equal(button.capabilities.find(c=>c.id===id)?.state,"documented-not-implemented");
  assert.equal(button.capabilities.find(c=>c.id==="loading-and-disabled")?.state,"implemented-static-evidence");
});

