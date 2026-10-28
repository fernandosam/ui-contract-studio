import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {selectPromotionCandidateIds} from "../scripts/admission-engine.mjs";

const policy=JSON.parse(readFileSync("src/ui-catalog/admission-engine/policy.json","utf8"));
const workflow=readFileSync(".github/workflows/e2e-manual.yml","utf8");
const quality=readFileSync(".github/workflows/quality.yml","utf8");
const engine=readFileSync("scripts/admission-engine.mjs","utf8");

test("T36: one explicitly reviewed eligible candidate; unknown/bulk selections rejected",()=>{
 assert.deepEqual(selectPromotionCandidateIds(policy,"form-declarative"),["form-declarative"]);
 assert.throws(()=>selectPromotionCandidateIds(policy,undefined),/requires --candidate/);
 for(const id of ["all","form-declarative,button-copy","unreviewed-type","../form-declarative","form-declarative;true"]){
  assert.throws(()=>selectPromotionCandidateIds(policy,id),/requires --candidate|not explicitly reviewed/,id);
 }
 const constrained={allowedScenarios:["form-declarative"],e2eEligible:[]};
 assert.throws(()=>selectPromotionCandidateIds(constrained,"form-declarative"),/not explicitly reviewed/);
});

test("T36: no CLI path permits bulk certification, duplicate flag or implicit source change",()=>{
 const attempts=[
  ["--certify"],
  ["--promote"],
  ["--certify","--candidate=all"],
  ["--certify","--candidate=form-declarative","--candidate=button-copy"],
  ["--promote","--candidate=form-declarative,button-copy"],
 ];
 for(const args of attempts){
  const result=spawnSync(process.execPath,["scripts/admission-engine.mjs",...args,"--revision="+"f".repeat(40)],{encoding:"utf8"});
  assert.notEqual(result.status,0,args.join(" "));
  assert.match(result.stderr,/requires --candidate|Use --check|not explicitly reviewed|trusted, explicit manual main-branch/);
 }
 const outside=spawnSync(process.execPath,[
  "scripts/admission-engine.mjs","--certify","--candidate=form-declarative","--revision="+"f".repeat(40)
 ],{encoding:"utf8",env:{...process.env,GITHUB_ACTIONS:"false",GITHUB_SHA:"f".repeat(40),ADMISSION_CERTIFY_CONFIRM:"yes"}});
 assert.notEqual(outside.status,0);
 assert.match(outside.stderr,/trusted, explicit manual main-branch/);
 assert.match(engine,/process\.env\.GITHUB_SHA!==revision/);
});

test("T36: trusted manual run requires explicit form candidate and separate human draft review",()=>{
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/certify_confirm:/);
 assert.match(workflow,/default: false/);
 assert.match(workflow,/form-declarative/);
 assert.match(workflow,/inputs\.certify_confirm == true/g);
 assert.match(workflow,/needs: e2e/);
 assert.match(workflow,/github\.ref == 'refs\/heads\/main'/);
 assert.match(workflow,/npm run admission:evidence:reset/);
 assert.match(workflow,/npm run admission:evidence:report/);
 assert.match(workflow,/npm run admission:promote -- --candidate="\$ADMISSION_CANDIDATE"/);
 assert.match(workflow,/npm run admission:certify -- --candidate="\$ADMISSION_CANDIDATE"/);
 assert.match(workflow,/gh pr create --draft --base main --head/);
 assert.match(workflow,/gh workflow run quality\.yml --ref "\$branch"/);
 assert.match(workflow,/git diff --cached --name-only/);
 assert.match(workflow,/HEAD:refs\/heads\/\$branch/);
 assert.doesNotMatch(workflow,/push origin HEAD:main|HEAD:refs\/heads\/main/);
 assert.match(quality,/workflow_dispatch:/);
 assert.match(quality,/npm run semantic:check/);
 assert.match(quality,/npm run semantic:enforcement/);
});

test("T36: certification cannot change other certificates or grant new Pi APIs",()=>{
 const source=readFileSync("scripts/admission-engine.mjs","utf8");
 assert.match(source,/const selected=selectPromotionCandidateIds\(policy,candidateId\)/);
 assert.match(source,/const promoted=selected\.map/);
 assert.match(source,/const stable=promoteAll\(root,revision,candidateId\)/);
 assert.match(source,/doc\.components\[candidate\.type\]=/);
 assert.match(source,/entry\.sourceDigest!==candidate\.sourceDigest/);
 assert.match(source,/entry\.e2eProtocol!==candidate\.evidence\.protocol/);
 assert.match(source,/verifyE2eEvidence\(root,\{id,target:candidate\.type,revision\}\)/);
 const form=JSON.parse(readFileSync("src/ui-catalog/admission-engine/entries.json","utf8")).entries.find(x=>x.id==="form-declarative");
 const certs=JSON.parse(readFileSync("src/ui-catalog/admission-engine/certifications.json","utf8")).components;
 const pi=JSON.parse(readFileSync("pi-catalog/contracts.json","utf8")).components.find(x=>x.type===form.type);
 assert.equal(certs.DeclarativeFormFlow,undefined);
 assert.equal(pi.lifecycle,"experimental");
});
