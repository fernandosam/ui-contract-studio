import test from "node:test";
import assert from "node:assert/strict";
import { buildMarkdown, scenarioIds, validateBrowserReport } from "../scripts/summarize-web-performance.mjs";

const report = (project, scenario) => ({
  schemaVersion: 1,
  measuredAt: new Date().toISOString(),
  project,
  scenario,
  navigation: Array.from({ length: 3 }, () => ({
    firstContentfulPaintMs: 200,
    largestContentfulPaintMs: 400,
    horizontalOverflowPx: 0,
  })),
  interactionAutomationWallMs: { samples: [1, 2, 3, 4, 5], p95: 4.8 },
  javascriptHeapBytes: {
    beforeInteractions: 1024 * 1024, afterEachInteraction: [1024, 1030, 1031, 1032, 1034],
    deltaLastMinusFirst: 10,
  },
  pageErrorCount: 0,
  blockedExternalRequestCount: 0,
});

test("accepts all required browser samples from the expected scenario", () => {
  const r = report("mobile", "json-example");
  assert.ok(validateBrowserReport(r, "mobile", "json-example") > 0);
});

test("rejects mismatched profiles, missing iterations and unsupported versions", () => {
  const r = report("desktop", "reui-gallery");
  assert.throws(() => validateBrowserReport(r, "mobile", "reui-gallery"), /incompleto/);
  r.navigation.pop();
  assert.throws(() => validateBrowserReport(r, "desktop", "reui-gallery"), /incompleto/);
  r.navigation.push({ horizontalOverflowPx: 0 });
  r.schemaVersion = 99;
  assert.throws(() => validateBrowserReport(r, "desktop", "reui-gallery"), /incompleto/);
});

test("summarizes expected ten scenarios without certifying the emulated mobile profile", () => {
  const results = {};
  for (const project of ["desktop", "mobile"]) {
    for (const scenario of scenarioIds) results[project + "-" + scenario] = report(project, scenario);
  }
  const bundle = {
    schemaVersion: 1, code: { raw: 4_000_000, gzip: 900_000, brotli: 800_000 },
    htmlReferencedCode: { raw: 500_000, gzip: 150_000, brotli: 120_000 },
  };
  const markdown = buildMarkdown(bundle, results);
  assert.match(markdown, /reui-gallery/);
  assert.match(markdown, /login-screen-theme/);
  assert.match(markdown, /Pixel 7 is emulated/);
  assert.match(markdown, /No numeric performance baseline/);
  assert.equal(markdown.split("\n").filter(line => line.startsWith("| mobile |")).length, 5);
});
