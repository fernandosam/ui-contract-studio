#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const reportPath = "reports/composition-analysis/semantic-knowledge.json";
const quote = String.fromCharCode(96);
const cell = value => quote + String(value ?? "-")
  .replaceAll(quote, "'").replaceAll("|", "\\|").replace(/[\r\n]+/g, " ") + quote;

/** Render only the existing T26/T27 report; never alter gates or admissions. */
export function renderSemanticCiSummary(report) {
  if (!report) return [
    "## Semantic quality (T28)",
    "",
    "**Report unavailable.** Inspect the attached semantic-check.log and semantic-report.log.",
    "The report was not validated or certified.",
    "",
  ].join("\n");

  const errors = report.validation?.status === "failed"
    ? report.validation.errors ?? [] : [];
  const invalid = report.validation?.status === "failed";
  const freshness = report.semanticFreshness?.summary ?? {};
  const coverage = report.semanticCoverage?.totals ?? {};
  const conformance = report.semanticConformance?.summary ?? {};
  const diagnostics = report.semanticFreshness?.diagnostics ?? [];
  const lines = [
    "## Semantic quality (T28)", "",
    invalid
      ? "**BLOCKED: invalid semantic records/evidence.** This JSON is for diagnosis only, not a valid report."
      : "**Validated:** source evidence checks passed; review warnings remain advisory.",
    "",
    "- Curated components: " + (coverage.curatedComponents ?? "?") +
      "; ReUI families: " + (coverage.curatedFamilies ?? "?") + "/" + (coverage.inventoryFamilies ?? "?"),
    "- Freshness (current / review required / missing evidence / history unavailable): " +
      [freshness.current, freshness.reviewRequired, freshness.missingEvidence,
        freshness.historyUnavailable].map(x => x ?? "?").join(" / "),
    "- Contract conformance (static / Zod bindings / pending decisions / blocking): " +
      [conformance.verifiedStatic, conformance.schemaBound, conformance.decisionsPending,
        conformance.blockingErrors].map(x=>x??"?").join(" / "),
    "- Artifact: " + cell(reportPath) + " (with both command logs).", "",
  ];
  if (errors.length) {
    lines.push("### Blocking validation errors", "");
    for (const error of errors.slice(0, 25)) lines.push("- " + cell(error));
    if (errors.length > 25) lines.push("- ... " + (errors.length - 25) + " more in the JSON report");
    lines.push("");
  }
  if (diagnostics.length) {
    lines.push("### Evidence needing attention", "",
      "| Severity | Component / capability | Curated overlay | Code evidence | Reviewed / changed | Action |",
      "| --- | --- | --- | --- | --- | --- |");
    for (const item of diagnostics.slice(0, 25)) lines.push(
      "| " + cell(item.status) + " | " + cell(item.component + " / " + item.capabilityId) +
      " | " + cell(item.overlay) + " | " + cell(item.evidencePath) +
      " | " + cell((item.reviewedOn ?? "?") + " / " + (item.changedAt ?? "?")) +
      " | " + cell(item.action) + " |");
    if (diagnostics.length > 25) lines.push(
      "", "Showing 25 of " + diagnostics.length + " diagnostics; see the full JSON artifact.");
    lines.push("");
  }
  lines.push("A documentation review or static code needle is not runtime certification, " +
    "Pi admission, a Zod schema change or permission.", "");
  return lines.join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = existsSync(reportPath)
    ? JSON.parse(readFileSync(reportPath, "utf8")) : null;
  const markdown = renderSemanticCiSummary(report);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  } else {
    process.stdout.write(markdown);
  }
}
