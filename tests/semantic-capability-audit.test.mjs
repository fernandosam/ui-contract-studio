import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {join,dirname} from "node:path";
import {tmpdir} from "node:os";
import {
  inspectCodeEvidence, auditSemanticCapability, buildCapabilityGapAudit,
} from "../scripts/lib/semantic-capability-audit.mjs";
import {buildSemanticKnowledge} from "../scripts/lib/semantic-knowledge.mjs";

const good = {id:"local-action",description:"Action exists",state:"implemented-static-evidence",
  evidence:[{path:"src/components/ui/button.tsx",contains:"function Button"}],
  testRequirements:["Test button"]};
const documentOnly = {id:"remote-save",description:"Save externally",state:"documented-not-implemented",
  evidence:[],testRequirements:["Review admission and backend authorization"]};
const runtime = {id:"keyboard-review",description:"Keyboard interaction",state:"runtime-review-required",
  evidence:[],testRequirements:["Run browser and assistive-tech checks"]};
const makeProfile = capabilities => ({
  component:"Button",curatedSource:"src/ui-catalog/knowledge/button.json",
  documentationReview:"reviewed-documentation",
  approvedPiType:true,knowledgeAdmission:"existing-catalog-guidance",capabilities,
});

test("T22 verifies every cited first-party fragment but cannot grant Pi permissions",()=>{
  const root=mkdtempSync(join(tmpdir(),"ui-t22-audit-"));
  try{
    const path=join(root,"src/components/ui/button.tsx");
    mkdirSync(dirname(path),{recursive:true});
    writeFileSync(path,"export function Button() { return null }\n");
    const found=auditSemanticCapability(good,{root});
    assert.equal(found.availability,"verified-static");
    assert.deepEqual(found.evidenceChecks.map(x=>x.status),["matched"]);
    assert.match(found.reason,/runtime and Pi admission remain unverified/);
    const second={...good,evidence:[...good.evidence,{path:"src/components/ui/button.tsx",contains:"not in code"}]};
    assert.equal(auditSemanticCapability(second,{root}).availability,"missing-evidence");
    assert.deepEqual(auditSemanticCapability(second,{root}).evidenceChecks.map(x=>x.status),
      ["matched","missing-fragment"]);
    assert.equal(auditSemanticCapability({...good,evidence:[]},{root}).availability,"missing-evidence");
    assert.equal(inspectCodeEvidence({path:"src/../private.txt",contains:"secret"},{root}).status,"unsafe-reference");
    assert.equal(inspectCodeEvidence({path:"src/missing.ts",contains:"x"},{root}).status,"missing-file");
    assert.equal(auditSemanticCapability({...good,evidence:[{
      path:"src/../private.txt",contains:"secret",
    }]},{root}).availability,"missing-evidence");
    assert.equal(auditSemanticCapability(good,{root,reviewStatus:"draft"}).availability,"missing-evidence");
    assert.equal(auditSemanticCapability(undefined,{root}).availability,"missing-record");
  }finally{rmSync(root,{recursive:true,force:true})}
});

test("T22 separates declared non-implementation, missing proof and runtime review",()=>{
  const root=mkdtempSync(join(tmpdir(),"ui-t22-report-"));
  try{
    const path=join(root,"src/components/ui/button.tsx");
    mkdirSync(dirname(path),{recursive:true});
    writeFileSync(path,"export function Button() { return null }\n");
    const noProof={...good,id:"claimed-without-evidence",evidence:[]};
    const contradictory={...documentOnly,id:"contradiction",evidence:[good.evidence[0]]};
    const audit=buildCapabilityGapAudit([
      makeProfile([good,documentOnly,noProof,runtime,contradictory]),
      {component:"GuidanceOnly",curatedSource:null,capabilities:[good]},
    ],{root});
    assert.equal(audit.summary.components,1);
    assert.equal(audit.summary.capabilities,5);
    assert.deepEqual(audit.summary.byAvailability,{
      "verified-static":1,"not-implemented":1,"missing-evidence":2,
      "runtime-review-required":1,"missing-record":0,
    });
    assert.equal(audit.summary.gaps,4);
    const byId=new Map(audit.entries.map(x=>[x.capability,x]));
    assert.equal(byId.get("remote-save").availability,"not-implemented");
    assert.equal(byId.get("claimed-without-evidence").availability,"missing-evidence");
    assert.equal(byId.get("keyboard-review").availability,"runtime-review-required");
    assert.equal(byId.get("contradiction").availability,"missing-evidence");
    assert.ok(audit.entries.every(x=>x.admission==="advisory-only"));
    assert.ok(audit.gaps.every(x=>x.availability!=="verified-static"));
    assert.equal(audit.entries.find(x=>x.capability==="local-action").approvedPiType,true);
  }finally{rmSync(root,{recursive:true,force:true})}
});

test("T22 cross-references real knowledge records with source and keeps candidates outside Pi",()=>{
  const {report,errors}=buildSemanticKnowledge();
  assert.deepEqual(errors,[]);
  const audit=report.capabilityAudit;
  assert.ok(audit.summary.components>=31);
  assert.ok(audit.summary.capabilities>audit.summary.components);
  assert.equal(audit.summary.capabilities,audit.entries.length);
  assert.equal(audit.summary.gaps,audit.gaps.length);
  assert.equal(audit.summary.byAvailability["missing-evidence"],0);
  const find=(component,capability)=>audit.entries.find(x=>x.component===component&&x.capability===capability);
  const implemented=find("Button","local-press-event");
  assert.equal(implemented.availability,"verified-static");
  assert.ok(implemented.evidenceChecks.length>0);
  assert.ok(implemented.evidenceChecks.every(x=>x.status==="matched"));
  assert.equal(find("Button","copy-or-external-action").availability,"not-implemented");
  assert.equal(find("Combobox","pi-selection-contract").availability,"not-implemented");
  assert.equal(find("Combobox","base-ui-root-and-parts").availability,"verified-static");
  assert.equal(find("Combobox","base-ui-root-and-parts").approvedPiType,false);
  assert.equal(find("Combobox","base-ui-root-and-parts").admission,"advisory-only");
  assert.equal(find("AlertDialog","focus-and-keyboard").availability,"runtime-review-required");
  const button=report.profiles.find(x=>x.component==="Button");
  assert.ok(button.implementationGaps.some(x=>x.id==="copy-or-external-action"&&
    x.availability==="not-implemented"&&x.source==="src/ui-catalog/knowledge/button.json"));
  assert.ok(button.implementationGaps.every(x=>x.availability!=="verified-static"));
  assert.match(audit.disclaimer,/not runtime certification or Pi admission/);
});
