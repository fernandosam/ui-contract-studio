import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  buildSemanticKnowledge,
  selectAgentSemanticAdvice,
  validateSemanticOverlay,
} from "../scripts/lib/semantic-knowledge.mjs";

const load=path=>JSON.parse(readFileSync(path,"utf8"));
const slug=name=>name.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();
const existing=["AlertDialog","Dialog","DropdownMenu","Popover","Select","Accordion","Button","Tabs","Table"];
const integrated=["Input","Checkbox","Radio","RadioGroup","Switch","ButtonGroup","Drawer","Tooltip",
  "Field","DatePicker","DataTable","Combobox","Command","Sheet"];
const candidates=["Combobox","Command","Sheet"];
const unapproved=["RadioGroup",...candidates];
const approvedNames=new Set(load("src/ui-catalog/contracts.lock.json").components.map(c=>c.name));
const piNames=new Set(load("pi-catalog/contracts.json").components.map(c=>c.name??c.type));
const report=()=>buildSemanticKnowledge();

test("T14: T09-T13 and T02-T07 reconcile with reviewed sources and advisory profiles",()=>{
  const {report:semantic,errors}=report();
  assert.deepEqual(errors,[]);
  assert.ok(semantic.coverage.curatedOverlays>=existing.length+integrated.length);
  for(const name of [...existing,...integrated]){
    const doc=load("src/ui-catalog/knowledge/"+slug(name)+".json");
    assert.deepEqual(validateSemanticOverlay(doc),[],name);
    assert.equal(doc.component,name);
    assert.equal(doc.status,"reviewed-documentation",name);
    assert.equal(doc.language,"pt-BR",name);
    assert.match(doc.source.reviewedOn,/^\d{4}-\d{2}-\d{2}$/);
    assert.ok(doc.source.url.startsWith("https://reui.io/components/")||
      doc.source.url.startsWith("https://ui.shadcn.com/docs/components/"),name);
    for(const key of ["purpose","rationale","whenUse","whenNotUse","agentNotes"])
      assert.ok(doc[key]?.length,name+": "+key);
    assert.ok(doc.integrations.length>0 && doc.faqDecisions.length>0 && doc.derivedTestCases.length>0,name);
    const profile=semantic.profiles.find(p=>p.component===name);
    assert.ok(profile,name+": missing semantic projection");
    assert.equal(profile.documentationReview,"reviewed-documentation",name);
    assert.equal(profile.approvedPiType,approvedNames.has(name),name);
    assert.equal(profile.provenance.reviewedOn,doc.source.reviewedOn,name);
    assert.ok(profile.integrationCandidates.every(i=>i.admission==="advisory-only" &&
      i.approvedPiType===approvedNames.has(i.component)),name);
    assert.deepEqual(profile.implementationGaps.map(x=>x.id).sort(),
      doc.capabilities.filter(c=>c.state!=="implemented-static-evidence").map(c=>c.id).sort(),name);
  }
});

test("T14: every new implementation claim has literal evidence and every gap has a correctly typed derived test",()=>{
  for(const name of integrated){
    const doc=load("src/ui-catalog/knowledge/"+slug(name)+".json");
    const ids=new Set(doc.capabilities.map(c=>c.id));
    assert.equal(ids.size,doc.capabilities.length,name+": duplicate capabilities");
    const testIds=new Set(doc.derivedTestCases.map(t=>t.id));
    assert.equal(testIds.size,doc.derivedTestCases.length,name+": duplicate derived tests");
    for(const cap of doc.capabilities){
      assert.ok(cap.testRequirements.length>0,name+"/"+cap.id);
      if(cap.state==="implemented-static-evidence"){
        assert.ok(cap.evidence.length>0,name+"/"+cap.id);
        for(const e of cap.evidence){
          assert.ok(e.path.startsWith("src/"),name+"/"+cap.id);
          assert.ok(readFileSync(e.path,"utf8").includes(e.contains),name+"/"+cap.id+": stale code proof");
        }
      }else{
        assert.deepEqual(cap.evidence,[],name+"/"+cap.id+": unverified evidence");
        const expectedKind=cap.state==="documented-not-implemented"?"candidate-not-executable":null;
        assert.ok(doc.derivedTestCases.some(t=>t.capabilities.includes(cap.id) &&
          (expectedKind?t.kind===expectedKind:t.kind!=="candidate-not-executable")),
          name+"/"+cap.id+": gap without appropriate derived test");
      }
    }
    assert.ok(doc.derivedTestCases.every(t=>t.capabilities.every(id=>ids.has(id))),name);
  }
});

test("T14: new candidate types cannot be promoted through documentation, React primitives or composite uses",()=>{
  const {report:semantic,errors}=report();
  assert.deepEqual(errors,[]);
  const advice=selectAgentSemanticAdvice(semantic,[...existing,...integrated]);
  const adviceNames=new Set(advice.map(x=>x.type));
  for(const name of unapproved){
    assert.equal(approvedNames.has(name),false,name);
    assert.equal(piNames.has(name),false,name);
    assert.equal(adviceNames.has(name),false,name);
    const profile=semantic.profiles.find(p=>p.component===name);
    assert.equal(profile.approvedPiType,false,name);
    assert.ok(profile.integrationCandidates.every(i=>i.admission==="advisory-only"),name);
  }
  for(const name of candidates){
    const doc=load("src/ui-catalog/knowledge/"+slug(name)+".json");
    assert.equal(doc.admission,"candidate-not-admitted");
    for(const cap of doc.capabilities.filter(c=>c.state==="implemented-static-evidence"))
      assert.ok(cap.evidence.every(e=>e.path==="src/components/ui/"+slug(name)+".tsx"),
        name+"/"+cap.id+": React implementation is not Pi admission");
    const forced=buildSemanticKnowledge({approvedNames:new Set([...approvedNames,name])});
    assert.ok(forced.errors.some(x=>x.includes("candidate marker conflicts with approved Pi type")),name);
  }
  for(const entry of advice){
    assert.equal(entry.guidanceOnly,true,entry.type);
    assert.ok(entry.integrationCandidates.every(i=>i.admission==="not-granted"),entry.type);
    assert.ok(entry.implementationGaps.every(c=>c.state!=="implemented-static-evidence"),entry.type);
  }
  assert.match(semantic.disclaimer,/do not authorize new props, events, backend actions, or Pi contracts/);
});

test("T14: negative regression — fabricated code, invented Pi support and runtime certification fail closed",()=>{
  for(const name of integrated){
    const doc=load("src/ui-catalog/knowledge/"+slug(name)+".json");
    const implemented=doc.capabilities.find(c=>c.state==="implemented-static-evidence");
    const absent=doc.capabilities.find(c=>c.state==="documented-not-implemented");
    const runtime=doc.capabilities.find(c=>c.state==="runtime-review-required");
    assert.ok(implemented && absent && runtime,name+": missing state partition");
    const forged=structuredClone(doc);
    forged.capabilities.find(c=>c.id===implemented.id).evidence[0].contains="T14_FAKE_CODE_PROOF";
    assert.ok(validateSemanticOverlay(forged).some(e=>e.includes("stale or missing code evidence")),name);
    const promoted=structuredClone(doc);
    promoted.capabilities.find(c=>c.id===absent.id).state="implemented-static-evidence";
    assert.ok(validateSemanticOverlay(promoted).some(e=>e.includes("needs first-party evidence")),name);
    const runtimeClaim=structuredClone(doc);
    runtimeClaim.capabilities.find(c=>c.id===runtime.id).evidence=[{path:"src/components/ui/button.tsx",contains:"buttonVariants"}];
    assert.ok(validateSemanticOverlay(runtimeClaim).some(e=>e.includes("unverified capability may not claim implementation evidence")),name);
  }
});

test("T14: cross-family FAQ, integration and contract boundaries are explicit",()=>{
  const docs=new Map(integrated.map(name=>[name,load("src/ui-catalog/knowledge/"+slug(name)+".json")]));
  const edge=(a,b)=>assert.ok(docs.get(a)?.integrations.some(i=>i.component===b),a+" -> "+b);
  edge("Combobox","Select");
  edge("Command","Dialog");
  edge("Sheet","Drawer");
  edge("Sheet","Dialog");
  for(const name of candidates)
    assert.ok(docs.get(name).faqDecisions.some(q=>/Pi|contrato|admitid/i.test(q.question+" "+q.guidance)),name);
  const group=docs.get("RadioGroup");
  assert.ok(group.capabilities.some(c=>c.id==="radio-group-pi-type"&&c.state==="documented-not-implemented"));
  assert.ok(group.derivedTestCases.some(t=>t.kind==="candidate-not-executable"&&
    t.capabilities.includes("radio-group-pi-type")));
  const sw=docs.get("Switch");
  assert.ok(sw.derivedTestCases.some(t=>t.kind==="candidate-not-executable"&&
    t.capabilities.includes("required-and-invalid-pi")));
  for(const name of ["Field","DatePicker","DataTable"])
    assert.equal(approvedNames.has(name)&&piNames.has(name),true,name+": approved contract must pre-exist");
});
