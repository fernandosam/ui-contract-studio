import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildSemanticTestAutomation,loadSemanticTestRecords,semanticTestRecipes} from "../scripts/lib/semantic-test-automation.mjs";

// The 172 pending cases at the start of this delivery are audited individually.
// New registered entries are included in the baseline; the remaining entries
// are still pending. These are evidence/feasibility tests, NEVER runtime passes.
const newlyReviewed=new Set(["toggle.pressed-roundtrip","tabs.change-event","select.change-event","dialog.local-state-event","popover.keyboard-dismiss","radio.keyboard-exclusive","slider.multithumb-keyboard","switch.keyboard-activation","button.keyboard-press","accordion.keyboard-disclosure","rating.local-press","pagination.change-event"]);
// High-risk follow-up: these reviewed recipes close eight more baseline gaps.
for(const recipe of ["alert-dialog.confirm-once","drawer.open-change","drawer.modal-backdrop","checkbox.keyboard-space","tabs.keyboard-roving","dropdown.keyboard-submenu","accordion.disabled-guard","button.form-type"])newlyReviewed.add(recipe);
const profiles=loadSemanticTestRecords();
const audit=buildSemanticTestAutomation(profiles);
const records=new Map(profiles.map(record=>[record.component,record]));
const baseline=audit.entries.filter(entry=>
  entry.status==="pending-recipe" || newlyReviewed.has(entry.recipe));

test("all 172 baseline pending scenarios receive an explicit disposition",()=>{
 assert.deepEqual(audit.errors,[]);
 assert.equal(baseline.length,172);
 assert.equal(audit.summary.total,315);
 assert.equal(audit.summary.registered,60);
 assert.equal(audit.summary.pending,152);
 assert.equal(audit.summary.blocked,103);
 assert.equal(audit.summary.invalid,0);
 assert.equal(audit.summary.partial,59);
 assert.equal(newlyReviewed.size,20);
 assert.deepEqual([...new Set(baseline.filter(x=>newlyReviewed.has(x.recipe)).map(x=>x.recipe))].sort(),
   [...newlyReviewed].sort());
 const counts=audit.summary.pendingTracks;
 assert.equal(counts.integration+counts.visual+counts.manualA11y+counts.other,152);
 assert.ok(counts.manualA11y>0 && counts.visual>0 && counts.runtimeEvidenceNeeded>0);
});

// This verifies concrete implementation evidence and guards authorization.
// It cannot replace Playwright, manual accessibility testing or visual review.
for(const entry of baseline){
 test("pending feasibility: "+entry.component+"/"+entry.id,()=>{
   const profile=records.get(entry.component);
   assert.ok(profile,entry.component);
   assert.equal(entry.source,profile.curatedSource);
   const scenario=profile.derivedTestCases.find(x=>x.id===entry.id);
   assert.ok(scenario);
   assert.equal(scenario.kind,entry.kind);
   assert.deepEqual(scenario.capabilities,entry.capabilities);
   assert.notEqual(entry.kind,"candidate-not-executable");
   for(const id of entry.capabilities){
     const capability=profile.capabilities.find(x=>x.id===id);
     assert.ok(capability,entry.component+"/"+id);
     assert.notEqual(capability.state,"documented-not-implemented");
     if(capability.state==="implemented-static-evidence"){
       assert.ok(capability.evidence?.length>0,entry.component+"/"+id+": missing static evidence");
       for(const evidence of capability.evidence){
         const content=readFileSync(evidence.path,"utf8");
         assert.ok(content.includes(evidence.contains),
           entry.component+"/"+id+": stale "+evidence.path);
       }
     }
   }
   if(newlyReviewed.has(entry.recipe)){
     assert.equal(entry.status,"registered");
     assert.equal(entry.coverage,"partial");
     assert.ok(semanticTestRecipes[entry.recipe]);
   } else {
     assert.equal(entry.status,"pending-recipe");
     assert.equal(entry.execution,"not-run");
     assert.equal(entry.review.certification,"not-granted");
     assert.equal(entry.review.evidence,"documentation-and-static-code-only");
     assert.ok(entry.review.requiredNextStep);
     if(entry.capabilityStates.some(x=>x.state==="runtime-review-required"))
       assert.equal(entry.review.runtimeEvidenceNeeded,true);
   }
 });
}
