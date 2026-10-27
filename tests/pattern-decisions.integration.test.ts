import test from "node:test";
import assert from "node:assert/strict";
import {getPatternFlow,resolvePattern,generatePatternPreview} from "../src/ui-requirements/patterns";
import {tracePattern} from "../src/ui-requirements/traceability";
import {catalog} from "../src/ui-catalog/catalog";
test("T33: each supported pattern asks 3 essential bounded questions",()=>{
 for(const id of ["login","search","list","dashboard"]){
  const flow=getPatternFlow(id)!;
  assert.ok(flow.questions.length>=3&&flow.questions.length<=5,id);
 }
});
test("T33: three new optional presentation decisions use approved contracts only",()=>{
 const cases=[["login",{showHelp:true},"help"],["list",{showSummary:true},"summary"],
  ["dashboard",{showFootnote:true},"footnote"]] as const;
 for(const [id,answers,nodeId] of cases){
  const requirements=resolvePattern(id,answers);
  const spec=generatePatternPreview(requirements);
  assert.equal(spec.elements[nodeId]?.type,"Text");
  assert.equal(catalog.validate(spec).success,true,id);
  const trace=tracePattern(requirements,spec);
  assert.equal(trace.structurallyValid,true,JSON.stringify(trace.issues));
  assert.equal(trace.requirements.find(x=>x.id===Object.keys(answers)[0])?.status,"covered-static");
  const defaultSpec=generatePatternPreview(resolvePattern(id));
  assert.equal(defaultSpec.elements[nodeId],undefined);
 }
});
test("T33: changing an optional presentation element fails independent requirements trace",()=>{
 const req=resolvePattern("login",{showHelp:true});
 const spec=generatePatternPreview(req);
 delete spec.elements.help;
 assert.equal(tracePattern(req,spec).structurallyValid,false);
});
