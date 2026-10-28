import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const pt = readFileSync("docs/semantic-enrichment-workflow.pt-BR.md", "utf8");
const en = readFileSync("docs/semantic-enrichment-workflow.md", "utf8");

test("T30 instructions cite real semantic commands and their unchanged implementations", () => {
  const expected = {
    "semantic:check": "node scripts/analyze-semantic-knowledge.mjs --check",
    "semantic:report": "node scripts/analyze-semantic-knowledge.mjs --write",
    "semantic:context": "node scripts/analyze-semantic-knowledge.mjs",
    "semantic:ingest": "node scripts/ingest-reui-knowledge.mjs",
    "docs:check": "node scripts/check-docs.mjs",
    "test:offline": "node --test tests/*.test.mjs",
  };
  for (const [command, actual] of Object.entries(expected)) {
    assert.equal(packageJson.scripts[command], actual, command + " changed; review the T30 guide");
    assert.ok(pt.includes("npm run " + command), "pt-BR does not describe " + command);
    assert.ok(en.includes("npm run " + command), "English does not describe " + command);
    const executable = actual.split(" ").find(part => part.startsWith("scripts/"));
    assert.ok(existsSync(executable), "referenced script missing: " + executable);
  }
});

test("T30 audit workflow reflects the checked local sources, guards and reports", () => {
  const requiredPaths = [
    "src/ui-catalog/knowledge/alert-dialog.json",
    "src/ui-catalog/reui-primitive-source-baseline.json",
    "src/ui-catalog/reui-guidance.json",
    "src/ui-catalog/shadcn-guidance.json",
    "src/ui-catalog/semantic-contract-guidance.json",
    "src/ui-catalog/contracts.lock.json",
    "src/ui-catalog/extensions/catalog.ts",
    "src/ui-catalog/reui-semantic-admissions.json",
    "scripts/lib/semantic-knowledge.mjs",
    "scripts/lib/semantic-coverage.mjs",
    "scripts/lib/semantic-freshness.mjs",
    "scripts/semantic-ci-summary.mjs",
    "tests/e2e/semantic-risk-cases.json",
    "tests/e2e/semantic-risk-t29.spec.ts",
    ".github/workflows/quality.yml",
  ];
  for (const path of requiredPaths) {
    assert.ok(existsSync(path), "missing T29-based source: " + path);
  }
  const fields = [
    "schemaVersion", "component", "language", "status", "source.reviewedOn",
    "purpose", "rationale", "whenUse", "whenNotUse", "agentNotes",
    "capabilities", "evidence", "integrations", "faqDecisions", "derivedTestCases",
    "implemented-static-evidence", "documented-not-implemented",
    "runtime-review-required", "candidate-not-executable", "semanticCoverage",
    "semanticFreshness", "semantic-knowledge.json", "semantic-knowledge-report",
    "admission-browser-evidence", "semantic-risk-t29.spec.ts",
    "semantic:check", "semantic:report",
  ];
  for (const field of fields) {
    assert.ok(pt.includes(field), "missing pt-BR workflow topic: " + field);
    assert.ok(en.includes(field), "missing English workflow topic: " + field);
  }
  assert.ok(pt.includes("T25") && en.includes("T25"), "priority integration must remain explicit");
  assert.ok(pt.includes("não") && en.includes("not"), "authority boundary must be explicit");
  assert.match(readFileSync(".github/workflows/quality.yml", "utf8"), /name: semantic-knowledge-report/);
  assert.match(readFileSync(".github/workflows/quality.yml", "utf8"), /tests\/e2e\/semantic-risk-t29\.spec\.ts/);
});

test("T30 workflow is discoverable in both documentation indexes", () => {
  assert.match(readFileSync("docs/README.pt-BR.md", "utf8"), /semantic-enrichment-workflow\.pt-BR\.md/);
  assert.match(readFileSync("docs/README.md", "utf8"), /semantic-enrichment-workflow\.md/);
});
