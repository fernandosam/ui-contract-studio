import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateSemanticOverlay,buildSemanticKnowledge,selectAgentSemanticAdvice} from "../scripts/lib/semantic-knowledge.mjs";

const name="Separator";
const slug="separator";
const implemented=["orientation-base-ui","decorative-simple-path","horizontal-labeled-break","vertical-stretch"];
const pending=["vertical-labeled-break","custom-line-tokens"];
const runtime=["separator-semantic-runtime","responsive-visibility"];
const doc=JSON.parse(readFileSync("src/ui-catalog/knowledge/"+slug+".json","utf8"));
const copy=value=>structuredClone(value);

test("T18 "+name+" documents scoped capabilities with real source evidence",()=>{
  assert.deepEqual(validateSemanticOverlay(doc),[]);
  assert.equal(doc.component,name);
  assert.equal(doc.schemaVersion,1);
  assert.equal(doc.language,"pt-BR");
  assert.equal(doc.status,"reviewed-documentation");
  assert.equal(doc.source.provider,"ReUI");
  assert.equal(doc.source.url,"https://reui.io/components/"+slug);
  assert.equal(doc.source.reviewedOn,"2026-10-27");
  for(const key of ["purpose","rationale","whenUse","whenNotUse","agentNotes","integrations","faqDecisions","derivedTestCases"])assert.ok(doc[key]?.length,key);
  const byId=new Map(doc.capabilities.map(cap=>[cap.id,cap]));
  assert.equal(byId.size,doc.capabilities.length);
  for(const id of implemented){
    const cap=byId.get(id);
    assert.equal(cap?.state,"implemented-static-evidence",id);
    assert.ok(cap.evidence.length,id);
    for(const proof of cap.evidence) assert.ok(readFileSync(proof.path,"utf8").includes(proof.contains),id+" stale evidence");
  }
  for(const id of pending){
    assert.equal(byId.get(id)?.state,"documented-not-implemented",id);
    assert.deepEqual(byId.get(id).evidence,[]);
    assert.ok(doc.derivedTestCases.some(t=>t.kind==="candidate-not-executable"&&t.capabilities.includes(id)),id);
  }
  for(const id of runtime){
    assert.equal(byId.get(id)?.state,"runtime-review-required",id);
    assert.deepEqual(byId.get(id).evidence,[]);
    assert.ok(doc.derivedTestCases.some(t=>t.kind!=="candidate-not-executable"&&t.capabilities.includes(id)),id);
  }
  assert.ok(doc.derivedTestCases.every(t=>t.capabilities.every(id=>byId.has(id))));
});

test("T18 "+name+" fails closed on fabricated implementation and runtime evidence",()=>{
  const stale=copy(doc);
  stale.capabilities.find(c=>c.id===implemented[0]).evidence[0].contains="T18 nonexistent marker";
  assert.ok(validateSemanticOverlay(stale).some(e=>e.includes("stale or missing code evidence")));
  const promoted=copy(doc);
  promoted.capabilities.find(c=>c.id===pending[0]).state="implemented-static-evidence";
  assert.ok(validateSemanticOverlay(promoted).some(e=>e.includes("needs first-party evidence")));
  const wrong=copy(doc);
  wrong.capabilities.find(c=>c.id===runtime[0]).evidence=[{path:"src/components/ui/button.tsx",contains:"Button"}];
  assert.ok(validateSemanticOverlay(wrong).some(e=>e.includes("unverified capability may not claim implementation evidence")));
});

test("T18 "+name+" keeps advisory knowledge distinct from Pi permissions",()=>{
  const {report,errors}=buildSemanticKnowledge();
  assert.deepEqual(errors,[]);
  const profile=report.profiles.find(p=>p.component===name);
  assert.equal(profile?.documentationReview,"reviewed-documentation");
  assert.equal(profile.approvedPiType,true);
  assert.equal(profile.provenance.reviewedOn,"2026-10-27");
  assert.ok(profile.integrationCandidates.every(item=>item.admission==="advisory-only"));
  assert.deepEqual(profile.implementationGaps.map(c=>c.id).sort(),[...pending,...runtime].sort());
  const advice=selectAgentSemanticAdvice(report,[name]);
  assert.equal(advice.length,1);
  assert.equal(advice[0].guidanceOnly,true);
  assert.ok(advice[0].integrationCandidates.every(item=>item.admission==="not-granted"));
  assert.deepEqual(advice[0].verifiedStaticCapabilities.map(c=>c.id).sort(),implemented.slice().sort());
  assert.deepEqual(selectAgentSemanticAdvice(buildSemanticKnowledge({approvedNames:new Set(["Button"])}).report,[name]),name==="Button"?advice:[]);
});
