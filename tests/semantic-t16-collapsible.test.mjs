import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateSemanticOverlay,buildSemanticKnowledge,selectAgentSemanticAdvice} from "../scripts/lib/semantic-knowledge.mjs";

const doc=JSON.parse(readFileSync("src/ui-catalog/knowledge/collapsible.json","utf8"));
const clone=value=>structuredClone(value);
const implemented=["approved-title-and-content-slot","controlled-and-default-open","open-change-signal","disabled-root","base-ui-disclosure-anatomy"];
const missing=["nested-tree-pi-model","advanced-controls-persistence","animated-disclosure"];
const runtime=["keyboard-and-aria","closed-content-hydration"];

test("T16 Collapsible: reviewed semantic profile and source-backed states",()=>{
  assert.deepEqual(validateSemanticOverlay(doc),[]);
  assert.equal(doc.component,"Collapsible");
  assert.equal(doc.schemaVersion,1);
  assert.equal(doc.language,"pt-BR");
  assert.equal(doc.status,"reviewed-documentation");
  assert.equal(doc.source.provider,"ReUI");
  assert.equal(doc.source.url,"https://reui.io/components/collapsible");
  assert.equal(doc.source.reviewedOn,"2026-10-27");
  for(const key of ["purpose","rationale","whenUse","whenNotUse","agentNotes","integrations","faqDecisions","derivedTestCases"])
    assert.ok(doc[key]?.length,"missing "+key);
  const state=id=>doc.capabilities.find(c=>c.id===id);
  for(const id of implemented){
    assert.equal(state(id)?.state,"implemented-static-evidence",id);
    assert.ok(state(id).evidence.length>0,id);
  }
  for(const id of missing){
    assert.equal(state(id)?.state,"documented-not-implemented",id);
    assert.deepEqual(state(id).evidence,[],id);
    assert.ok(doc.derivedTestCases.some(t=>t.kind==="candidate-not-executable" && t.capabilities.includes(id)),id);
  }
  for(const id of runtime){
    assert.equal(state(id)?.state,"runtime-review-required",id);
    assert.deepEqual(state(id).evidence,[],id);
    assert.ok(doc.derivedTestCases.some(t=>t.kind!=="candidate-not-executable" && t.capabilities.includes(id)),id);
  }
  const ids=new Set(doc.capabilities.map(c=>c.id));
  assert.equal(ids.size,doc.capabilities.length);
  assert.ok(doc.derivedTestCases.every(t=>t.capabilities.every(id=>ids.has(id))));
});

test("T16 Collapsible: verified snippets fail closed when stale or promoted",()=>{
  const implementedId=implemented[0], missingId=missing[0], runtimeId=runtime[0];
  const stale=clone(doc);
  stale.capabilities.find(x=>x.id===implementedId).evidence[0].contains="T16 fabricated source evidence";
  assert.ok(validateSemanticOverlay(stale).some(x=>x.includes("stale or missing code evidence")));
  const promoted=clone(doc);
  promoted.capabilities.find(x=>x.id===missingId).state="implemented-static-evidence";
  assert.ok(validateSemanticOverlay(promoted).some(x=>x.includes("needs first-party evidence")));
  const invented=clone(doc);
  invented.capabilities.find(x=>x.id===runtimeId).evidence=[{path:"src/components/ui/button.tsx",contains:"Button"}];
  assert.ok(validateSemanticOverlay(invented).some(x=>x.includes("unverified capability may not claim implementation evidence")));
});

test("T16 Collapsible: only advisory guidance for approved Pi contracts (Base UI render, no asChild in Pi)",()=>{
  const {report,errors}=buildSemanticKnowledge();
  assert.deepEqual(errors,[]);
  const profile=report.profiles.find(x=>x.component==="Collapsible");
  assert.ok(profile);
  assert.equal(profile.documentationReview,"reviewed-documentation");
  assert.equal(profile.approvedPiType,true);
  assert.equal(profile.provenance.reviewedOn,"2026-10-27");
  assert.ok(profile.integrationCandidates.every(x=>x.admission==="advisory-only"));
  assert.deepEqual(profile.implementationGaps.map(x=>x.id).sort(),[...missing,...runtime].sort());
  const advice=selectAgentSemanticAdvice(report,["Collapsible"]);
  assert.equal(advice.length,1);
  assert.equal(advice[0].guidanceOnly,true);
  assert.ok(advice[0].integrationCandidates.every(x=>x.admission==="not-granted"));
  assert.deepEqual(advice[0].verifiedStaticCapabilities.map(x=>x.id).sort(),implemented.slice().sort());
  const denied=buildSemanticKnowledge({approvedNames:new Set(["Button"])}).report;
  assert.deepEqual(selectAgentSemanticAdvice(denied,["Collapsible"]),[]);
});
