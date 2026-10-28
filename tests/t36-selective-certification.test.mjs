import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {verifyCiAdmissionPolicy,verifyCiAdmission} from "../scripts/admission-engine.mjs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const policy=read("src/ui-catalog/admission-engine/policy.json");
const entries=read("src/ui-catalog/admission-engine/entries.json").entries;
const official=read("pi-catalog/contracts.json");
const quality=readFileSync(".github/workflows/quality.yml","utf8");
const manual=readFileSync(".github/workflows/e2e-manual.yml","utf8");
const form=entries.find(x=>x.id==="form-declarative");

test("T36 simplified: only existing reviewed local-only form is CI-admitted, fingerprint pinned",()=>{
 assert.deepEqual(verifyCiAdmissionPolicy(process.cwd()),["form-declarative"]);
 assert.deepEqual(Object.keys(policy.ciAutoAdmit),["form-declarative"]);
 assert.equal(policy.ciAutoAdmit["form-declarative"],form.sourceDigest);
 assert.deepEqual(form.events,[]);
 assert.equal(form.e2eProtocol,"declarative-form-desktop-mobile");
 const pi=official.components.find(x=>x.type===form.type);
 assert.equal(pi.lifecycle,"stable");
 assert.equal(pi.validation.e2e,"ci-required");
 const cert=read("src/ui-catalog/admission-engine/certifications.json").components;
 assert.equal(cert[form.type],undefined,"never fabricate a manual certificate");
 assert.ok(!official.actions.includes("submitRemote"));
});

test("T36 simplified: no manual certificate issuance, bulk promotion or PR-creation workflow",()=>{
 for(const args of [["--certify"],["--promote"],["--ci-verify","--candidate=all"]]){
  const out=spawnSync(process.execPath,["scripts/admission-engine.mjs",...args],{encoding:"utf8"});
  assert.notEqual(out.status,0,args.join(" "));
  assert.match(out.stderr,/Use --check/);
 }
 for(const file of [quality,manual]){
  assert.doesNotMatch(file,/gh pr create|admission:certify|admission:promote/);
 }
 assert.doesNotMatch(manual,/certify:|certify_confirm:|contents: write|pull-requests: write/);
 const scripts=read("package.json").scripts;
 assert.equal(scripts["admission:certify"],undefined);
 assert.equal(scripts["admission:promote"],undefined);
});

test("T36 simplified: real fingerprint-bound browser proof runs in required CI job",()=>{
 const integration=quality.split("  integration:\n")[1]?.split("  admission-browser:\n")[0]??"";
 assert.match(integration,/setup-chromium/);
 assert.match(integration,/declarative-form-certification\.spec\.ts/);
 assert.match(integration,/--project=desktop --project=mobile/);
 assert.match(integration,/admission-evidence\.mjs --report --candidate=form-declarative/);
 assert.match(integration,/admission-engine\.mjs --ci-verify/);
 assert.ok(integration.indexOf("playwright test")<integration.indexOf("admission-engine.mjs --ci-verify"));
 assert.match(integration,/npm run build/);
 assert.match(quality,/npm run semantic:check/);
 assert.match(quality,/npm run contracts:diff/);
});

test("T36 simplified: evidence is never self-certified outside trusted CI",()=>{
 assert.throws(()=>verifyCiAdmission(process.cwd(),"f".repeat(40)),/authentic source-bound PR\/main GitHub Actions run/);
 const run=spawnSync(process.execPath,["scripts/admission-engine.mjs","--ci-verify"],{
  encoding:"utf8",env:{...process.env,GITHUB_ACTIONS:"false",GITHUB_SHA:"f".repeat(40)}
 });
 assert.notEqual(run.status,0);
 assert.match(run.stderr,/authentic source-bound/);
 const admission=readFileSync("scripts/admission-engine.mjs","utf8");
 assert.match(admission,/verifyE2eEvidence\(root,\{id,target:entry\.type,revision\}\)/);
 assert.match(admission,/sourceDigest!==digest/);
 assert.match(admission,/source-bound CI policy/);
});
