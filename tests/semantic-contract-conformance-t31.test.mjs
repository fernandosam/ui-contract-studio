import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname,join} from "node:path";
import {spawnSync} from "node:child_process";
import {
  auditSemanticContractConformance,validateSemanticContractDecision,
} from "../scripts/lib/semantic-contract-conformance.mjs";

const write=(root,path,value)=>{
  const file=join(root,path);
  mkdirSync(dirname(file),{recursive:true});
  writeFileSync(file,JSON.stringify(value,null,2));
};
const fixture=t=>{
  const root=mkdtempSync(join(tmpdir(),"semantic-contract-t31-"));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  write(root,"src/ui-catalog/contracts.lock.json",{
    components:[{name:"Demo",version:"1.0.0",status:"approved"}],
  });
  write(root,"pi-catalog/contracts.json",{
    projectVersion:"1.0.0",
    components:[{type:"Demo",version:"1.0.0",lifecycle:"stable"}],
  });
  write(root,"pi-catalog/props-json-schema.json",{
    projectVersion:"1.0.0",
    types:{Demo:{properties:{label:{type:"string"}}}},
    events:{Demo:["click"]},
  });
  const profile={
    component:"Demo",curatedSource:"src/ui-catalog/knowledge/demo.json",
    documentationReview:"reviewed-documentation",
    capabilities:[
      {id:"click",state:"implemented-static-evidence",
        evidence:[{path:"src/ui-catalog/extensions/components/demo.tsx",contains:'emit?.("click")'}],
        contractBindings:[{kind:"event",name:"click"}],
        testRequirements:["Click exactly once."]},
      {id:"future",state:"documented-not-implemented",
        evidence:[],testRequirements:["Must remain unavailable."],
        decision:{disposition:"out-of-scope",reason:"No public API required."}},
      {id:"keyboard",state:"runtime-review-required",
        evidence:[],testRequirements:["Review keyboard navigation."]},
    ],
  };
  const capabilityAudit={entries:[
    {component:"Demo",capability:"click",availability:"verified-static"},
    {component:"Demo",capability:"future",availability:"not-implemented"},
    {component:"Demo",capability:"keyboard",availability:"runtime-review-required"},
  ]};
  return {root,profile,capabilityAudit};
};
const audit=({root,profile,capabilityAudit})=>
  auditSemanticContractConformance({root,profiles:[profile],capabilityAudit});

test("T31: audited semantic capability binds only to explicitly authorized Zod event",t=>{
  const value=audit(fixture(t));
  assert.deepEqual(value.errors,[]);
  assert.equal(value.summary.verifiedStatic,1);
  assert.equal(value.summary.schemaBound,1);
  assert.equal(value.summary.notImplemented,1);
  assert.equal(value.summary.runtimeReview,1);
  assert.equal(value.summary.decisionsPending,0);
  assert.equal(value.entries[0].bindings[0].status,"verified-schema");
  assert.equal(value.entries[1].decision.disposition,"out-of-scope");
  assert.ok(value.diagnostics.some(x=>x.status==="runtime-review-required"));
  assert.match(value.disclaimer,/cannot authorize/);
});

test("T31: false public prop claims are blocking even with matching source evidence",t=>{
  const item=fixture(t);
  item.profile.capabilities[0].contractBindings=[{kind:"prop",name:"inventedPermission"}];
  const result=audit(item);
  assert.equal(result.summary.blockingErrors,1);
  assert.match(result.errors[0],/not-in-zod-schema/);
  assert.equal(result.entries[0].bindings[0].status,"not-in-zod-schema");
});

test("T31: a public Zod binding needs matching first-party React evidence",t=>{
  const item=fixture(t);
  item.profile.capabilities[0].evidence=[];
  const result=audit(item);
  assert.ok(result.errors.some(x=>x.includes("implementation-binding-unverified")));
});

test("T31: stale lock / Pi manifest mismatch is blocking, never an automatic admission",t=>{
  const item=fixture(t);
  write(item.root,"pi-catalog/contracts.json",{
    projectVersion:"1.0.0",
    components:[{type:"Demo",version:"2.0.0",lifecycle:"stable"}],
  });
  const result=audit(item);
  assert.ok(result.errors.some(x=>x.includes("contract lock / Pi manifest mismatch")));
  assert.equal(result.components[0].contractStatus,"contract-mismatch");
});

test("T31: not implemented / non-admitted capability can never claim a Zod binding",t=>{
  const item=fixture(t);
  item.profile.capabilities[1].contractBindings=[{kind:"prop",name:"label"}];
  const result=audit(item);
  assert.ok(result.errors.some(x=>x.includes("unauthorized-binding")));
  assert.ok(validateSemanticContractDecision(item.profile.capabilities[1])
    .some(x=>x.includes("only verified implementation")));
});

test("T31: attempted reuse of an unadmitted composition is blocking",t=>{
  const item=fixture(t);
  item.profile.capabilities[1].decision={
    disposition:"reuse-composition",target:"UnadmittedDialog",
    reason:"Would otherwise bypass admission.",
  };
  const result=audit(item);
  assert.ok(result.errors.some(x=>x.includes("is not admitted in the stable Pi channel")));
});

test("T31: invalid or duplicate bindings and unreviewed composition targets are rejected",()=>{
  assert.ok(validateSemanticContractDecision({
    state:"implemented-static-evidence",
    contractBindings:[{kind:"prop",name:"size"},{kind:"prop",name:"size"}],
  }).some(x=>x.includes("duplicate")));
  assert.ok(validateSemanticContractDecision({
    state:"documented-not-implemented",
    decision:{disposition:"propose-composition",reason:"Needed",target:"bad-name"},
  }).some(x=>x.includes("named target")));
});

test("T31: audited guidance is attached to selected Pi context without changing props",()=>{
  const run=spawnSync(process.execPath,[
    "scripts/select-pi-context.mjs","--types=AlertDialog",
    "--metadata-only","--stdout",
  ],{encoding:"utf8"});
  assert.equal(run.status,0,run.stderr);
  const data=JSON.parse(run.stdout);
  const item=data.selected[0];
  assert.equal(item.contract.type,"AlertDialog");
  assert.equal(item.semantic.guidanceOnly,true);
  assert.equal(item.semantic.conformance.contractStatus,"approved");
  assert.ok(item.semantic.capabilities.some(cap=>cap.id==="confirm-signal" &&
    cap.bindings.some(b=>b.name==="confirm" && b.status==="verified-schema")));
  assert.ok(item.semantic.capabilities.some(cap=>cap.id==="typed-confirmation" &&
    cap.availability==="not-implemented"));
  assert.equal(item.propsSchema,undefined); // metadata-only is never a generation API
  assert.match(data.semanticAdvicePolicy,/Advisory only/);
});

test("T31: knowledge edits always enter the blocking audit through existing CI",()=>{
  const workflow=readFileSync(".github/workflows/quality.yml","utf8");
  const offline=workflow.split("  offline-policy:")[1]?.split("  integration:")[0];
  assert.match(offline,/npm run semantic:check 2>&1 \| tee/);
  assert.match(offline,/npm run semantic:report 2>&1 \| tee/);
  assert.match(offline,/contract conformance/);
  const analyzer=readFileSync("scripts/lib/semantic-knowledge.mjs","utf8");
  assert.match(analyzer,/auditSemanticContractConformance\(\{root,profiles:records,capabilityAudit\}\)/);
  assert.match(analyzer,/errors\.push\(\.\.\.semanticConformance\.errors\)/);
});
