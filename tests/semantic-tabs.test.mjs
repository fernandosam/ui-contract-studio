import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildSemanticKnowledge, validateSemanticOverlay, selectAgentSemanticAdvice} from "../scripts/lib/semantic-knowledge.mjs";

const doc=JSON.parse(readFileSync("src/ui-catalog/knowledge/tabs.json","utf8"));
const clone=value=>JSON.parse(JSON.stringify(value));

test("T10 Tabs follows T01 checklist with first-party evidence",()=>{
  assert.deepEqual(validateSemanticOverlay(doc),[]);
  assert.equal(doc.component,"Tabs");
  assert.equal(doc.source.url,"https://reui.io/components/tabs");
  assert.equal(doc.source.reviewedOn,"2026-10-27");
  assert.ok(["purpose","rationale","whenUse","whenNotUse","agentNotes","faqDecisions","derivedTestCases"].every(key=>doc[key]?.length>0));
  assert.ok(doc.capabilities.some(x=>x.id==="selected-value-and-default"&&x.state==="implemented-static-evidence"));
  assert.ok(doc.capabilities.some(x=>x.id==="url-synchronization"&&x.state==="documented-not-implemented"));
  assert.ok(doc.capabilities.some(x=>x.id==="keyboard-focus-and-announcements"&&x.state==="runtime-review-required"));
  assert.ok(doc.derivedTestCases.some(x=>x.id==="url-sync-proposal"&&x.kind==="candidate-not-executable"));
});
test("T10 Tabs semantic advice grants no new Pi capabilities",()=>{
  const {report,errors}=buildSemanticKnowledge();
  assert.deepEqual(errors,[]);
  const profile=report.profiles.find(x=>x.component==="Tabs");
  assert.equal(profile.documentationReview,"reviewed-documentation");
  assert.equal(profile.approvedPiType,true);
  assert.ok(profile.implementationGaps.some(x=>x.id==="rich-panel-form-composition"));
  assert.ok(profile.integrationCandidates.every(x=>x.admission==="advisory-only"));
  const advice=selectAgentSemanticAdvice(report,["Tabs"]);
  assert.equal(advice.length,1);
  assert.equal(advice[0].guidanceOnly,true);
  assert.ok(advice[0].integrationCandidates.every(x=>x.admission==="not-granted"));
});
test("T10 Tabs detects invalid provenance, stale evidence and invented features",()=>{
  const stale=clone(doc);
  stale.capabilities.find(x=>x.id==="selected-value-and-default").evidence[0].contains="NONEXISTENT_TAB_PROP";
  assert.ok(validateSemanticOverlay(stale).some(x=>x.includes("stale or missing code evidence")));
  const invented=clone(doc);
  invented.capabilities.find(x=>x.id==="url-synchronization").state="implemented-static-evidence";
  assert.ok(validateSemanticOverlay(invented).some(x=>x.includes("needs first-party evidence")));
  const falseProof=clone(doc);
  falseProof.capabilities.find(x=>x.id==="keyboard-focus-and-announcements").evidence=[{path:"src/components/ui/tabs.tsx",contains:"TabsPrimitive.Root"}];
  assert.ok(validateSemanticOverlay(falseProof).some(x=>x.includes("unverified capability may not claim implementation evidence")));
});
