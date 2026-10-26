import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";

const text=path=>readFileSync(path,"utf8");
const json=path=>JSON.parse(text(path));
test("typed confirmation preview exactly matches pinned React and strict Zod proposals",()=>{
 const policy=json("src/ui-catalog/composition-admission/typed-confirmation.json");
 assert.equal(policy.stage,"experimental");
 assert.equal(policy.piAdmission,"experimental-only");
 assert.equal(policy.reviewer,null);
 assert.equal(text(policy.previewFile),text(policy.sourceRecipe));
 assert.equal(text(policy.schemaFile),text(policy.schemaRecipe));
 assert.match(text(policy.schemaFile),/\.strict\(\)/);
 assert.match(text(policy.previewFile),/PROPOSAL ONLY/);
});
test("typed confirmation stays outside stable Pi lock but enters official experimental entries",()=>{
 const target="TypedConfirmationDialog";
 assert.ok(!json("src/ui-catalog/contracts.lock.json").components.some(x=>x.name===target));
 assert.equal(json("pi-catalog/contracts.json").schemaVersion,3);
 assert.equal(json("pi-catalog/contracts.json").components.filter(x=>x.type===target).length,1);
 assert.equal(json("pi-catalog/contracts.json").components.find(x=>x.type===target)?.tier,"experimental");
 for(const file of ["src/ui-catalog/registry.tsx","src/ui-catalog/extensions/registry.tsx",
  "src/ui-catalog/extensions/catalog.ts"]){
  assert.ok(!text(file).includes(target),file+" must never register candidate code");
 }
 const command=spawnSync(process.execPath,["scripts/check-typed-confirmation-admission.mjs","--check"],{
  encoding:"utf8",
 });
 assert.equal(command.status,0,command.stderr);
 assert.match(command.stdout,/admitted experimentally/);
});
test("acceptance evidence cannot replace pending independent review",()=>{
 const policy=json("src/ui-catalog/composition-admission/typed-confirmation.json");
 const required=["manual-screen-reader","security-review","independent-code-review","contract-version-and-lock"];
 for(const name of required)
  assert.ok(policy.gates.some(x=>x.id===name&&x.status==="pending"),name);
 const code=text("src/ui-runtime/typed-confirmation-pilot.tsx");
 assert.match(code,/typedConfirmationDialogSchema\.safeParse/);
 assert.match(code,/Nenhuma operação externa executada/);
 const runner=text("scripts/typed-confirmation-evidence.mjs");
 assert.match(runner,/manualChecks/);
 assert.match(runner,/status:"passed"/);
 const workflow=text(".github/workflows/quality.yml");
 assert.match(workflow,/typed-confirmation-preview/);
 assert.match(workflow,/test:composition:pilot/);
 assert.match(workflow,/upload-artifact@v4/);
});
