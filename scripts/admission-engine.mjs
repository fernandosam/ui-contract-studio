#!/usr/bin/env node
/**
 * Admission Engine — deterministic publication of reviewed composition recipes.
 * This is an opt-in distribution lane, never the authoritative Pi/json-render registry.
 */
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDefault = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hash = value => createHash("sha256").update(value).digest("hex");
const json = (root, path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const revisionPattern = /^[0-9a-f]{40}$/;
const caseIds = ["invalid-and-exact-match", "cancel-and-reopen", "keyboard-focus", "responsive-layout", "schema-and-no-network"];
const projects = ["desktop", "mobile"];
const fail = message => { throw new Error("Admission Engine: " + message); };

export function evaluatePolicy({ policy, recipes, scenarios, lock, pi, sources }) {
  const errors = [];
  if (policy.schemaVersion !== 1 || policy.mode !== "opt-in-experimental" ||
      !Array.isArray(policy.allowedScenarios) || !Array.isArray(policy.e2eEligible))
    errors.push("Invalid policy format");
  const allowed = policy.allowedScenarios ?? [];
  const recipeById = new Map(recipes.recipes.map(entry => [entry.id, entry]));
  const scenarioById = new Map(scenarios.scenarios.map(entry => [entry.id, entry]));
  const approved = new Set(lock.components.filter(entry => entry.status === "approved").map(entry => entry.name));
  const exported = new Set(pi.contracts.map(entry => entry.type));
  const sourced = new Set(sources.components.map(entry => entry.name));
  if (new Set(allowed).size !== allowed.length) errors.push("Duplicate allowlisted scenario");
  if (new Set(policy.e2eEligible ?? []).size !== (policy.e2eEligible ?? []).length)
    errors.push("Duplicate E2E eligibility");
  for (const id of allowed) {
    const recipe = recipeById.get(id), scenario = scenarioById.get(id);
    if (!/^[a-z]+(?:-[a-z]+)*$/.test(id) || !recipe || !scenario ||
        recipe.review !== "required" || scenario.strategy !== "react-candidate" ||
        recipe.target !== scenario.target || !/^[A-Z][A-Za-z0-9]+$/.test(recipe.target)) {
      errors.push(id + ": unknown, unreviewed or invalid recipe");
      continue;
    }
    if (approved.has(recipe.target) || exported.has(recipe.target) || sourced.has(recipe.target))
      errors.push(id + ": already present in the authoritative stable Pi catalog");
    if (!Array.isArray(scenario.dependencies) ||
        scenario.dependencies.some(dependency => !approved.has(dependency)))
      errors.push(id + ": unapproved primitive dependency");
  }
  for (const id of policy.e2eEligible ?? []) {
    if (!allowed.includes(id) || id !== "alert-typed")
      errors.push(id + ": no verified browser evidence protocol");
  }
  if (!allowed.length) errors.push("No explicit allowlisted candidates");
  return errors;
}

export function verifyE2eEvidence(root, candidate, evidenceRoot = "reports/composition-validation/typed-confirmation") {
  if (candidate.id !== "alert-typed") fail("No E2E protocol for " + candidate.id);
  const summary = json(root, join(evidenceRoot, "summary.json"));
  if (summary.schemaVersion !== 1 || summary.target !== candidate.target ||
      summary.admission !== "not-approved" || summary.piExposure !== false ||
      summary.browserChecks?.status !== "passed" || summary.browserChecks?.executions !== 10 ||
      JSON.stringify(summary.browserChecks.projects) !== JSON.stringify(projects) ||
      JSON.stringify(summary.browserChecks.cases?.map(entry => entry.id)) !== JSON.stringify(caseIds))
    fail("Incomplete or incompatible Playwright summary");
  const screenshots = [];
  for (const project of projects) for (const caseId of caseIds) {
    const file = join(evidenceRoot, project, caseId);
    const record = json(root, file + ".json");
    const pngPath = join(root, file + ".png");
    if (record.schemaVersion !== 1 || record.scenarioId !== candidate.id ||
        record.project !== project || record.caseId !== caseId ||
        record.status !== "passed" || record.expectedStatus !== "passed" ||
        record.screenshotStatus !== "captured" || !Number.isInteger(record.retry) ||
        record.retry < 0 || record.retry > 1 || !Array.isArray(record.errors) ||
        record.errors.length || !existsSync(pngPath) || statSync(pngPath).size === 0)
      fail(project + "/" + caseId + ": missing or failing browser evidence");
    screenshots.push({ project, caseId, sha256: hash(readFileSync(pngPath)) });
  }
  return screenshots;
}

function input(root) {
  const policy = json(root, "src/ui-catalog/admission-engine/policy.json");
  const recipes = json(root, "scripts/composition-codegen/recipes.json");
  const scenarios = json(root, "src/ui-catalog/recommendations/scenarios.json");
  const lock = json(root, "src/ui-catalog/contracts.lock.json");
  const pi = json(root, "pi-catalog/contracts.json");
  const sources = json(root, "src/ui-catalog/sources.json");
  const errors = evaluatePolicy({ policy, recipes, scenarios, lock, pi, sources });
  if (errors.length) fail(errors.join("; "));
  return { policy, recipes };
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
        generated.exposedToPi !== false || !generated.fileSha256)
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
      contractApi: "proposal-only", piExposure: false,
      capabilities: ["local-preview"], disabled: ["remote-actions", "arbitrary-jsx", "stable-pi-export"],
      files: generated.fileSha256
    });
  }
  const catalog = {
    schemaVersion: 1, channel: "experimental", sourceRevision: revision,
    policy: "opt-in / no automatic Pi registry mutation",
    stablePiCatalogUnchanged: true, candidates
  };
  writeFileSync(join(target, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
  return catalog;
}

export function promote(root = rootDefault, revision = process.env.GITHUB_SHA, id = "alert-typed") {
  const { policy } = input(root);
  if (!policy.e2eEligible.includes(id)) fail("Candidate has no approved E2E protocol: " + id);
  if (process.env.GITHUB_ACTIONS === "true" &&
      (process.env.GITHUB_REF !== "refs/heads/main" || process.env.GITHUB_EVENT_NAME !== "workflow_dispatch"))
    fail("E2E promotion is restricted to manual workflow_dispatch on main");
  const published = publish(root, revision);
  const candidate = published.candidates.find(entry => entry.id === id);
  const screenshots = verifyE2eEvidence(root, { id, target: candidate.type });
  const base = join(root, "dist/admission");
  const destination = join(base, "stable");
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(join(destination, id), { recursive: true });
  cpSync(join(base, "experimental", id), join(destination, id), { recursive: true });
  const stable = {
    schemaVersion: 1, channel: "stable", status: "e2e-homologated",
    sourceRevision: revision, sourceDigest: candidate.digest,
    candidate: { ...candidate, stage: "stable", eligibleForE2ePromotion: true },
    evidence: { protocol: "typed-confirmation-desktop-mobile", executions: 10, screenshots },
    // Native Pi still needs strict Zod->registry/lock integration; never assert that it happened.
    piExposure: false, piRegistryPromotion: "separate-reviewed-integration-required"
  };
  writeFileSync(join(destination, "catalog.json"), JSON.stringify(stable, null, 2) + "\n");
  return stable;
}

function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  const revision = args.find(entry => entry.startsWith("--revision="))?.slice(11) ?? process.env.GITHUB_SHA;
  if (!["--check", "--publish", "--promote"].includes(mode) ||
      args.slice(1).some(entry => !/^--revision=[0-9a-f]{40}$/.test(entry)))
    fail("Use --check, --publish or --promote [--revision=<40-char SHA>]");
  if (mode === "--check") {
    const data = input(rootDefault);
    runGenerator(rootDefault, "--check");
    console.log("✓ Admission policy and " + data.policy.allowedScenarios.length + " reviewed recipes validated");
  } else if (mode === "--publish") {
    const manifest = publish(rootDefault, revision);
    console.log("✓ Experimental admission artifact: " + manifest.candidates.length + " candidates, Pi unchanged");
  } else {
    const manifest = promote(rootDefault, revision);
    console.log("✓ Post-E2E stable artifact: " + manifest.candidate.type + ", commit " + manifest.sourceRevision);
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error("✗ " + error.message); process.exit(1); }
}
