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

/** One existing source-controlled CI decision, never a second certificate/PR. */
export function verifyCiAdmissionPolicy(root=rootDefault) {
 const {policy,protocols}=input(root);
 const entries=json(root,"src/ui-catalog/admission-engine/entries.json").entries;
 const candidates=Object.entries(policy.ciAutoAdmit??{});
 for(const [id,digest] of candidates){
  const entry=entries.find(item=>item.id===id);
  const protocol=protocols.candidates?.[id];
  if(id!=="form-declarative" || !entry || entry.type!=="DeclarativeFormFlow" ||
     entry.sourceDigest!==digest || !entry.e2eProtocol ||
     entry.e2eProtocol!==protocol?.protocol || entry.events.length!==0 ||
     !policy.allowedScenarios.includes(id) || !policy.e2eEligible.includes(id))
   fail(id+": stale or unsafe auto-admission; require a separate reviewed change");
  const source=readFileSync(join(root,"scripts/composition-codegen/recipes",id+".component.tsx.txt"),"utf8");
  const schema=readFileSync(join(root,"scripts/composition-codegen/recipes",id+".schema.ts.txt"),"utf8");
  if(!source.includes("PROPOSAL ONLY") || !schema.includes("REVIEW-ONLY") ||
     !schema.includes(".strict()") ||
     /\\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|eval|Function)\\b|navigator\\.clipboard|window\\.location|dangerouslySetInnerHTML|https?:\\/\\//.test(source) ||
     /\\b(?:onSuccess|onError|endpoint|backendUrl|callback|handler)\\b/.test(schema))
   fail(id+": unsafe or expanded API; needs manual contract review");
 }
 return candidates.map(([id])=>id);
}

/** Independently verify the live browser protocol in the already-required CI.
 * No certificate file is changed; the PR and its required status checks are
 * the evidence and admission boundary for local-only, fingerprint-pinned cases.
 */
export function verifyCiAdmission(root=rootDefault,revision=process.env.GITHUB_SHA) {
 if(process.env.GITHUB_ACTIONS!=="true" ||
    !["pull_request","push"].includes(process.env.GITHUB_EVENT_NAME) ||
    !revisionPattern.test(revision??"") ||
    revision!==process.env.GITHUB_SHA)
  fail("CI admission requires an authentic source-bound PR/main GitHub Actions run");
 const ids=verifyCiAdmissionPolicy(root);
 const pi=json(root,"pi-catalog/contracts.json").components;
 const entries=json(root,"src/ui-catalog/admission-engine/entries.json").entries;
 for(const id of ids){
  const entry=entries.find(x=>x.id===id);
  const contract=pi.find(x=>x.type===entry.type);
  if(contract?.lifecycle!=="stable" || contract?.validation?.e2e!=="ci-required")
   fail(id+": Pi manifest not synchronized with exact source-bound CI policy");
  const screens=verifyE2eEvidence(root,{id,target:entry.type,revision});
  if(screens.length<6)fail(id+": incomplete independent desktop/mobile browser evidence");
  console.log("✓ CI admission: "+id+", "+screens.length+" independent browser proofs, source digest "+entry.sourceDigest);
 }
 return ids;
}

function main() {
 const args=process.argv.slice(2);
 const mode=args[0];
 if(!["--check","--publish","--ci-verify"].includes(mode) ||
    (mode==="--publish"
       ? args.slice(1).some(arg=>!/^--revision=[0-9a-f]{40}$/.test(arg)) || args.length>2
       : args.length!==1))
  fail("Use --check, --publish --revision=<40-character SHA> or --ci-verify");
 if(mode==="--check"){
  const data=input(rootDefault);
  runGenerator(rootDefault,"--check");
  const ids=verifyCiAdmissionPolicy(rootDefault);
  const review=reviewSemanticAdmissionsAtRoot(rootDefault);
  console.log("✓ Admission policy and "+data.policy.allowedScenarios.length+
   " reviewed recipes; source-sealed CI admissions: "+ids.join(", "));
  console.log("✓ T24 semantic review: "+review.summary.proposals+" non-authorizing proposals");
 }else if(mode==="--publish"){
  const revision=args[1]?.slice("--revision=".length)??process.env.GITHUB_SHA;
  const manifest=publish(rootDefault,revision);
  console.log("✓ Experimental artifact: "+manifest.candidates.length+" candidates");
 }else verifyCiAdmission(rootDefault);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error("✗ " + error.message); process.exit(1); }
}
