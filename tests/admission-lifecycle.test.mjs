import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const entries=read("src/ui-catalog/admission-engine/entries.json").entries;
const certifications=read("src/ui-catalog/admission-engine/certifications.json").components;
const official=read("pi-catalog/contracts.json");

test("official manifest lists stable and experimental contracts without changing the stable allowlist",()=>{
 const stable=official.contracts.map(x=>x.type);
 const all=official.entries.map(x=>x.type);
 assert.equal(official.catalogSize,stable.length);
 assert.equal(official.experimentalCatalogSize,entries.length);
 assert.equal(all.length,stable.length+entries.length);
 assert.equal(new Set(all).size,all.length);
 for(const entry of entries){
  const item=official.experimentalContracts.find(x=>x.type===entry.type);
  assert.ok(item,entry.type);
  assert.equal(item.sourceDigest,entry.sourceDigest);
  assert.equal(item.validation.static,"passed");
  assert.equal(item.availability.piExperimental,true);
  const cert=certifications[entry.type];
  const valid=Boolean(cert && cert.status==="passed" && cert.sourceDigest===entry.sourceDigest &&
    cert.protocol===entry.e2eProtocol && entry.e2eProtocol);
  assert.equal(item.availability.piStable,valid);
  assert.equal(item.lifecycle,valid?"stable":"experimental");
  assert.equal(item.validation.e2e,valid?"passed":"pending");
 }
});
test("unsupported and corrupted registry generation is rejected",()=>{
 const run=spawnSync(process.execPath,["scripts/sync-admission-catalog.mjs","--check"],{encoding:"utf8"});
 assert.equal(run.status,0,run.stderr);
});
test("certificate recording cannot be triggered outside trusted GitHub Actions",()=>{
 const run=spawnSync(process.execPath,["scripts/admission-engine.mjs","--certify","--revision="+"f".repeat(40)],
   {encoding:"utf8",env:{...process.env,GITHUB_ACTIONS:"false",ADMISSION_CERTIFY_CONFIRM:"no"}});
 assert.notEqual(run.status,0);
 assert.match(run.stderr,/trusted, explicit manual main-branch/);
});
