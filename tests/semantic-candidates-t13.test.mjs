import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  buildSemanticKnowledge,
  selectAgentSemanticAdvice,
  validateSemanticOverlay,
} from "../scripts/lib/semantic-knowledge.mjs";

const load=path=>JSON.parse(readFileSync(path,"utf8"));
const candidates=["Combobox","Command","Sheet"];
const locked=new Set(load("src/ui-catalog/contracts.lock.json").components.map(x=>x.name));
const pi=new Set(load("pi-catalog/contracts.json").components.map(x=>x.name??x.type));
const clone=value=>structuredClone(value);

test("T13 candidate knowledge is reviewed, evidenced, and never admitted to Pi",()=>{
  const {report,errors}=buildSemanticKnowledge();
  assert.deepEqual(errors,[]);
  for(const name of candidates){
    const doc=load(`src/ui-catalog/knowledge/${name.toLowerCase()}.json`);
    assert.deepEqual(validateSemanticOverlay(doc),[]);
    assert.equal(doc.admission,"candidate-not-admitted");
    assert.equal(doc.status,"reviewed-documentation");
    assert.equal(doc.source.provider,"ReUI");
    assert.equal(doc.source.reviewedOn,"2026-10-27");
    assert.equal(doc.source.url,`https://reui.io/components/${name.toLowerCase()}`);
    assert.ok(doc.capabilities.some(x=>x.state==="implemented-static-evidence" && x.evidence.length>0));
    assert.ok(doc.capabilities.some(x=>x.state==="documented-not-implemented" && x.evidence.length===0));
    assert.ok(doc.capabilities.some(x=>x.state==="runtime-review-required" && x.evidence.length===0));
    assert.ok(doc.derivedTestCases.some(x=>x.kind==="candidate-not-executable"));
    assert.ok(doc.integrations.length>0 && doc.faqDecisions.length>0);
    assert.equal(locked.has(name),false,"must not be in contract lock");
    assert.equal(pi.has(name),false,"must not be in published Pi contracts");
    const profile=report.profiles.find(x=>x.component===name);
    assert.equal(profile.knowledgeAdmission,"candidate-not-admitted");
    assert.equal(profile.documentationReview,"reviewed-documentation");
    assert.equal(profile.approvedPiType,false);
    assert.ok(profile.integrationCandidates.every(x=>x.admission==="advisory-only"));
    assert.ok(profile.implementationGaps.length>0);
  }
  assert.deepEqual(selectAgentSemanticAdvice(report,candidates),[]);
});

test("T13 unknown overlays fail closed unless candidate marking is explicit",()=>{
  const doc=load("src/ui-catalog/knowledge/combobox.json");
  const corrupted=clone(doc);
  corrupted.admission="approved";
  assert.ok(validateSemanticOverlay(corrupted).some(x=>x.includes("invalid documentation-only admission marker")));
  const promoted=buildSemanticKnowledge({
    approvedNames:new Set([...locked,"Combobox"]),
  });
  assert.ok(promoted.errors.some(x=>x.includes("candidate marker conflicts with approved Pi type")));
  const noImplicit=clone(doc);
  delete noImplicit.admission;
  assert.equal(noImplicit.status,"reviewed-documentation");
  // The loader's explicit marker is the only exception for unknown component names.
  const source=readFileSync("scripts/lib/semantic-knowledge.mjs","utf8");
  assert.match(source,/doc\.admission!=="candidate-not-admitted"/);
  assert.match(source,/candidate marker conflicts with approved Pi type/);
  assert.equal(locked.has(noImplicit.component),false);
});

test("T13 candidate profiles have no first-party evidence for unimplemented or runtime-only claims",()=>{
  for(const name of candidates){
    const doc=load(`src/ui-catalog/knowledge/${name.toLowerCase()}.json`);
    const ids=new Set(doc.capabilities.map(x=>x.id));
    assert.equal(ids.size,doc.capabilities.length);
    for(const cap of doc.capabilities){
      assert.ok(cap.testRequirements.length>0);
      if(cap.state==="implemented-static-evidence"){
        assert.ok(cap.evidence.every(e=>e.path===`src/components/ui/${name.toLowerCase()}.tsx`));
        for(const e of cap.evidence){
          assert.ok(readFileSync(e.path,"utf8").includes(e.contains),`stale evidence: ${name}/${cap.id}`);
        }
      }else{
        assert.deepEqual(cap.evidence,[]);
      }
    }
    for(const sample of doc.derivedTestCases){
      assert.ok(sample.capabilities.length>0);
      assert.ok(sample.capabilities.every(id=>ids.has(id)));
    }
  }
});
