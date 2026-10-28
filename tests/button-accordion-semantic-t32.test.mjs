import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const manifest=read("pi-catalog/contracts.json").components;
const schemas=read("pi-catalog/props-json-schema.json");
const source=readFileSync("src/ui-catalog/components/playground.tsx","utf8");
const accordionSource=readFileSync("src/components/ui/accordion.tsx","utf8");

test("T32 Button: loading is announced and blocks local press; no new Pi action",()=>{
 assert.match(source,/aria-busy=\{busy\|\|undefined\}/);
 assert.match(source,/disabled=\{props\.disabled\|\|busy\}/);
 assert.match(source,/onClick=\{\(\)=>notify\(emit,"press"\)\}/);
 const button=manifest.find(item=>item.type==="Button");
 assert.equal(button.lifecycle,"stable");
 for(const forbidden of ["onSuccess","onError","fetch","endpoint","onPromise"]){
  assert.equal(Object.hasOwn(schemas.types.Button.properties,forbidden),false,forbidden);
 }
 assert.deepEqual(schemas.events.Button,["press"]);
});

test("T32 Accordion: wrap long content with no new primitive API",()=>{
 assert.match(source,/min-w-0 flex-1 break-words text-left/);
 assert.match(accordionSource,/min-w-0 break-words pt-0 pb-4/);
 const primitive=manifest.find(item=>item.type==="Accordion");
 assert.equal(primitive.lifecycle,"stable");
 for(const forbidden of ["keepMounted","childrenJsx","onboardingStatus","onValueChange"]){
  assert.equal(Object.hasOwn(schemas.types.Accordion.properties,forbidden),false,forbidden);
 }
 assert.ok(!schemas.events.Accordion?.length);
});

test("T32 audited gaps remain proposals, approvals or out-of-scope, never silent schema changes",()=>{
 const expected=[
  ["button","async-lifecycle","propose-composition","AsyncActionButton"],
  ["button","post-action-success-error","propose-composition","AsyncActionButton"],
  ["button","copy-or-external-action","reuse-composition","CopyFeedbackButton"],
  ["accordion","rich-structured-content","propose-composition","RichContentAccordion"],
  ["accordion","onboarding-status-in-basic-contract","reuse-composition","OnboardingChecklist"],
  ["accordion","keep-mounted-ssr","out-of-scope",null],
 ];
 for(const [file,id,disposition,target] of expected){
  const overlay=read("src/ui-catalog/knowledge/"+file+".json");
  const capability=overlay.capabilities.find(c=>c.id===id);
  assert.equal(capability.state,"documented-not-implemented",id);
  assert.equal(capability.decision.disposition,disposition,id);
  assert.equal(capability.decision.target??null,target,id);
 }
 const stable=new Set(manifest.filter(c=>c.lifecycle==="stable").map(c=>c.type));
 assert.ok(stable.has("CopyFeedbackButton"));
 assert.ok(stable.has("OnboardingChecklist"));
 assert.ok(!stable.has("AsyncActionButton"));
 assert.ok(!stable.has("RichContentAccordion"));
});

test("T32 browser regressions are included in the existing focused workflow",()=>{
 const workflow=readFileSync(".github/workflows/quality.yml","utf8");
 assert.match(workflow,/tests\/e2e\/button-accordion-semantic-t32\.spec\.ts/);
 assert.match(workflow,/--project=desktop --project=mobile/);
 assert.match(workflow,/npm run semantic:check/);
});
