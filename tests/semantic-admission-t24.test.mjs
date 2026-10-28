import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluatePolicy} from "../scripts/admission-engine.mjs";
import {
  evaluateSemanticAdmissionReview,reviewSemanticAdmissionsAtRoot,
} from "../scripts/lib/semantic-admission-review.mjs";

const ref={
  component:"AlertDialog",capability:"typed-confirmation",
  availability:"not-implemented",state:"documented-not-implemented",
  source:"src/ui-catalog/knowledge/alert-dialog.json",
};
function fixture(){
  const scenario={id:"alert-typed",family:"AlertDialog",strategy:"react-candidate",
    target:"TypedConfirmationDialog",dependencies:["AlertDialog","Input","Button"],
    requiredCapabilities:["typed-confirmation"]};
  const proposal={id:"gap-alert-typed",scenarioId:scenario.id,
    family:scenario.family,strategy:scenario.strategy,target:scenario.target,
    status:"candidate-review-only",approval:"candidate-not-admitted",
    canUseInPi:false,originGaps:[{...ref}],requiredCapabilities:[{...ref}],
    dependencies:scenario.dependencies.map(name=>({name,approvedPiType:true}))};
  const data={
    proposalReport:{schemaVersion:1,authority:"advisory-only",
      proposals:[proposal],uncoveredGaps:[{...ref}]},
    capabilityAudit:{gaps:[{...ref}]},
    policy:{schemaVersion:1,mode:"opt-in-experimental",allowedScenarios:["alert-typed"],e2eEligible:["alert-typed"]},
    recipes:{recipes:[{id:"alert-typed",target:"TypedConfirmationDialog",review:"required"}]},
    scenarios:{scenarios:[scenario]},
    lock:{components:scenario.dependencies.map(name=>({name,status:"approved"}))},
    pi:{components:[{type:"TypedConfirmationDialog",tier:"composition",lifecycle:"experimental",
      sourceDigest:"reviewed-digest"},{type:"Button",tier:"base"}]},
    sources:{components:[]},
    entries:{entries:[{id:"alert-typed",recipeId:"alert-typed",type:"TypedConfirmationDialog",
      sourceDigest:"reviewed-digest",e2eProtocol:"typed-confirmation-desktop-mobile"}]},
    protocols:{candidates:{"alert-typed":{target:"TypedConfirmationDialog",
      protocol:"typed-confirmation-desktop-mobile",cases:["invalid-and-exact-match","cancel-and-reopen","keyboard-focus"]}}},
  };
  return data;
}
function review(data){
  const policyErrors=evaluatePolicy(data);
  return evaluateSemanticAdmissionReview({...data,policyErrors});
}
test("T24 maps a verified official candidate without admitting or activating anything",()=>{
  const data=fixture(),snapshot=JSON.stringify(data);
  assert.deepEqual(evaluatePolicy(data),[]);
  const out=review(data);
  assert.equal(out.authority,"evaluation-only");
  assert.equal(out.activation,"none");
  assert.equal(out.summary.uncoveredGaps,1);
  assert.equal(out.evaluations[0].decision,"existing-experimental-contract");
  assert.equal(out.evaluations[0].existingPi.matchedOfficialRegistry,true);
  assert.equal(out.evaluations[0].mayPublishNewPiType,false);
  assert.equal(out.evaluations[0].mayCertifyE2e,false);
  assert.equal(out.evaluations[0].mayActivateFromSemantics,false);
  assert.equal(JSON.stringify(data),snapshot,"review must not mutate Pi, policy or sources");
});
test("T24 blocks semantic candidates outside opt-in or with unimplemented evidence",()=>{
  const data=fixture();
  data.policy.allowedScenarios=[];
  assert.equal(review(data).evaluations[0].decision,"not-allowlisted");
  data.policy.allowedScenarios=["alert-typed"];
  data.proposalReport.proposals[0].status="blocked-implementation";
  assert.equal(review(data).evaluations[0].decision,"blocked-proposal");
  data.proposalReport.proposals[0].status="blocked-authorization";
  assert.equal(review(data).evaluations[0].decision,"blocked-proposal");
  data.proposalReport.proposals[0].status="blocked-evidence";
  assert.equal(review(data).evaluations[0].decision,"blocked-proposal");
});
test("T24 rejects forged provenance, permissions, target and dependency even when allowlisted",()=>{
  const data=fixture(),p=data.proposalReport.proposals[0];
  p.canUseInPi=true;
  assert.equal(review(data).evaluations[0].decision,"blocked-proposal");
  p.canUseInPi=false;p.originGaps[0].source="other";
  assert.ok(review(data).evaluations[0].blockers.includes("missing-or-altered-audited-gap"));
  p.originGaps[0].source=ref.source;p.dependencies[0].approvedPiType=false;
  assert.equal(review(data).evaluations[0].decision,"blocked-proposal");
  p.dependencies[0].approvedPiType=true;p.target="FakeContract";
  assert.equal(review(data).evaluations[0].decision,"blocked-proposal");
  p.target="TypedConfirmationDialog";data.entries.entries[0].e2eProtocol="different";
  assert.equal(review(data).evaluations[0].decision,"blocked-admission-integrity");
});
test("T24 keeps documented-only candidates out of the Admission Engine registry",()=>{
  const data=fixture();
  data.semanticCandidates=[{component:"Combobox",curatedSource:"src/ui-catalog/knowledge/combobox.json",
    documentationReview:"reviewed-documentation"}];
  const out=review(data);
  assert.equal(out.summary.documentedCandidates,1);
  assert.equal(out.documentedCandidates[0].decision,"documentation-only");
  assert.equal(out.documentedCandidates[0].mayPublishNewPiType,false);
  data.semanticCandidates[0].component="Button";
  assert.equal(review(data).documentedCandidates[0].decision,"blocked-catalog-collision");
});
test("T24 reuses the official policy gate and never treats T23 as a bypass",()=>{
  const data=fixture();
  data.scenarios.scenarios[0].dependencies.push("NotApproved");
  const errors=evaluatePolicy(data);
  assert.match(errors.join(" "),/unapproved primitive/);
  const out=evaluateSemanticAdmissionReview({...data,policyErrors:errors});
  assert.equal(out.evaluations[0].decision,"blocked-proposal");
  assert.throws(()=>evaluateSemanticAdmissionReview({...data,policyErrors:undefined}),
    /authoritative Admission Engine policy/);
});
test("T24 evaluates live T23 gaps without creating an API or changing Pi",()=>{
  const original=readFileSync("pi-catalog/contracts.json","utf8");
  const report=reviewSemanticAdmissionsAtRoot(process.cwd());
  assert.equal(report.schemaVersion,1);
  assert.equal(report.authority,"evaluation-only");
  assert.ok(report.summary.proposals>0);
  assert.ok(report.summary.uncoveredGaps>0);
  for(const type of ["Combobox","Command","Sheet"]){
    const candidate=report.documentedCandidates.find(x=>x.type===type);
    assert.ok(candidate,type+" requires an explicit diagnostic row");
    assert.equal(candidate.decision,"documentation-only");
    assert.equal(candidate.mayActivateFromSemantics,false);
  }
  assert.ok(report.summary.allowlistedWithoutT23Proposal.includes("form-declarative"));
  for(const row of report.evaluations){
    assert.equal(row.mayActivateFromSemantics,false);
    assert.equal(row.mayPublishNewPiType,false);
    assert.equal(row.mayCertifyE2e,false);
  }
  for(const id of ["alert-checkbox","alert-typed","accordion-members","button-copy"]){
    const row=report.evaluations.find(x=>x.scenarioId===id);
    assert.ok(row,id+" must be evaluated");
    assert.ok(["existing-experimental-contract","existing-stable-contract"].includes(row.decision),
      id+" official admission is independently registered");
  }
  assert.equal(readFileSync("pi-catalog/contracts.json","utf8"),original);
});
