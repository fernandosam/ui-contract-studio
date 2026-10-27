import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildSemanticKnowledge, validateSemanticOverlay, selectAgentSemanticAdvice} from "../scripts/lib/semantic-knowledge.mjs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const targets=[
  {name:"Pagination",slug:"pagination",implemented:["numbered-page-window","page-change-signal","page-size-with-total-items"],gaps:["url-and-history-sync","server-data-requests","auto-filter-reset"],runtime:["keyboard-and-screen-reader","small-viewport-and-multi-instance"]},
  {name:"Slider",slug:"slider",implemented:["single-scalar-value","multi-thumb-arrays","local-change-and-binding"],gaps:["field-input-sync","scale-ticks-tooltips-units","native-form-submit"],runtime:["keyboard-a11y-multithumb","mobile-touch-and-clamping"]},
  {name:"Toggle",slug:"toggle",implemented:["pressed-and-default-pressed","local-change-event","allowed-icon-and-label"],gaps:["remote-reaction-persistence","icon-only-and-tooltip-contract","counts-and-async-loading"],runtime:["keyboard-and-aria-pressed","contrast-touch-responsive"]},
  {name:"ToggleGroup",slug:"toggle-group",implemented:["single-selection","multiple-selection","visual-orientation"],gaps:["enforced-required-one","form-field-persistence","spacing-and-toolbar-semantics-pi","view-and-filter-effect"],runtime:["keyboard-focus-roving","mobile-overflow-and-hit-targets"]},
];
const overlay=slug=>read("src/ui-catalog/knowledge/"+slug+".json");
const all=targets.map(t=>({...t,doc:overlay(t.slug)}));

test("T15 four curated profiles follow T01, with real evidence and proposed test coverage",()=>{
  const {report,errors}=buildSemanticKnowledge();
  assert.deepEqual(errors,[]);
  for(const {name,slug,doc,implemented,gaps,runtime} of all){
    assert.deepEqual(validateSemanticOverlay(doc),[],name);
    assert.equal(doc.component,name);
    assert.equal(doc.schemaVersion,1);
    assert.equal(doc.language,"pt-BR");
    assert.equal(doc.status,"reviewed-documentation");
    assert.equal(doc.source.provider,"ReUI");
    assert.equal(doc.source.url,"https://reui.io/components/"+slug);
    assert.equal(doc.source.reviewedOn,"2026-10-27");
    assert.ok(doc.source.sections.length>=4);
    for(const key of ["purpose","rationale","whenUse","whenNotUse","agentNotes"])
      assert.ok(doc[key]?.length,name+" "+key);
    const ids=new Set(doc.capabilities.map(x=>x.id));
    assert.equal(ids.size,doc.capabilities.length);
    for(const id of implemented)
      assert.equal(doc.capabilities.find(c=>c.id===id)?.state,"implemented-static-evidence",name+" "+id);
    for(const id of gaps)
      assert.equal(doc.capabilities.find(c=>c.id===id)?.state,"documented-not-implemented",name+" "+id);
    for(const id of runtime)
      assert.equal(doc.capabilities.find(c=>c.id===id)?.state,"runtime-review-required",name+" "+id);
    for(const cap of doc.capabilities){
      assert.ok(cap.testRequirements.length>0,name+" "+cap.id);
      assert.ok(doc.derivedTestCases.some(t=>t.capabilities.includes(cap.id)),name+" missing test "+cap.id);
      if(cap.state==="implemented-static-evidence"){
        assert.ok(cap.evidence.length>0,name+" "+cap.id);
        for(const proof of cap.evidence)
          assert.ok(readFileSync(proof.path,"utf8").includes(proof.contains),name+" stale "+cap.id);
      } else {
        assert.deepEqual(cap.evidence,[],name+" unsupported "+cap.id);
        const requiredKind=cap.state==="documented-not-implemented"?"candidate-not-executable":null;
        assert.ok(doc.derivedTestCases.some(t=>t.capabilities.includes(cap.id)&&
          (requiredKind?t.kind===requiredKind:t.kind!=="candidate-not-executable")),
          name+" wrong test kind "+cap.id);
      }
    }
    assert.ok(doc.derivedTestCases.every(t=>t.capabilities.every(id=>ids.has(id))));
    const profile=report.profiles.find(p=>p.component===name);
    assert.equal(profile.documentationReview,"reviewed-documentation");
    assert.equal(profile.approvedPiType,true);
    assert.equal(profile.provenance.reviewedOn,doc.source.reviewedOn);
    assert.ok(profile.integrationCandidates.length>0);
    assert.ok(profile.integrationCandidates.every(c=>c.admission==="advisory-only"));
    assert.deepEqual(profile.implementationGaps.map(x=>x.id).sort(),
      doc.capabilities.filter(x=>x.state!=="implemented-static-evidence").map(x=>x.id).sort());
  }
});

test("T15 nonimplemented requirements do not become Pi rights or verified abilities",()=>{
  const report=buildSemanticKnowledge().report;
  const advice=selectAgentSemanticAdvice(report,targets.map(x=>x.name));
  assert.deepEqual(advice.map(x=>x.type).sort(),targets.map(x=>x.name).sort());
  for(const item of advice){
    assert.equal(item.guidanceOnly,true);
    assert.ok(item.integrationCandidates.every(x=>x.admission==="not-granted"));
    const gapIds=all.find(x=>x.name===item.type).doc.capabilities
      .filter(x=>x.state!=="implemented-static-evidence").map(x=>x.id);
    assert.ok(gapIds.every(id=>item.implementationGaps.some(x=>x.id===id)));
    assert.ok(gapIds.every(id=>!item.verifiedStaticCapabilities.some(x=>x.id===id)));
  }
  const denied=buildSemanticKnowledge({approvedNames:new Set(["Button"])}).report;
  assert.deepEqual(selectAgentSemanticAdvice(denied,targets.map(x=>x.name)),[]);
});

test("T15 rejects manufactured evidence, unreviewed implementation and invalid official provenance for each component",()=>{
  for(const {name,doc,gaps} of all){
    const stale=structuredClone(doc);
    stale.capabilities.find(c=>c.state==="implemented-static-evidence").evidence[0].contains="THIS DOES NOT EXIST IN VERSIONED SOURCE";
    assert.ok(validateSemanticOverlay(stale).some(x=>x.includes("stale or missing code evidence")),name);
    const invented=structuredClone(doc);
    invented.capabilities.find(c=>c.id===gaps[0]).state="implemented-static-evidence";
    assert.ok(validateSemanticOverlay(invented).some(x=>x.includes("needs first-party evidence")),name);
    const overclaimed=structuredClone(doc);
    overclaimed.capabilities.find(c=>c.id===gaps[0]).evidence=[{path:"src/ui-catalog/catalog.ts",contains:"Pagination:"}];
    assert.ok(validateSemanticOverlay(overclaimed).some(x=>x.includes("unverified capability may not claim implementation evidence")),name);
    const wrongSource=structuredClone(doc);
    wrongSource.source.url="https://example.org/claim";
    assert.ok(validateSemanticOverlay(wrongSource).some(x=>x.includes("invalid curated official source")),name);
  }
});

test("T15 guards documented boundary risks and regression targets",()=>{
  const pagination=overlay("pagination");
  assert.ok(pagination.agentNotes.some(x=>x.includes("pageSizeChange")));
  assert.ok(pagination.agentNotes.some(x=>x.includes("pg-pagination-goto")));
  assert.ok(pagination.faqDecisions.some(x=>x.guidance.includes("não emite")||x.guidance.includes("não presumir")));
  assert.ok(pagination.derivedTestCases.some(t=>t.id==="mobile-two-pagers"&&t.kind==="visual"));
  const slider=overlay("slider");
  assert.ok(slider.agentNotes.some(x=>x.includes("Base UI")));
  assert.ok(slider.derivedTestCases.some(t=>t.id==="scalar-array-mode"&&t.capabilities.includes("multi-thumb-arrays")));
  const toggle=overlay("toggle");
  assert.ok(toggle.whenNotUse.some(x=>x.includes("Switch")));
  assert.ok(toggle.derivedTestCases.some(t=>t.id==="remote-reaction-proposal"&&t.kind==="candidate-not-executable"));
  const group=overlay("toggle-group");
  assert.ok(group.agentNotes.some(x=>x.includes("orientation")));
  assert.ok(group.faqDecisions.some(x=>x.guidance.includes("vazia")||x.guidance.includes("vazio")));
  assert.ok(group.derivedTestCases.some(t=>t.id==="keyboard-group-navigation"&&t.kind==="manual-a11y"));
  // Three stages remain separate: reference documentation, implementation proof, Pi admission.
  assert.match(readFileSync("scripts/lib/semantic-knowledge.mjs","utf8"),/admission:"not-granted"/);
  assert.match(readFileSync("scripts/lib/semantic-knowledge.mjs","utf8"),/admission:"advisory-only"/);
});
