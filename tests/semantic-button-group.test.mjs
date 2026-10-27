import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildSemanticKnowledge,validateSemanticOverlay,selectAgentSemanticAdvice} from "../scripts/lib/semantic-knowledge.mjs";
const doc=JSON.parse(readFileSync("src/ui-catalog/knowledge/button-group.json","utf8"));
const clone=x=>JSON.parse(JSON.stringify(x));
test("T11 ButtonGroup: evidence, state boundaries and provenance",()=>{
 assert.deepEqual(validateSemanticOverlay(doc),[]);
 assert.equal(doc.source.url,"https://ui.shadcn.com/docs/components/base/button-group");
 assert.equal(doc.source.reviewedOn,"2026-10-27");
 for(const state of ["implemented-static-evidence","documented-not-implemented","runtime-review-required"])assert.ok(doc.capabilities.some(c=>c.state===state));
 assert.ok(doc.capabilities.some(c=>c.id==="local-selected-binding-and-event"&&c.state==="implemented-static-evidence"));
 assert.ok(doc.capabilities.some(c=>c.id==="split-menu-and-independent-actions"&&c.state==="documented-not-implemented"));
 assert.ok(doc.derivedTestCases.some(c=>c.id==="split-and-mixed-controls-proposal"&&c.kind==="candidate-not-executable"));
});
test("T11 ButtonGroup: guidance adds no Pi authorization",()=>{
 const {report,errors}=buildSemanticKnowledge();
 assert.deepEqual(errors,[]);
 const profile=report.profiles.find(x=>x.component==="ButtonGroup");
 assert.equal(profile.documentationReview,"reviewed-documentation");
 assert.ok(profile.implementationGaps.some(c=>c.id==="semantic-toggle-and-form-submit"));
 assert.ok(profile.integrationCandidates.every(x=>x.admission==="advisory-only"));
 const advice=selectAgentSemanticAdvice(report,["ButtonGroup"]);
 assert.equal(advice.length,1);
 assert.equal(advice[0].guidanceOnly,true);
 assert.ok(advice[0].integrationCandidates.every(x=>x.admission==="not-granted"));
 assert.ok(!advice[0].verifiedStaticCapabilities.some(x=>x.id==="split-menu-and-independent-actions"));
});
test("T11 ButtonGroup: rejects stale or fabricated evidence",()=>{
 const stale=clone(doc);
 stale.capabilities.find(x=>x.id==="local-selected-binding-and-event").evidence[0].contains="INVENTED_API";
 assert.ok(validateSemanticOverlay(stale).some(e=>e.includes("stale or missing code evidence")));
 const invented=clone(doc);
 invented.capabilities.find(x=>x.id==="split-menu-and-independent-actions").state="implemented-static-evidence";
 assert.ok(validateSemanticOverlay(invented).some(e=>e.includes("needs first-party evidence")));
 const runtime=clone(doc);
 runtime.capabilities.find(x=>x.id==="keyboard-name-and-selection-a11y").evidence=[{path:"src/components/ui/button-group.tsx",contains:'role="group"'}];
 assert.ok(validateSemanticOverlay(runtime).some(e=>e.includes("unverified capability may not claim implementation evidence")));
});
