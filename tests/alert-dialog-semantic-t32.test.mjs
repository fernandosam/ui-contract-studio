import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const adapter=readFileSync("src/ui-catalog/extensions/components/alert-dialog.tsx","utf8");
const overlay=read("src/ui-catalog/knowledge/alert-dialog.json");
const manifest=read("pi-catalog/contracts.json");
const schemas=read("pi-catalog/props-json-schema.json");
const spec=read("pi-catalog/examples/AlertDialog.json");

test("T32: AlertDialog viewport hardening uses existing API only",()=>{
 assert.match(adapter,/max-h-\[calc\(100dvh-2rem\)\]/);
 assert.match(adapter,/w-\[calc\(100%-2rem\)\]/);
 assert.match(adapter,/overflow-y-auto/);
 assert.match(adapter,/onOpenChange=\{setOpen\}/);
 assert.match(adapter,/<AlertDialogCancel>/);
 assert.match(adapter,/setOpen\(false\);signalConfirm\(emit\)/);
 assert.match(adapter,/return emit\?\.\("confirm"\)/);
 assert.match(adapter,/import\.meta\.env\.DEV/);
 assert.match(adapter,/semanticProbe/);
 assert.doesNotMatch(adapter,/\b(fetch|XMLHttpRequest)\s*\(/);
});

test("T32: Zod/Pi allow only existing AlertDialog props and local confirmation",()=>{
 const contract=manifest.components.find(c=>c.type==="AlertDialog");
 assert.equal(contract?.lifecycle,"stable");
 const schema=schemas.types.AlertDialog;
 assert.ok(schema);
 for(const property of ["trigger","title","description","cancelLabel",
   "confirmLabel","size","confirmVariant"]){
  assert.ok(Object.hasOwn(schema.properties,property),property);
 }
 for(const forbidden of ["typedConfirmation","requireCheckbox","remoteAction","endpoint"]){
  assert.equal(Object.hasOwn(schema.properties,forbidden),false,forbidden);
 }
 assert.deepEqual(schemas.events.AlertDialog,["confirm"]);
 assert.deepEqual(Object.keys(spec.elements[spec.root].props)
   .filter(key=>!Object.hasOwn(schema.properties,key)),[]);
});

test("T32: complex confirmation remains a reviewed separate candidate, not a primitive capability",()=>{
 for(const [id,target] of [
  ["checkbox-gating","AcknowledgedActionDialog"],
  ["typed-confirmation","TypedConfirmationDialog"],
 ]){
  const item=overlay.capabilities.find(c=>c.id===id);
  assert.equal(item.state,"documented-not-implemented");
  assert.deepEqual(item.evidence,[]);
  assert.equal(item.decision.disposition,"propose-composition");
  assert.equal(item.decision.target,target);
 }
 for(const id of ["focus-and-keyboard","mobile-dialog"]){
  assert.equal(overlay.capabilities.find(c=>c.id===id).state,"runtime-review-required");
 }
});

test("T32: existing quality workflow runs AlertDialog regression on desktop and mobile",()=>{
 const workflow=readFileSync(".github/workflows/quality.yml","utf8");
 assert.match(workflow,/tests\/e2e\/alert-dialog-semantic-t32\.spec\.ts/);
 assert.match(workflow,/--project=desktop --project=mobile/);
 assert.match(workflow,/npm run semantic:check 2>&1 \| tee/);
});
