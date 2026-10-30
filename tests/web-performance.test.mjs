import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { compareBuilds, inspectBuild } from "../scripts/audit-web-performance.mjs";

function buildFixture(run) {
  const dir = mkdtempSync(join(tmpdir(), "e11-web-perf-"));
  mkdirSync(join(dir, "assets"));
  writeFileSync(join(dir, "index.html"),
    '<link rel="stylesheet" href="/assets/main.css"><script type="module" src="/assets/main.js"></script>');
  writeFileSync(join(dir, "assets/main.css"), ".root{display:block}".repeat(25));
  writeFileSync(join(dir, "assets/main.js"), "const x = 1;".repeat(60));
  writeFileSync(join(dir, "assets/deferred.js"), "const feature = true;".repeat(100));
  writeFileSync(join(dir, "assets/image.png"), Buffer.from([137, 80, 78, 71]));
  try { return run(dir); }
  finally { rmSync(dir, { recursive: true, force: true }); }
}

test("measures real production files and distinguishes HTML references from other chunks", () => {
  buildFixture(dir => {
    const report = inspectBuild(dir);
    assert.equal(report.schemaVersion, 1);
    assert.equal(report.fileCount, 5);
    assert.equal(report.codeFiles, 3);
    assert.equal(report.htmlReferences.length, 2);
    assert.ok(report.code.raw > report.htmlReferencedCode.raw);
    assert.ok(report.code.brotli > report.htmlReferencedCode.brotli);
    assert.ok(report.code.gzip > 0);
    assert.equal(report.nonCodeRawBytes, Buffer.byteLength('<link rel="stylesheet" href="/assets/main.css"><script type="module" src="/assets/main.js"></script>') + 4);
    assert.equal(report.files.find(file => file.path === "assets/deferred.js").htmlReferenced, false);
    assert.equal(report.files.find(file => file.path === "assets/main.js").htmlReferenced, true);
  });
});

test("rejects broken build references instead of recording incomplete assets", () => {
  buildFixture(dir => {
    writeFileSync(join(dir, "index.html"),
      '<script type="module" src="/assets/missing.js"></script>');
    assert.throws(() => inspectBuild(dir), /não encontrado/);
  });
});

test("rejects symlinks instead of following files outside the build", () => {
  buildFixture(dir => {
    symlinkSync(join(dir, "index.html"), join(dir, "assets/alias.html"));
    assert.throws(() => inspectBuild(dir), /symlink/);
  });
});

test("a matching baseline passes and a 20 percent gzip regression fails", () => {
  buildFixture(dir => {
    const baseline = inspectBuild(dir);
    assert.equal(compareBuilds(baseline, baseline).some(row => row.regression), false);
    const grown = structuredClone(baseline);
    grown.code.gzip = baseline.code.gzip * 1.25;
    grown.code.brotli = baseline.code.brotli * 1.24;
    grown.htmlReferencedCode.gzip = baseline.htmlReferencedCode.gzip * 1.16;
    const comparisons = compareBuilds(grown, baseline);
    assert.deepEqual(comparisons.map(row => row.regression), [true, true, true]);
  });
});

test("rejects invalid or incomparable baselines", () => {
  buildFixture(dir => {
    const report = inspectBuild(dir);
    assert.throws(() => compareBuilds(report, { schemaVersion: 2 }), /incompatível/);
    const broken = structuredClone(report);
    broken.code.gzip = 0;
    assert.throws(() => compareBuilds(report, broken), /valores válidos/);
  });
});
