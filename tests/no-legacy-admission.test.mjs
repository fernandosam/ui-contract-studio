import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const text=path=>readFileSync(path,"utf8");
const official=read("pi-catalog/contracts.json");
const lock=read("src/ui-catalog/contracts.lock.json");
const entries=read("src/ui-catalog/admission-engine/entries.json").entries;
const protocols=read("src/ui-catalog/admission-engine/protocols.json").candidates;

test("v3 manifest defines one lifecycle per component, independent of source tier",()=>{
 assert.equal(official.schemaVersion,3);
 assert.equal(official.components.length,lock.components.length+entries.length);
 assert.equal(new Set(official.components.map(item=>item.type)).size,official.components.length);
 for(const key of ["contracts","experimentalContracts","entries","catalogSize","experimentalCatalogSize"])
  assert.equal(Object.hasOwn(official,key),false,"obsolete manifest field: "+key);
 for(const component of official.components){
  assert.ok(["stable","experimental"].includes(component.lifecycle),component.type);
  assert.ok(["base","extension","composition"].includes(component.tier),component.type);
  assert.ok(!Object.hasOwn(component,"availability"),component.type);
 }
 for(const entry of entries){
  assert.equal(entry.tier,"composition");
  assert.equal(Object.hasOwn(entry,"lifecycle"),false);
  assert.equal(Object.hasOwn(entry,"exposedToPiExperimental"),false);
  assert.equal(official.components.find(item=>item.type===entry.type)?.sourceDigest,entry.sourceDigest);
  assert.equal(protocols[entry.id]?.protocol??null,entry.e2eProtocol);
 }
});
test("all four browser protocols share one verifier and obsolete approval paths are absent",()=>{
 for(const id of Object.keys(protocols))assert.ok(entries.some(entry=>entry.id===id));
 const engine=text("scripts/admission-engine.mjs");
 const evidence=text("scripts/admission-evidence.mjs");
 assert.match(engine,/inspectEvidence\(root,candidate\.id,entry,protocol/);
 assert.doesNotMatch(engine,/export function promote\(/);
 assert.doesNotMatch(engine,/candidate\.id !== "alert-typed"/);
 assert.match(evidence,/Object\.keys\(protocols\)/);
 for(const path of [
  "scripts/check-typed-confirmation-admission.mjs",
  "scripts/typed-confirmation-evidence.mjs",
  "src/ui-catalog/composition-admission/typed-confirmation.json",
 ])assert.equal(existsSync(path),false,path);
});
test("only semantic fingerprints gate reviewed contract changes",()=>{
 assert.equal(lock.components.length,102);
 for(const contract of lock.components){
  assert.match(contract.semanticFingerprint,/^[a-f0-9]{64}$/);
  assert.equal(Object.hasOwn(contract,"fingerprint"),false,contract.name);
 }
 assert.doesNotMatch(text("scripts/check-contract-diff.mjs"),/allowedRetired|prior\.fingerprint/);
 assert.doesNotMatch(text("scripts/lib/contract-lock.mjs"),/fingerprint:createHash/);
});

test("Playwright official capture validates selected references via the same inventory checker",()=>{
 const spec=text("tests/e2e/official-components.spec.ts");
 assert.match(spec,/validateOfficialVisualInventory\(plan, manifest, pi\)/);
 assert.match(spec,/test\.beforeAll\(\(\) => \{/);
 assert.ok(spec.indexOf("test.beforeAll") < spec.indexOf("validateOfficialVisualInventory(plan, manifest, pi)"),
   "Official inventory guard must run in a Playwright hook, not during module import");
 assert.match(spec,/pi-catalog\/contracts\.json/);
 assert.doesNotMatch(spec,/\}\.contracts\.map/);
});
