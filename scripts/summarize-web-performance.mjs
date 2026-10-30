#!/usr/bin/env node
// E11: consolidate local production-lab JSON; never sends telemetry.
import { lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const scenarioIds = [
  "reui-gallery", "primitive-discovery", "composite-preview",
  "json-example", "login-screen-theme",
];
const profiles = ["desktop", "mobile"];
const hours = 3 * 60 * 60 * 1000;

const fmt = (value, unit = "") =>
  typeof value === "number" && Number.isFinite(value)
    ? (Math.round(value * 100) / 100).toLocaleString("en-US") + unit : "N/D";
const mb = value => fmt(value / (1024 * 1024), " MiB");
const most = numbers => Math.max(...numbers);

function readSafeJson(path) {
  const file = resolve(root, path);
  if (lstatSync(file).isSymbolicLink()) throw new Error("Relatório com symlink recusado: " + path);
  return JSON.parse(readFileSync(file, "utf8"));
}

export function validateBrowserReport(report, project, scenario) {
  if (report?.schemaVersion !== 1 || report?.project !== project || report?.scenario !== scenario ||
    !Array.isArray(report.navigation) || report.navigation.length !== 3 ||
    !report.interactionAutomationWallMs || !Array.isArray(report.interactionAutomationWallMs.samples) ||
    report.interactionAutomationWallMs.samples.length !== 5 ||
    report.interactionAutomationWallMs.samples.some(value => !Number.isFinite(value) || value < 0) ||
    !Number.isFinite(report.interactionAutomationWallMs.p95) ||
    !report.javascriptHeapBytes ||
    report.javascriptHeapBytes.afterEachInteraction?.length !== 5 ||
    report.javascriptHeapBytes.afterEachInteraction.some(value => !Number.isFinite(value) || value < 0) ||
    !Number.isFinite(report.javascriptHeapBytes.beforeInteractions) ||
    !Number.isFinite(report.javascriptHeapBytes.deltaLastMinusFirst) ||
    report.navigation.some(item => !Number.isFinite(item.horizontalOverflowPx) || item.horizontalOverflowPx < 0 ||
      ![item.firstContentfulPaintMs, item.largestContentfulPaintMs].every(value =>
        value === null || (Number.isFinite(value) && value >= 0))) ||
    !Number.isInteger(report.pageErrorCount) || !Number.isInteger(report.blockedExternalRequestCount)) {
    throw new Error("Relatório de navegador incompleto ou incompatível: " + project + "/" + scenario);
  }
  const time = Date.parse(report.measuredAt);
  if (!Number.isFinite(time)) throw new Error("Timestamp inválido: " + project + "/" + scenario);
  return time;
}

export function buildMarkdown(bundle, results) {
  if (bundle?.schemaVersion !== 1 || !bundle.code || !bundle.htmlReferencedCode) {
    throw new Error("Relatório de bundle incompatível");
  }
  const lines = [
    "# E11 — Production web performance lab",
    "",
    "These numbers describe the measured local production build, **not** a certified device or production baseline.",
    "A full mobile device test and human visual review remain outstanding.",
    "",
    "## Bundle sizes",
    "",
    "| Group | Raw | gzip | Brotli |",
    "| --- | ---: | ---: | ---: |",
    "| All JS/CSS emitted | " + mb(bundle.code.raw) + " | " + mb(bundle.code.gzip) + " | " + mb(bundle.code.brotli) + " |",
    "| JS/CSS referenced directly in HTML (lower bound) | " +
      mb(bundle.htmlReferencedCode.raw) + " | " + mb(bundle.htmlReferencedCode.gzip) +
      " | " + mb(bundle.htmlReferencedCode.brotli) + " |",
    "",
    "The HTML-direct figure is **not** the full startup transfer: transitive imports, lazy chunks, caching, compression headers and fonts depend on runtime.",
    "",
    "## Browser measurements",
    "",
    "| Profile | Scenario | First FCP | First LCP | Warm FCP (last run) | Interaction p95* | JS heap before | JS heap delta** | Max horizontal overflow |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  const observations = [];
  for (const project of profiles) {
    for (const scenario of scenarioIds) {
      const r = results[project + "-" + scenario];
      if (!r) throw new Error("Relatório de navegador ausente: " + project + "/" + scenario);
      const overflow = most(r.navigation.map(nav => nav.horizontalOverflowPx));
      const h = r.javascriptHeapBytes;
      lines.push("| " + project + " | " + scenario + " | " +
        fmt(r.navigation[0].firstContentfulPaintMs, " ms") + " | " +
        fmt(r.navigation[0].largestContentfulPaintMs, " ms") + " | " +
        fmt(r.navigation[2].firstContentfulPaintMs, " ms") + " | " +
        fmt(r.interactionAutomationWallMs.p95, " ms") + " | " +
        mb(h.beforeInteractions) + " | " +
        mb(h.deltaLastMinusFirst) + " | " + fmt(overflow, " px") + " |");
      if (overflow > 2) observations.push(project + "/" + scenario + ": horizontal overflow " + overflow + " px");
      if (r.navigation.some(nav => nav.firstContentfulPaintMs === null || nav.largestContentfulPaintMs === null)) {
        observations.push(project + "/" + scenario + ": FCP/LCP unavailable for at least one navigation");
      }
      if (r.pageErrorCount || r.blockedExternalRequestCount) {
        observations.push(project + "/" + scenario + ": JS errors " +
          r.pageErrorCount + "; blocked external requests " + r.blockedExternalRequestCount);
      }
    }
  }
  lines.push("", "Interaction duration is Playwright automation wall time, **not** INP.",
    "Heap delta is a short-run Chromium CDP JS-heap indicator, **not** process RAM or proof of a memory leak.",
    "Pixel 7 is emulated with 4× CPU throttling, 150 ms RTT and 1.6 Mbit/s download; actual hardware is not tested.",
    "", "## Observations requiring review", "",
    ...(observations.length ? observations.map(note => "- " + note) :
      ["No missing paint entries, browser errors, unexpected requests or >2 px horizontal overflow reported by the collected scenarios."]),
    "", "## Baseline status", "",
    "No numeric performance baseline is implicitly approved. Review repeated runs on controlled hardware and use " +
      "the bundle comparison option with an explicitly approved reference before gating regressions.",
    "",
  );
  return lines.join("\n");
}

export function summarizeLocal() {
  const bundle = readSafeJson("reports/web-performance/bundle.json");
  const times = [Date.parse(bundle.measuredAt)];
  const results = {};
  for (const project of profiles) {
    for (const scenario of scenarioIds) {
      const file = "reports/web-performance/browser/" + project + "-" + scenario + ".json";
      const report = readSafeJson(file);
      times.push(validateBrowserReport(report, project, scenario));
      results[project + "-" + scenario] = report;
    }
  }
  const now = Date.now();
  if (times.some(t => !Number.isFinite(t) || t > now + 120_000 || now - t > hours) ||
    most(times) - Math.min(...times) > hours) {
    throw new Error("Resultados antigos ou de execuções diferentes; execute npm run perf:web:all novamente");
  }
  const markdown = buildMarkdown(bundle, results);
  const output = resolve(root, "reports/web-performance/summary.md");
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, markdown, { mode: 0o600 });
  return output;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 2) throw new Error("Esta CLI não aceita argumentos");
    console.log("Relatório E11: " + summarizeLocal());
  } catch (error) {
    console.error("E11: " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}
