import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildSemanticKnowledge, validateSemanticOverlay, selectAgentSemanticAdvice} from "../scripts/lib/semantic-knowledge.mjs";

const component="Textarea";
const slug="textarea";
const read=path=>JSON.parse(readFileSync(path,"utf8"));
const overlay=()=>read("src/ui-catalog/knowledge/"+slug+".json");
const implemented=["native-multiline-with-rows","label-name-and-help","local-controlled-value-and-change","disabled-required-readonly","invalid-and-focus-styles","native-maxlength"];
const notImplemented=["character-count-pi","markdown-preview-and-rich-text","submit-and-async-validation"];
const runtime=["accessible-validation-runtime","long-text-resizing-runtime"];

test("T17 "+component+" follows the T01 checklist with verified, classified evidence",()=>{
  const doc=overlay();
  assert.deepEqual(validateSemanticOverlay(doc),[]);
  assert.equal(doc.schemaVersion,1);
  assert.equal(doc.component,component);
  assert.equal(doc.language,"pt-BR");
  assert.equal(doc.status,"reviewed-documentation");
  assert.equal(doc.source.provider,"ReUI");
  assert.equal(doc.source.url,"https://reui.io/components/"+slug);
  assert.equal(doc.source.reviewedOn,"2026-10-27");
  assert.ok(doc.source.sections.length>=4);
  for(const key of ["purpose","rationale","whenUse","whenNotUse","agentNotes"])
    assert.ok(doc[key]?.length,key);
  const expected=new Map([
    ...implemented.map(id=>[id,"implemented-static-evidence"]),
    ...notImplemented.map(id=>[id,"documented-not-implemented"]),
    ...runtime.map(id=>[id,"runtime-review-required"]),
  ]);
  assert.equal(expected.size,doc.capabilities.length,"all capabilities classified");
  assert.equal(new Set(doc.capabilities.map(x=>x.id)).size,doc.capabilities.length);
  for(const cap of doc.capabilities){
    assert.equal(cap.state,expected.get(cap.id),cap.id);
    assert.ok(cap.testRequirements.length>0,cap.id);
    assert.ok(doc.derivedTestCases.some(x=>x.capabilities.includes(cap.id)),cap.id+" uncovered");
    if(cap.state==="implemented-static-evidence"){
      assert.ok(cap.evidence.length,cap.id);
      for(const evidence of cap.evidence)
        assert.ok(readFileSync(evidence.path,"utf8").includes(evidence.contains),cap.id+" stale "+evidence.path);
    }else{
      assert.deepEqual(cap.evidence,[],cap.id+" unadmitted evidence");
      assert.ok(doc.derivedTestCases.some(x=>x.capabilities.includes(cap.id)&&
        (cap.state==="documented-not-implemented"
          ?x.kind==="candidate-not-executable"
          :x.kind!=="candidate-not-executable")),cap.id+" wrong kind");
    }
  }
  assert.ok(doc.integrations.length>=5);
  assert.equal(new Set(doc.integrations.map(x=>x.component)).size,doc.integrations.length);
  assert.ok(doc.faqDecisions.length>=5);
  assert.ok(doc.derivedTestCases.every(x=>x.capabilities.length>0&&x.capabilities.every(id=>expected.has(id))));
});

test("T17 "+component+" keeps documentation, implementation and admission separate",()=>{
  const doc=overlay();
  const {errors,report}=buildSemanticKnowledge();
  assert.deepEqual(errors,[]);
  const profile=report.profiles.find(x=>x.component===component);
  assert.ok(profile);
  assert.equal(profile.approvedPiType,true);
  assert.equal(profile.documentationReview,"reviewed-documentation");
  assert.equal(profile.provenance.reviewedOn,doc.source.reviewedOn);
  assert.deepEqual(profile.implementationGaps.map(x=>x.id).sort(),[...notImplemented,...runtime].sort());
  assert.ok(profile.integrationCandidates.every(x=>x.admission==="advisory-only"));
  const advice=selectAgentSemanticAdvice(report,[component]);
  assert.equal(advice.length,1);
  assert.equal(advice[0].guidanceOnly,true);
  assert.deepEqual(advice[0].verifiedStaticCapabilities.map(x=>x.id).sort(),implemented.slice().sort());
  assert.ok(advice[0].integrationCandidates.every(x=>x.admission==="not-granted"));
  assert.deepEqual(selectAgentSemanticAdvice(buildSemanticKnowledge({approvedNames:new Set(["Button"])}).report,[component]),[]);
});

test("T17 "+component+" fails closed on fabricated code or vendor claims",()=>{
  const doc=overlay();
  const broken=structuredClone(doc);
  broken.capabilities.find(x=>x.state==="implemented-static-evidence").evidence[0].contains="NOT_PRESENT_T17";
  assert.ok(validateSemanticOverlay(broken).some(x=>x.includes("stale or missing code evidence")));
  const invented=structuredClone(doc);
  invented.capabilities.find(x=>x.state==="documented-not-implemented").state="implemented-static-evidence";
  assert.ok(validateSemanticOverlay(invented).some(x=>x.includes("needs first-party evidence")));
  const unauthorized=structuredClone(doc);
  unauthorized.capabilities.find(x=>x.state==="runtime-review-required").evidence=[{path:"src/ui-catalog/catalog.ts",contains:component}];
  assert.ok(validateSemanticOverlay(unauthorized).some(x=>x.includes("unverified capability may not claim implementation evidence")));
  const wrongSource=structuredClone(doc);
  wrongSource.source.url="https://example.test/unsupported";
  assert.ok(validateSemanticOverlay(wrongSource).some(x=>x.includes("invalid curated official source")));
});

test("T17 "+component+" preserves its specific Pi boundaries and regression cases",()=>{
  const doc=overlay();
  assert.ok(doc.agentNotes.some(x=>x.includes("Chromium") && x.includes("rows")));
  assert.ok(doc.agentNotes.some(x=>x.includes("CharacterCountTextarea")));
  const line=readFileSync("src/ui-catalog/catalog.ts","utf8").split("\n").find(x=>x.trim().startsWith("Textarea: { props:"));
  assert.ok(line?.includes('events:["change"]'));
  assert.ok(!line?.includes('"submit"') && !line?.includes('"blur"'));
  assert.ok(doc.derivedTestCases.some(x=>x.id==="character-count-proposal"&&x.kind==="candidate-not-executable"));
});
