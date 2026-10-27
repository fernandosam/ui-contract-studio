import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildSemanticKnowledge, selectAgentSemanticAdvice, validateSemanticOverlay} from "../scripts/lib/semantic-knowledge.mjs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const specs=[
  {name:"Field",slug:"field",version:"1.0.0",
    implemented:["approved-default-slot","title-and-description","orientation-options","invalid-wrapper-state","group-semantics"],
    absent:["native-label-binding","field-error-mapping","fieldset-and-fieldgroup"],
    runtime:["accessible-control-association-runtime","responsive-layout-runtime"]},
  {name:"DatePicker",slug:"date-picker",version:"1.1.0",
    implemented:["single-date-popover","iso-local-value","min-max-calendar-guards","required-and-touched-error",
      "disabled-trigger","bound-value-and-change-signal","name-hidden-form-value","strict-date-props"],
    absent:["date-range-and-multiple-selection","text-time-natural-input","form-submission-and-remote-validation","explicit-clear-action"],
    runtime:["calendar-keyboard-focus-runtime","mobile-calendar-and-error-runtime"]},
  {name:"DataTable",slug:"data-table",version:"1.2.0",
    implemented:["strict-rows-and-columns","local-search-and-remote-debounce","column-sort","page-navigation",
      "row-selection","bound-selected-ids","approved-provider-ids","remote-pending-error-abort",
      "column-types-and-plain-content","caption-empty-and-count"],
    absent:["inline-edit-and-row-actions","column-visibility-and-custom-filters","arbitrary-remote-source","cross-page-select-all"],
    runtime:["screenreader-keyboard-table-runtime","responsive-overflow-and-loading-runtime"]},
];
const lock=read("src/ui-catalog/contracts.lock.json");
const catalog=readFileSync("src/ui-catalog/extensions/catalog.ts","utf8");
const registry=readFileSync("src/ui-catalog/extensions/registry.tsx","utf8");

test("T12 operates only on preapproved extension contracts and keeps versioned APIs",()=>{
  for(const spec of specs){
    const entry=lock.components.find(x=>x.name===spec.name);
    assert.ok(entry,spec.name+" missing from lock");
    assert.equal(entry.status,"approved");
    assert.equal(entry.tier,"extension");
    assert.equal(entry.version,spec.version);
    assert.ok(catalog.includes(spec.name+": {"));
    assert.ok(registry.includes(spec.name+": ("));
  }
  assert.ok(catalog.includes('sourceId: z.enum(["demo-processos","processos-api"])'));
  assert.ok(catalog.includes('events: ["selectionChange", "pageChange", "sortChange"]'));
  assert.ok(catalog.includes('events: ["change"]'));
  assert.ok(catalog.includes('slots: ["default"]'));
});

test("T12 curated overlays provide reviewed purpose, traceable code evidence and candidate-only gaps",()=>{
  const {report,errors}=buildSemanticKnowledge();
  assert.deepEqual(errors,[]);
  for(const spec of specs){
    const overlay=read("src/ui-catalog/knowledge/"+spec.slug+".json");
    assert.deepEqual(validateSemanticOverlay(overlay),[],spec.name);
    assert.equal(overlay.schemaVersion,1);
    assert.equal(overlay.component,spec.name);
    assert.equal(overlay.language,"pt-BR");
    assert.equal(overlay.status,"reviewed-documentation");
    assert.equal(overlay.source.provider,"shadcn");
    assert.equal(overlay.source.url,"https://ui.shadcn.com/docs/components/base/"+spec.slug);
    assert.equal(overlay.source.reviewedOn,"2026-10-27");
    assert.ok(overlay.source.sections.length>=4);
    assert.ok(overlay.purpose.length>20);
    for(const key of ["rationale","whenUse","whenNotUse","agentNotes","integrations","faqDecisions","derivedTestCases"]){
      assert.ok(overlay[key].length>0,spec.name+" missing "+key);
    }
    const capabilities=new Map(overlay.capabilities.map(x=>[x.id,x]));
    assert.equal(capabilities.size,overlay.capabilities.length);
    for(const [state,ids] of [
      ["implemented-static-evidence",spec.implemented],
      ["documented-not-implemented",spec.absent],
      ["runtime-review-required",spec.runtime],
    ])for(const id of ids){
      const cap=capabilities.get(id);
      assert.ok(cap,spec.name+" missing "+id);
      assert.equal(cap.state,state,id);
      if(state==="implemented-static-evidence"){
        assert.ok(cap.evidence.length>0,id);
        for(const proof of cap.evidence)
          assert.ok(readFileSync(proof.path,"utf8").includes(proof.contains),id+" stale evidence");
      }else{
        assert.deepEqual(cap.evidence,[],id);
        assert.ok(overlay.derivedTestCases.some(x=>x.capabilities.includes(id)&&
          (state==="documented-not-implemented"?x.kind==="candidate-not-executable":x.kind!=="candidate-not-executable")),
          id+" missing appropriate derived test");
      }
    }
    assert.equal(overlay.capabilities.length,spec.implemented.length+spec.absent.length+spec.runtime.length);
    const profile=report.profiles.find(x=>x.component===spec.name);
    assert.ok(profile);
    assert.equal(profile.approvedPiType,true);
    assert.equal(profile.curatedSource,"src/ui-catalog/knowledge/"+spec.slug+".json");
    assert.equal(profile.documentationReview,"reviewed-documentation");
    assert.ok(profile.integrationCandidates.every(x=>x.admission==="advisory-only"));
    assert.ok(profile.implementationGaps.every(x=>x.state!=="implemented-static-evidence"));
  }
});

test("T12 advice is scoped and cannot grant new Pi authorizations",()=>{
  const {report,errors}=buildSemanticKnowledge();
  assert.deepEqual(errors,[]);
  const advice=selectAgentSemanticAdvice(report,specs.map(x=>x.name));
  assert.deepEqual(advice.map(x=>x.type).sort(),specs.map(x=>x.name).sort());
  for(const entry of advice){
    assert.equal(entry.guidanceOnly,true);
    assert.ok(entry.integrationCandidates.every(x=>x.admission==="not-granted"));
    assert.ok(entry.implementationGaps.length>0);
  }
  const blocked=buildSemanticKnowledge({approvedNames:new Set(["Button"])}).report;
  assert.deepEqual(selectAgentSemanticAdvice(blocked,specs.map(x=>x.name)),[]);
});

test("T12 code evidence fails closed if fabricated or misclassified",()=>{
  for(const spec of specs){
    const doc=read("src/ui-catalog/knowledge/"+spec.slug+".json");
    const implementation=doc.capabilities.find(c=>c.state==="implemented-static-evidence");
    const bogus=structuredClone(doc);
    bogus.capabilities.find(c=>c.id===implementation.id).evidence[0].contains="INVENTED_T12_EVIDENCE";
    assert.ok(validateSemanticOverlay(bogus).some(e=>e.includes("stale or missing code evidence")),spec.name);
    const absent=doc.capabilities.find(c=>c.state==="documented-not-implemented");
    const invention=structuredClone(doc);
    invention.capabilities.find(c=>c.id===absent.id).state="implemented-static-evidence";
    assert.ok(validateSemanticOverlay(invention).some(e=>e.includes("needs first-party evidence")),spec.name);
  }
});
