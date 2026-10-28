import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  buildSemanticTestAutomation,loadSemanticTestRecords,semanticTestRecipes,
} from "../scripts/lib/semantic-test-automation.mjs";
import {buildSemanticKnowledge} from "../scripts/lib/semantic-knowledge.mjs";

const clone=value=>structuredClone(value);
const fixtures=loadSemanticTestRecords();
const source=fixtures.find(x=>x.component==="Button");
const one=record=>buildSemanticTestAutomation([record]);

test("registered semantic tests are discovered, traceable and never marked executed",()=>{
  const audit=buildSemanticTestAutomation(fixtures);
  assert.deepEqual(audit.errors,[]);
  assert.equal(audit.summary.registered,15);
  assert.ok(audit.summary.pending>0);
  assert.ok(audit.summary.blocked>0);
  assert.equal(audit.summary.invalid,0);
  assert.equal(audit.summary.partial,14);
  for(const entry of audit.entries.filter(x=>x.status==="registered")){
    assert.equal(entry.execution,"not-run");
    assert.ok(entry.source.startsWith("src/ui-catalog/knowledge/"));
    assert.ok(semanticTestRecipes[entry.recipe]);
    assert.equal(entry.runner,"playwright");
    assert.equal(entry.action,"run-registered-playwright-recipe");
  }
  const report=buildSemanticKnowledge().report;
  assert.deepEqual(report.semanticTestAutomation.summary,audit.summary);
});

test("new supported derived test is automatically registered without editing Playwright suite",()=>{
  const record=clone(source);
  const derived=clone(record.derivedTestCases.find(x=>x.id==="press-event-and-disabled"));
  derived.id="another-supported-case";
  record.derivedTestCases.push(derived);
  const audit=one(record);
  assert.deepEqual(audit.errors,[]);
  assert.equal(audit.entries.find(x=>x.id===derived.id).status,"registered");
  assert.equal(audit.summary.registered,2);
});

test("new prose-only executable test is pending rather than asserted to have passed",()=>{
  const record=clone(source);
  const derived=clone(record.derivedTestCases.find(x=>x.id==="press-event-and-disabled"));
  derived.id="unmapped-new-test";
  delete derived.automation;
  record.derivedTestCases.push(derived);
  const audit=one(record);
  assert.deepEqual(audit.errors,[]);
  assert.equal(audit.entries.find(x=>x.id===derived.id).status,"pending-recipe");
});

test("unknown, mismatched, malformed and unimplemented recipes fail closed",()=>{
  const mutate=(change)=>{
    const record=clone(source);
    const scenario=record.derivedTestCases.find(x=>x.id==="press-event-and-disabled");
    change(record,scenario);
    return one(record);
  };
  for(const change of [
    (_r,s)=>{s.automation.recipe="arbitrary.unknown";},
    (_r,s)=>{s.automation.recipe="dialog.cancel-without-confirm";},
    (_r,s)=>{s.automation.runner="node";},
    (_r,s)=>{s.capabilities=["local-press-event"];},
    (r)=>{r.capabilities.find(x=>x.id==="loading-and-disabled").state="documented-not-implemented";},
  ]) {
    const audit=mutate(change);
    assert.ok(audit.errors.length>0);
    assert.equal(audit.entries.find(x=>x.id==="press-event-and-disabled").status,"invalid");
  }
});

test("candidates stay blocked even if a recipe is supplied",()=>{
  const record=clone(source);
  const pending=record.derivedTestCases.find(x=>x.id==="async-pending-success-error");
  assert.equal(one(record).entries.find(x=>x.id===pending.id).status,"blocked-not-implemented");
  pending.automation={runner:"playwright",recipe:"button.press-disabled"};
  const audit=one(record);
  assert.ok(audit.errors.some(x=>x.includes(pending.id)));
  assert.equal(audit.entries.find(x=>x.id===pending.id).status,"invalid");
});

test("every registered recipe has an explicit reviewed runtime assertion",()=>{
  const source=readFileSync("tests/e2e/semantic-derived.spec.ts","utf8");
  const recipes=buildSemanticTestAutomation(fixtures).entries
    .filter(x=>x.status==="registered").map(x=>x.recipe);
  for(const name of recipes)
    assert.ok(source.includes('"'+name+'":async page=>'),"missing E2E body: "+name);
  assert.match(source,/certification:"not-granted"/);
  assert.match(source,/sourceSha256/);
  assert.doesNotMatch(source,/admission:publish|admission:sync|pi:api --write/);
});

test("pilot recipes cover all five prioritized primitives without unimplemented capabilities",()=>{
  const audit=buildSemanticTestAutomation(fixtures);
  assert.deepEqual(audit.errors,[]);
  const pilot=["Checkbox","Input","Select","Dialog","Tabs"];
  for(const family of pilot){
    const entries=audit.entries.filter(x=>x.component===family&&x.status==="registered");
    assert.ok(entries.length>=2,family+" must have two or more reviewed recipes");
    for(const entry of entries){
      assert.equal(entry.kind,"integration");
      assert.equal(entry.coverage,"partial");
      assert.equal(entry.action,"run-registered-playwright-recipe");
      assert.ok(entry.capabilityStates.every(x=>x.state!=="documented-not-implemented"));
    }
  }
  const pending=audit.entries.filter(x=>x.status==="pending-recipe");
  assert.ok(pending.length>0);
  assert.ok(pending.every(x=>x.action==="implement-reviewed-recipe-and-run-browser"));
  assert.ok(audit.entries.filter(x=>x.status==="blocked-not-implemented")
    .every(x=>x.action==="review-implementation-before-automation"));
});
