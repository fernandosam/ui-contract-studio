import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {buildLayoutCompositionProposals} from "../scripts/lib/layout-composition-proposals.mjs";
import {compareLayoutReuseWithCatalog} from "../scripts/lib/layout-reuse-comparison.mjs";
import {validateE05AdvisoryReport} from "../scripts/validate-layout-composition-proposals.mjs";

const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const lock=read("src/ui-catalog/contracts.lock.json");
const evidence=read("src/ui-requirements/layout-reuse-evidence.json");
const manifest=read("src/ui-catalog/extensions/composites/generated-manifest.json");
const propsSchemas=read("pi-catalog/props-json-schema.json");
const build=()=>buildLayoutCompositionProposals(
 compareLayoutReuseWithCatalog(evidence,lock,manifest,read),
 evidence,lock,propsSchemas,read);
const input=()=>({
 read,lock:structuredClone(lock),propsSchemas:structuredClone(propsSchemas),
 pi:read("pi-catalog/contracts.json"),
 policy:read("src/ui-catalog/admission-engine/policy.json"),
 recipes:read("scripts/composition-codegen/recipes.json"),
 scenarios:read("src/ui-catalog/recommendations/scenarios.json"),
 sources:read("src/ui-catalog/sources.json"),
 protocols:read("src/ui-catalog/admission-engine/protocols.json"),
 entries:read("src/ui-catalog/admission-engine/entries.json")
});
const validate=(report:unknown=build(),inputs=input())=>validateE05AdvisoryReport(report,inputs);

test("E05 proposal validation uses real primitive Zod and never admits any candidate",()=>{
 const report=validate();
 assert.equal(report.status,"validated-advisory-only");
 assert.equal(report.summary.validated,5);
 assert.equal(report.summary.blocked,0);
 assert.ok(report.summary.sourceScreenCount>=3);
 assert.equal(report.piPublication,"forbidden");
 assert.equal(report.e2eCertification,"not-performed");
 assert.ok(report.evaluations.every((row:{admission:string;runtime:string;canPublish:boolean;
  canExecuteAsComposite:boolean;canGrantPiPermissions:boolean})=>
  row.admission==="not-requested"&&row.runtime==="not-tested"&&
  !row.canPublish&&!row.canExecuteAsComposite&&!row.canGrantPiPermissions));
 assert.deepEqual(report,validate());
});

test("E05 proposal Zod is strict: no forged approval, actions or new composite slots",()=>{
 const proposal=build();
 proposal.proposals[0].permissionImpact="allow-remote";
 assert.throws(()=>validate(proposal),/Invalid advisory Zod schema/);
 const extra=build();
 extra.proposals[0].canUseInPi=true;
 assert.throws(()=>validate(extra),/Invalid advisory Zod schema/);
 const slot=build();
 slot.proposals[0].slots[0].name="remoteAction";
 assert.throws(()=>validate(slot),/Invalid advisory Zod schema/);
});

test("E05 source inputs must pass actual primitive Zod, not only declared property names",()=>{
 const inputs=input();
 inputs.read=(path:string)=>{
  const spec=read(path);
  if(path==="src/ui-patterns/form-dialog.json"){
   spec.elements.actions.props.title=42;
  }
  return spec;
 };
 assert.throws(()=>validate(build(),inputs),/real Pi Zod|actual primitive Zod/);
 const tampered=input();
 tampered.propsSchemas.types.Link.properties.href={type:"integer"};
 assert.throws(()=>validate(build(),tampered),/exported schema differs from actual Zod/);
});

test("E05 refuses stale provenance, version changes, unauthorized dependency and policy opt-in",()=>{
 const bad=build();
 bad.proposals[0].properties.parent[0].observedIn.push({layoutId:"fake",nodeId:"fake"});
 assert.throws(()=>validate(bad),/property provenance/);
 const version=input();
 version.lock.components.find((x:{name:string})=>x.name==="Card").version="99.0.0";
 assert.throws(()=>validate(build(),version),/primitive not approved or pinned/);
 const exposure=input();
 exposure.pi.components.push({type:build().proposals[0].id,tier:"composition",lifecycle:"stable"});
 assert.throws(()=>validate(build(),exposure),/collides with authoritative/);
 const policy=input();
 policy.policy.allowedScenarios.push(build().proposals[0].id);
 assert.throws(()=>validate(build(),policy),/Admission Engine policy failed/);
});

test("E05 CLI is deterministic, read-only and rejects undocumented options",()=>{
 const run=(arg:string)=>spawnSync(process.execPath,["node_modules/.bin/tsx","scripts/validate-layout-composition-proposals.mjs",arg],{encoding:"utf8"});
 const a=run("--check");
 const b=run("--check");
 assert.equal(a.status,0,a.stderr||a.stdout);
 assert.equal(b.status,0,b.stderr||b.stdout);
 assert.equal(a.stdout,b.stdout);
 assert.match(a.stdout,/no Pi admission or new permissions/);
 assert.notEqual(run("--publish").status,0);
});
