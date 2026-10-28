#!/usr/bin/env node
/**
 * Admission Engine — deterministic publication of reviewed composition recipes.
 * Reviewed recipes are registered in Pi v3 as compositions; only E2E changes maturity.
 */
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { inspectEvidence } from "./admission-evidence.mjs";
import { evaluatePolicy } from "./lib/admission-policy.mjs";
import { reviewSemanticAdmissionsAtRoot } from "./lib/semantic-admission-review.mjs";
export { evaluatePolicy } from "./lib/admission-policy.mjs";

const rootDefault = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hash = value => createHash("sha256").update(value).digest("hex");
const json = (root, path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const revisionPattern = /^[0-9a-f]{40}$/;
const fail = message => { throw new Error("Admission Engine: " + message); };

export function verifyE2eEvidence(root,candidate) {
  const protocol=json(root,"src/ui-catalog/admission-engine/protocols.json").candidates?.[candidate.id];
  const entry=json(root,"src/ui-catalog/admission-engine/entries.json").entries.find(x=>x.id===candidate.id);
  if(!protocol||!entry||protocol.target!==candidate.target||
     entry.type!==candidate.target||entry.e2eProtocol!==protocol.protocol)
    fail("No E2E protocol for "+candidate.id);
  return inspectEvidence(root,candidate.id,entry,protocol,
    candidate.revision??process.env.GITHUB_SHA??null).screenshots;
}

function input(root) {
  const policy = json(root, "src/ui-catalog/admission-engine/policy.json");
  const recipes = json(root, "scripts/composition-codegen/recipes.json");
  const scenarios = json(root, "src/ui-catalog/recommendations/scenarios.json");
  const lock = json(root, "src/ui-catalog/contracts.lock.json");
  const pi = json(root, "pi-catalog/contracts.json");
  const sources = json(root, "src/ui-catalog/sources.json");
  const protocols=json(root,"src/ui-catalog/admission-engine/protocols.json");
  const errors = evaluatePolicy({ policy, recipes, scenarios, lock, pi, sources, protocols });
  if (errors.length) fail(errors.join("; "));
  return { policy, recipes, protocols };
}

function runGenerator(root, mode) {
  const result = spawnSync(process.execPath,
    ["scripts/generate-composition-proposals.mjs", mode], { cwd: root, encoding: "utf8" });
  if (result.status !== 0)
    fail("Proposal generator failed: " + (result.stderr || result.stdout || result.error?.message || result.status));
}

export function publish(root = rootDefault, revision = process.env.GITHUB_SHA) {
  if (!revisionPattern.test(revision ?? "")) fail("Publication requires a full 40-character commit SHA");
  const { policy, recipes } = input(root);
  runGenerator(root, "--all"); // syntax, imports, strict schemas, fixtures and hash checks
  const target = join(root, "dist/admission/experimental");
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  const candidates = [];
  for (const id of policy.allowedScenarios) {
    const recipe = recipes.recipes.find(entry => entry.id === id);
    const src = join(root, "reports/composition-proposals", id);
    const generated = json(root, join("reports/composition-proposals", id, "manifest.json"));
    if (generated.schemaVersion !== 1 || generated.scenarioId !== id ||
        generated.target !== recipe.target || generated.admission !== "review-required" ||
        generated.registryChannel !== "experimental" || !generated.fileSha256)
      fail(id + ": invalid generated manifest");
    const names = Object.keys(generated.fileSha256).sort();
    const expected = [recipe.componentFile, recipe.schemaFile, recipe.target + ".schema.test.ts", "REVIEW.md"].sort();
    if (JSON.stringify(names) !== JSON.stringify(expected))
      fail(id + ": unexpected generated files");
    for (const name of names) {
      if (!/^[A-Za-z0-9.-]+$/.test(name) || !existsSync(join(src, name)) ||
          hash(readFileSync(join(src, name))) !== generated.fileSha256[name])
        fail(id + ": proposal integrity check failed for " + name);
      mkdirSync(join(target, id), { recursive: true });
      cpSync(join(src, name), join(target, id, name));
    }
    // The declaration is sealed to the code snapshot; edits to templates require a new digest.
    const digest = hash(JSON.stringify({ id, target: recipe.target, files: generated.fileSha256 }));
    candidates.push({
      id, type: recipe.target, stage: "experimental", digest,
      eligibleForE2ePromotion: policy.e2eEligible.includes(id),
      contractApi: "registered-composition", piExposure: true,
      capabilities: ["local-preview"], disabled: ["remote-actions", "arbitrary-jsx"],
      files: generated.fileSha256
    });
  }
  const catalog = {
    schemaVersion: 1, channel: "experimental", sourceRevision: revision,
    policy: "official Pi v3 experimental lane; stable channel blocked until certified", candidates
  };
  writeFileSync(join(target, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
  // Diagnostic sidecar only: NOT part of the Pi manifest or executable catalog.
  const review = reviewSemanticAdmissionsAtRoot(root);
  writeFileSync(join(target, "semantic-review.json"), JSON.stringify(review, null, 2) + "\n");
  return catalog;
}

/** All promotion decisions are independently verified before any stable artifact is written. */
export function promoteAll(root = rootDefault,revision = process.env.GITHUB_SHA) {
 const {policy,protocols}=input(root);
 if(process.env.GITHUB_ACTIONS==="true" &&
   (process.env.GITHUB_REF!=="refs/heads/main" || process.env.GITHUB_EVENT_NAME!=="workflow_dispatch"))
  fail("E2E promotion is restricted to manual workflow_dispatch on main");
 const published=publish(root,revision);
 const entries=json(root,"src/ui-catalog/admission-engine/entries.json").entries;
 const promoted=policy.e2eEligible.map(id=>{
  const candidate=published.candidates.find(entry=>entry.id===id);
  const entry=entries.find(row=>row.id===id);
  const protocol=protocols.candidates[id];
  if(!candidate||!entry||!protocol||entry.e2eProtocol!==protocol.protocol)
   fail(id+": no matching official registry entry or E2E protocol");
  const screenshots=verifyE2eEvidence(root,{id,target:candidate.type,revision});
  return {candidate,entry,protocol,screenShots:screenshots};
 });
 const dir=join(root,"dist/admission/stable");
 rmSync(dir,{recursive:true,force:true});
 mkdirSync(dir,{recursive:true});
 for(const record of promoted){
  cpSync(join(root,"dist/admission/experimental",record.candidate.id),
    join(dir,record.candidate.id),{recursive:true});
 }
 const stable={schemaVersion:1,channel:"stable",status:"e2e-homologated",
  sourceRevision:revision,
  piRegistryPromotion:"fingerprint-bound-certification-required",
  candidates:promoted.map(({candidate,entry,protocol,screenShots})=>({
   ...candidate,stage:"stable",sourceDigest:entry.sourceDigest,
   evidence:{protocol:protocol.protocol,executions:screenShots.length,screenshots:screenShots}
  }))
 };
 writeFileSync(join(dir,"catalog.json"),JSON.stringify(stable,null,2)+"\n");
 return stable;
}

/** Write an auditable certificate only after a genuine, trusted main-branch E2E run. */
export function certify(root = rootDefault,revision = process.env.GITHUB_SHA) {
 if(process.env.GITHUB_ACTIONS!=="true" ||
    process.env.GITHUB_EVENT_NAME!=="workflow_dispatch" ||
    process.env.GITHUB_REF!=="refs/heads/main" ||
    process.env.ADMISSION_CERTIFY_CONFIRM!=="yes" ||
    !/^\d+$/.test(process.env.GITHUB_RUN_ID??""))
  fail("Certificate recording requires a trusted, explicit manual main-branch GitHub Actions run");
 const stable=promoteAll(root,revision);
 const filename=join(root,"src/ui-catalog/admission-engine/certifications.json");
 const doc=JSON.parse(readFileSync(filename,"utf8"));
 if(doc.schemaVersion!==1||!doc.components||Array.isArray(doc.components))
  fail("Invalid certificates");
 for(const candidate of stable.candidates){
  const entry=json(root,"src/ui-catalog/admission-engine/entries.json").entries.find(x=>x.type===candidate.type);
  if(!entry||!entry.sourceDigest||entry.sourceDigest!==candidate.sourceDigest||
     entry.e2eProtocol!==candidate.evidence.protocol)
   fail("Official source digest or protocol changed before certification");
  doc.components[candidate.type]={
   status:"passed",protocol:candidate.evidence.protocol,
   sourceDigest:entry.sourceDigest,sourceRevision:revision,
   githubRunId:process.env.GITHUB_RUN_ID,
   evidenceDigest:hash(JSON.stringify(candidate.evidence))
  };
 }
 writeFileSync(filename,JSON.stringify(doc,null,2)+"\n");
 const result=spawnSync(process.execPath,["scripts/build-pi-api.mjs","--write"],
  {cwd:root,encoding:"utf8"});
 if(result.status!==0)
  fail("Unable to regenerate the official Pi manifest: "+(result.stderr||result.stdout));
 return doc.components;
}
function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  const revision = args.find(entry => entry.startsWith("--revision="))?.slice(11) ?? process.env.GITHUB_SHA;
  if (!["--check", "--publish", "--promote", "--certify"].includes(mode) ||
      args.slice(1).some(entry => !/^--revision=[0-9a-f]{40}$/.test(entry)))
    fail("Use --check, --publish or --promote [--revision=<40-char SHA>]");
  if (mode === "--check") {
    const data = input(rootDefault);
    runGenerator(rootDefault, "--check");
    const review = reviewSemanticAdmissionsAtRoot(rootDefault);
    console.log("✓ T24 semantic admission review: " + review.summary.proposals +
      " proposals evaluated; no types, permissions or certificates added.");
    console.log("✓ Admission policy and " + data.policy.allowedScenarios.length + " reviewed recipes validated");
  } else if (mode === "--publish") {
    const manifest = publish(rootDefault, revision);
    console.log("✓ Experimental admission artifact: " + manifest.candidates.length + " official Pi candidates");
  } else {
    if(mode==="--certify"){
      const certificates=certify(rootDefault,revision);
      console.log("✓ Official Pi certificates recorded: "+Object.keys(certificates).length);
    }else{
      const manifest=promoteAll(rootDefault,revision);
      console.log("✓ Post-E2E stable artifact: "+manifest.candidates.length+" candidates, commit "+manifest.sourceRevision);
    }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error("✗ " + error.message); process.exit(1); }
}
