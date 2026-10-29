import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { renderSemanticCiSummary } from "../scripts/semantic-ci-summary.mjs";

const cli = resolve("scripts/analyze-semantic-knowledge.mjs");
const sourcePath = "src/ui-catalog/extensions/components/demo.tsx";
const overlayPath = "src/ui-catalog/knowledge/demo.json";
const needle = "export function Demo";
const read = path => JSON.parse(readFileSync(path, "utf8"));
const write = (root, path, content) => {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, typeof content === "string" ? content : JSON.stringify(content));
};
const run = (root, command) => spawnSync(process.execPath, [cli, command], {
  cwd: root, encoding: "utf8",
});
const git = (root, args, date) => {
  const result = spawnSync("git", args, {
    cwd: root, encoding: "utf8",
    env: { ...process.env, ...(date ? {
      GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date,
    } : {}) },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
};
const commit = (root, date) => {
  git(root, ["add", sourcePath]);
  git(root, ["-c", "user.email=ci@example.org", "-c", "user.name=CI fixture",
    "commit", "-q", "-m", "semantic evidence"], date);
};
const makeFixture = t => {
  const root = mkdtempSync(join(tmpdir(), "ui-semantic-t28-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  // The analyzer already reads the canonical baseline from its own module.
  // Supply exactly its guided family names in the isolated test checkout.
  const reui = read("src/ui-catalog/reui-guidance.json");
  write(root, "src/ui-catalog/reui-guidance.json",
    Object.fromEntries(Object.keys(reui).map(name => [name, {}])));
  write(root, "src/ui-catalog/shadcn-guidance.json", {});
  write(root, "src/ui-catalog/semantic-contract-guidance.json", { contracts: {} });
  write(root, "src/ui-catalog/contracts.lock.json", { components: [{ name: "Demo" }] });
  const overlay = {
    schemaVersion: 1, component: "Demo", language: "pt-BR",
    status: "reviewed-documentation",
    source: { provider: "ReUI", url: "https://reui.io/components/demo",
      sections: ["Overview"], reviewedOn: "2026-10-20" },
    purpose: "Render a demonstration component.",
    rationale: ["Keep an explicit code-backed assertion."],
    whenUse: ["For an implemented demo."],
    whenNotUse: ["For pending runtime checks."],
    agentNotes: ["Evidence is advisory, never an admission."],
    capabilities: [
      { id: "render", description: "Render locally.", state: "implemented-static-evidence",
        evidence: [{ path: sourcePath, contains: needle }],
        testRequirements: ["Verify the implementation needle."] },
      { id: "candidate", description: "Future behavior.",
        state: "documented-not-implemented", evidence: [],
        testRequirements: ["Do not execute until admitted."] },
    ],
    integrations: [], faqDecisions: [],
    derivedTestCases: [{ id: "demo-static", kind: "integration",
      description: "Verify demo evidence.", capabilities: ["render"] }],
  };
  write(root, overlayPath, overlay);
  write(root, sourcePath, needle + "() { return 1; }\n");
  git(root, ["init", "-q"]);
  commit(root, "2026-10-19T12:00:00Z");
  return { root, overlay };
};
const reportAt = root => read(join(root, "reports/composition-analysis/semantic-knowledge.json"));

test("T28: valid record passes both real CLI gates and generates accessible report", t => {
  const { root } = makeFixture(t);
  const check = run(root, "--check");
  assert.equal(check.status, 0, check.stderr);
  const report = run(root, "--write");
  assert.equal(report.status, 0, report.stderr);
  const json = reportAt(root);
  assert.equal(json.validation, undefined);
  assert.equal(json.semanticFreshness.summary.current, 1);
  assert.equal(json.semanticFreshness.summary.missingEvidence, 0);
  assert.ok(json.semanticCoverage.components.some(x => x.component === "Demo"));
  assert.match(renderSemanticCiSummary(json), /Validated/);
});

test("T28: changed source with existing needle warns but does not grant or block", t => {
  const { root } = makeFixture(t);
  write(root, sourcePath, needle + "() { return 2; }\n");
  commit(root, "2026-10-22T12:00:00Z");
  assert.equal(run(root, "--check").status, 0);
  const generated = run(root, "--write");
  assert.equal(generated.status, 0, generated.stderr);
  const json = reportAt(root);
  assert.equal(json.semanticFreshness.summary.reviewRequired, 1);
  const diagnostic = json.semanticFreshness.diagnostics[0];
  assert.equal(diagnostic.status, "review-required");
  assert.equal(diagnostic.overlay, overlayPath);
  assert.equal(diagnostic.capabilityId, "render");
  assert.equal(diagnostic.evidencePath, sourcePath);
  assert.match(renderSemanticCiSummary(json), /review-required/);
  assert.equal(json.profiles.find(x => x.component === "Demo").approvedPiType, true);
  assert.match(json.disclaimer, /do not authorize/);
});

test("T28: incomplete curated record blocks check and report, preserving invalid JSON", t => {
  const { root, overlay } = makeFixture(t);
  delete overlay.purpose;
  write(root, overlayPath, overlay);
  const check = run(root, "--check");
  assert.notEqual(check.status, 0);
  assert.match(check.stderr, /purpose must be nonempty/);
  const result = run(root, "--write");
  assert.notEqual(result.status, 0);
  const json = reportAt(root);
  assert.equal(json.validation.status, "failed");
  assert.ok(json.validation.errors.some(x => x.includes("purpose must be nonempty")));
  assert.match(renderSemanticCiSummary(json), /BLOCKED/);
  assert.match(renderSemanticCiSummary(json), /purpose must be nonempty/);
});

test("T28: vanished implementation needle blocks both gates and retains traceable diagnostics", t => {
  const { root } = makeFixture(t);
  write(root, sourcePath, "export function Renamed() { return 2; }\n");
  const check = run(root, "--check");
  assert.notEqual(check.status, 0);
  assert.match(check.stderr, /stale or missing code evidence/);
  const result = run(root, "--write");
  assert.notEqual(result.status, 0);
  const json = reportAt(root);
  assert.equal(json.validation.status, "failed");
  assert.equal(json.semanticFreshness.summary.missingEvidence, 1);
  const diagnostic = json.semanticFreshness.diagnostics[0];
  assert.equal(diagnostic.status, "missing-evidence");
  assert.equal(diagnostic.overlay, overlayPath);
  assert.equal(diagnostic.evidencePath, sourcePath);
  assert.equal(diagnostic.capabilityId, "render");
  const summary = renderSemanticCiSummary(json);
  assert.match(summary, /BLOCKED/);
  assert.match(summary, /missing-evidence/);
  assert.match(summary, /demo\.json/);
});

test("T28: existing quality workflow fails closed while publishing reports on failure", () => {
  const yaml = readFileSync(".github/workflows/quality.yml", "utf8");
  const offline = yaml.split("  offline-policy:")[1]?.split("  integration:")[0];
  assert.ok(offline);
  assert.match(offline, /npm run semantic:check 2>&1 \| tee .*semantic-check\.log/);
  assert.match(offline, /npm run semantic:report 2>&1 \| tee .*semantic-report\.log/);
  assert.equal((offline.match(/shell: bash/g) ?? []).length, 2);
  assert.match(offline, /steps\.semantic-check\.outcome != 'skipped'/);
  assert.match(offline, /actions\/upload-artifact@v(?:4|7)/);
  assert.match(offline, /semantic-knowledge\.json/);
  assert.match(offline, /semantic-ci-summary\.mjs/);
  assert.match(offline, /npm run docs:check && npm run test:offline/);
  assert.match(yaml, / {2}integration:/);
  assert.match(yaml, / {2}admission-browser:/);
});
