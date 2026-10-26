#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildCompositionAnalysis } from "./lib/composition-analysis.mjs";

const args = process.argv.slice(2);
const write = args.includes("--write");
const primitiveArg = args.find(arg => arg.startsWith("--primitive="));
const primitive = primitiveArg?.slice("--primitive=".length);
const { report, errors } = buildCompositionAnalysis();
if (errors.length) {
  for (const error of errors) console.error("✗ " + error);
  process.exit(1);
}
if (primitiveArg && !primitive) {
  console.error("Use --primitive=Button (or another primitive name).");
  process.exit(1);
}
if (primitive) {
  const impact = report.primitiveImpact[primitive] ?? { contracts: [], reuiExamples: [], shadcnBlocks: [] };
  console.log(JSON.stringify({ primitive, ...impact, counts: {
    contracts: impact.contracts.length, reuiExamples: impact.reuiExamples.length, shadcnBlocks: impact.shadcnBlocks.length,
  } }, null, 2));
} else {
  console.log("✓ Composition inventory checked: " + JSON.stringify(report.totals));
  console.log("  Static dependencies discovered for " +
    Object.keys(report.primitiveImpact).length + " primitive types.");
  console.log("  ReUI is gallery-only; new shadcn blocks require pinned original sources and reviewed decisions.");
}
if (write) {
  const file = "reports/composition-analysis/manifest.json";
  mkdirSync(dirname(file), {recursive: true});
  writeFileSync(file, JSON.stringify(report, null, 2) + "\n");
  console.log("✓ Report written to " + file);
}
