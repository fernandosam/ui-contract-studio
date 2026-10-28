import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildSemanticCompositionProposals} from "../src/ui-catalog/recommendations/semantic-gap-proposals.mjs";
import {buildSemanticKnowledge} from "../scripts/lib/semantic-knowledge.mjs";

const entry=(component,capability,availability,extra={})=>({
  component,capability,description:capability,state:availability,
  availability,source:"src/ui-catalog/knowledge/button.json",
  reason:"T22 audited classification",testRequirements:["Test "+capability],
  evidenceChecks:availability==="verified-static"
    ? [{path:"src/components/ui/button.tsx",contains:"Button",status:"matched"}]:[],
  ...extra,
});
const gap=entry("Button","copy-external","not-implemented");
const verified=entry("Button","press","verified-static");
const missing=entry("Button","unverified","missing-evidence");
const runtime=entry("Button","keyboard","runtime-review-required");
const orphan=entry("Button","unmapped","not-implemented");
const sample={
  entries:[gap,verified,missing,runtime,orphan],
  gaps:[gap,missing,runtime,orphan],
};
const scenario=(id,strategy,requiredCapabilities,dependencies=["Button"],target="CopyCandidate")=>({
  id,family:"Button",title:id,target,strategy,dependencies,requiredCapabilities,
  tests:[["integration","Must exercise proposed behavior safely"]],
});

test("T23 retains exact T22 gap provenance and distinguishes a reviewable React proposal",()=>{
  const report=buildSemanticCompositionProposals({
    capabilityAudit:sample,approvedPiTypes:["Button","Stack"],
    scenarios:[scenario("copy","react-candidate",["press","copy-external"])],
  });
  assert.equal(report.summary.auditGaps,4);
  assert.equal(report.summary.coveredGaps,1);
  assert.equal(report.summary.uncoveredGaps,3);
  assert.equal(report.summary.proposals,1);
  const p=report.proposals[0];
  assert.equal(p.id,"gap-copy");
  assert.equal(p.status,"candidate-review-only");
  assert.equal(p.kind,"react-composition");
  assert.equal(p.approval,"candidate-not-admitted");
  assert.equal(p.canUseInPi,false);
  assert.deepEqual(p.originGaps.map(x=>x.capability),["copy-external"]);
  assert.equal(p.originGaps[0].source,gap.source);
  assert.equal(p.originGaps[0].reason,gap.reason);
  assert.deepEqual(p.requiredCapabilities.map(x=>x.capability),["press","copy-external"]);
  assert.equal(p.evidence[0].evidenceChecks[0].status,"matched");
  assert.ok(p.implementationLimitations.some(x=>x.includes("não implementada")));
  assert.ok(p.admissionLimitations.some(x=>x.includes("schema Zod")));
  assert.ok(p.suggestedTests.some(x=>x.description==="Test copy-external"&&
    x.status==="planned-not-executed"));
  assert.ok(p.provenance.includes("src/ui-catalog/recommendations/scenarios.json"));
  assert.ok(report.uncoveredGaps.some(x=>x.capability==="unmapped"));
});

test("T23 blocks unverifiable proof, nonimplemented declarative paths and pending runtime",()=>{
  const scenarios=[
    scenario("unsafe-evidence","react-candidate",["unverified"]),
    scenario("declarative-gap","declarative-composition",["copy-external"],["Stack","Button"],null),
    scenario("runtime-check","reuse-contract",["keyboard"],["Button"],"Button"),
    scenario("missing-record","react-candidate",["copy-external","unknown"]),
  ];
  const report=buildSemanticCompositionProposals({
    capabilityAudit:sample,scenarios,approvedPiTypes:["Button","Stack"],
  });
  const byId=new Map(report.proposals.map(x=>[x.scenarioId,x]));
  assert.equal(byId.get("unsafe-evidence").status,"blocked-evidence");
  assert.equal(byId.get("declarative-gap").status,"blocked-implementation");
  assert.equal(byId.get("runtime-check").status,"runtime-review-required");
  assert.equal(byId.get("missing-record").status,"blocked-evidence");
  assert.equal(byId.get("missing-record").requiredCapabilities[1].availability,"missing-record");
  assert.ok(report.proposals.every(x=>!x.canUseInPi && x.approval==="candidate-not-admitted"));
});

test("T23 rejects unapproved dependencies, impersonated Pi targets, and external actions",()=>{
  const scenarios=[
    scenario("no-dependency-admission","react-candidate",["copy-external"],["Button","UnknownWidget"]),
    scenario("impersonated-target","react-candidate",["copy-external"],["Button"],"Button"),
    scenario("external-action","review-required",["copy-external"],["Button"],null),
  ];
  const report=buildSemanticCompositionProposals({
    capabilityAudit:sample,scenarios,approvedPiTypes:["Button"],
  });
  assert.equal(report.proposals.length,3);
  assert.ok(report.proposals.every(x=>x.status==="blocked-authorization"));
  assert.ok(report.proposals.find(x=>x.scenarioId==="no-dependency-admission")
    .dependencies.some(x=>x.name==="UnknownWidget"&&!x.approvedPiType));
  assert.ok(report.proposals.find(x=>x.scenarioId==="external-action")
    .admissionLimitations.some(x=>x.includes("Efeitos externos")));
});

test("T23 uses the real T22 report but leaves unrelated documentary gaps uncovered",()=>{
  const {report,errors}=buildSemanticKnowledge();
  assert.deepEqual(errors,[]);
  const scenarios=JSON.parse(readFileSync("src/ui-catalog/recommendations/scenarios.json","utf8")).scenarios;
  const lock=JSON.parse(readFileSync("src/ui-catalog/contracts.lock.json","utf8"));
  const result=buildSemanticCompositionProposals({
    capabilityAudit:report.capabilityAudit,scenarios,
    approvedPiTypes:lock.components.filter(x=>x.status==="approved").map(x=>x.name),
  });
  assert.equal(result.summary.auditGaps,report.capabilityAudit.summary.gaps);
  assert.equal(result.summary.coveredGaps+result.summary.uncoveredGaps,result.summary.auditGaps);
  const typed=result.proposals.find(x=>x.scenarioId==="alert-typed");
  assert.equal(typed?.status,"candidate-review-only");
  assert.ok(typed.originGaps.some(x=>x.capability==="typed-confirmation"&&
    x.availability==="not-implemented"&&
    x.source==="src/ui-catalog/knowledge/alert-dialog.json"));
  const copy=result.proposals.find(x=>x.scenarioId==="button-copy");
  assert.equal(copy?.status,"candidate-review-only");
  assert.ok(copy.evidence.some(x=>x.capability==="local-press-event"&&
    x.evidenceChecks.every(y=>y.status==="matched")));
  assert.ok(result.uncoveredGaps.some(x=>x.component==="Combobox"&&
    x.capability==="pi-selection-contract"));
  assert.ok(result.proposals.every(x=>!x.canUseInPi));
});
