import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {auditedPatterns,auditedProjects,patternSnapshot,inspectPatternBrowserEvidence} from "../src/ui-requirements/browser-evidence";

test("T34: source-bound pattern evidence requires eight coherent desktop/mobile records",t=>{
 const root=mkdtempSync(join(tmpdir(),"requirements-proof-"));
 t.after(()=>rmSync(root,{recursive:true,force:true}));
 const revision="a".repeat(40),runId="12345";
 // These deliberately synthetic bytes test the validator, not actual Playwright success.
 const png=Buffer.from([137,80,78,71,13,10,26,10,1]);
 for(const project of auditedProjects)for(const pattern of auditedPatterns){
  const dir=join(root,"reports/requirements/browser-evidence",project);mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,pattern+".png"),png);
  writeFileSync(join(dir,pattern+".json"),JSON.stringify({
   schemaVersion:1,sourceRevision:revision,runId,pattern,project,
   caseId:"preview-renders",...patternSnapshot(pattern),status:"passed",
   expectedStatus:"passed",errors:[],screenshotSha256:createHash("sha256").update(png).digest("hex")
  }));
 }
 const verified=inspectPatternBrowserEvidence(root,revision,runId);
 assert.equal(verified.cases,8);
 assert.ok(verified.patternResults.every(x=>x.status==="tested"));
 assert.throws(()=>inspectPatternBrowserEvidence(root,"b".repeat(40),runId),/incompatível/);
 const target=join(root,"reports/requirements/browser-evidence/desktop/login.json");
 const original=readFileSync(target,"utf8");
 writeFileSync(target,original.replace(/"passed"/,'"failed"'));
 assert.throws(()=>inspectPatternBrowserEvidence(root,revision,runId),/incompatível/);
 writeFileSync(target,original);
 const pngPath=join(root,"reports/requirements/browser-evidence/mobile/login.png");
 writeFileSync(pngPath,Buffer.from([0,1,2,3,4,5,6,7,8]));
 assert.throws(()=>inspectPatternBrowserEvidence(root,revision,runId),/incompatível/);
});
test("T34: no run, incorrect Git SHA or unlisted pattern is not certified",()=>{
 assert.throws(()=>patternSnapshot("unapproved-flow"),/não auditado/);
 assert.throws(()=>inspectPatternBrowserEvidence(".", "invalid","x"),/não verificável/);
});
