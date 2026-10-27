import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {
 browserProjects,patternEvidenceCases,patternEvidenceRoot,
 specFingerprint,verifyPatternBrowserEvidence
} from "../scripts/lib/requirements-browser-evidence";

/** Synthetic records exercise only verifier rejection logic, NEVER runtime certification. */
const revision="a".repeat(40);
function setup(){
 const root=mkdtempSync(join(tmpdir(),"requirements-browser-synthetic-"));
 const folder=join(root,patternEvidenceRoot);
 mkdirSync(folder,{recursive:true});
 writeFileSync(join(folder,"expected.json"),JSON.stringify({schemaVersion:1,sourceRevision:revision,
  cases:patternEvidenceCases.map(c=>({caseId:c.id,flow:c.flow,specFingerprint:specFingerprint(c),checkedRequirementIds:c.checked}))}));
 for(const item of patternEvidenceCases)for(const project of browserProjects){
  const dir=join(root,patternEvidenceRoot,project);
  mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,item.id+".png"),Buffer.from([137,80,78,71,13,10,26,10,2,3,4,5]));
  writeFileSync(join(dir,item.id+".json"),JSON.stringify({
   schemaVersion:1,caseId:item.id,flow:item.flow,project,sourceRevision:revision,
   specFingerprint:specFingerprint(item),checkedRequirementIds:item.checked,
   status:"passed",expectedStatus:"passed",retry:0,screenshotStatus:"captured",errors:[]
  }));
 }
 return root;
}
test("T34: strict report links each declared rendered requirement to sixteen project-specific records",t=>{
 const root=setup();t.after(()=>rmSync(root,{recursive:true,force:true}));
 const result=verifyPatternBrowserEvidence(root,revision);
 assert.equal(result.executions,16);
 assert.equal(result.cases.length,8);
 assert.equal(result.result,"passed");
 assert.ok(result.cases.every(x=>x.projects.length===2));
 assert.ok(result.cases.every(x=>x.requirements.some(y=>y.status==="tested-render")));
 assert.ok(result.evidenceScope.includes("not backend behavior"));
});
test("T34: stale revisions and altered fingerprints fail closed",t=>{
 const root=setup();t.after(()=>rmSync(root,{recursive:true,force:true}));
 assert.throws(()=>verifyPatternBrowserEvidence(root,"b".repeat(40)),/mismatched/);
 const path=join(root,patternEvidenceRoot,"desktop","dashboard-kpis.json");
 const obj=JSON.parse(readFileSync(path,"utf8"));
 writeFileSync(path,JSON.stringify({...obj,specFingerprint:"0".repeat(64)}));
 assert.throws(()=>verifyPatternBrowserEvidence(root,revision),/mismatched/);
});
test("T34: no evidence is valid when cases, coverage or PNG are missing",t=>{
 const root=setup();t.after(()=>rmSync(root,{recursive:true,force:true}));
 const base=join(root,patternEvidenceRoot,"mobile","login-default");
 const data=JSON.parse(readFileSync(base+".json","utf8"));
 writeFileSync(base+".json",JSON.stringify({...data,checkedRequirementIds:["identifier"]}));
 assert.throws(()=>verifyPatternBrowserEvidence(root,revision),/mismatched/);
 writeFileSync(base+".json",JSON.stringify({...data,status:"failed"}));
 assert.throws(()=>verifyPatternBrowserEvidence(root,revision),/mismatched/);
 writeFileSync(base+".json",JSON.stringify(data));
 writeFileSync(base+".png",Buffer.from("not a PNG"));
 assert.throws(()=>verifyPatternBrowserEvidence(root,revision),/PNG/);
 rmSync(root,{recursive:true,force:true});
 assert.throws(()=>verifyPatternBrowserEvidence(root,revision),/missing/);
});
test("T34: invalid source revision cannot create a passed report",t=>{
 const root=setup();t.after(()=>rmSync(root,{recursive:true,force:true}));
 assert.throws(()=>verifyPatternBrowserEvidence(root,"not-a-sha"),/invalid source revision/);
});
