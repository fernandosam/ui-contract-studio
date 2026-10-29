import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {semanticAuditEnforcementViolations} from "../scripts/verify-semantic-audit-policy.mjs";
import {browserRequired,isDocumentationOnly} from "../scripts/ci-change-impact.mjs";

const workflow=readFileSync(".github/workflows/quality.yml","utf8");
const scripts=JSON.parse(readFileSync("package.json","utf8")).scripts;

test("T33: every PR/main change must invoke blocking semantic conformance",()=>{
 assert.deepEqual(semanticAuditEnforcementViolations(),[]);
 assert.equal(isDocumentationOnly(["src/ui-catalog/knowledge/alert-dialog.json"]),false);
 assert.equal(browserRequired(["src/ui-catalog/knowledge/alert-dialog.json"]),true);
 assert.equal(browserRequired(["src/ui-catalog/knowledge/new-widget.json"]),true);
});

test("T33: removing semantic:check is detected as a policy violation",()=>{
 const invalid=workflow.replace("npm run semantic:check 2>&1 | tee","echo audit-disabled 2>&1 | tee");
 assert.ok(semanticAuditEnforcementViolations({workflow:invalid})
   .some(message=>message.includes("Blocking semantic:check")));
});

test("T33: path filters are rejected even when they mention source files",()=>{
 const invalid=workflow.replace("  pull_request:\n", "  pull_request:\n    paths-ignore: ['src/ui-catalog/knowledge/**']\n");
 assert.ok(semanticAuditEnforcementViolations({workflow:invalid})
   .some(message=>message.includes("Path-filtered")));
});

test("T33: cannot make offline-policy conditional or suppress failures",()=>{
 const conditional=workflow.replace("  offline-policy:\n","  offline-policy:\n    if: github.event_name == 'push'\n");
 assert.ok(semanticAuditEnforcementViolations({workflow:conditional})
   .some(message=>message.includes("unconditional")));
 const skipped=workflow.replace("npm run semantic:check 2>&1 | tee reports/composition-analysis/semantic-check.log",
   "npm run semantic:check 2>&1 | tee reports/composition-analysis/semantic-check.log || true");
 assert.ok(semanticAuditEnforcementViolations({workflow:skipped})
   .some(message=>message.includes("suppressed")));
});

test("T33: direct catalog check and guard registration cannot be silently removed",()=>{
 const disabled={...scripts,"semantic:check":"echo skipped",
   "semantic:enforcement":"echo skipped"};
 const results=semanticAuditEnforcementViolations({scripts:disabled});
 assert.ok(results.some(x=>x.includes("authoritative analyzer")));
 assert.ok(results.some(x=>x.includes("registered in npm")));
});

test("T33: semantic-derived browser recipes cannot be removed from the required integration job",()=>{
 const missing=workflow.replace(
  "tests/e2e/declarative-form-certification.spec.ts tests/e2e/semantic-derived.spec.ts",
  "tests/e2e/declarative-form-certification.spec.ts");
 assert.ok(semanticAuditEnforcementViolations({workflow:missing})
   .some(message=>message.includes("Required integration job")));
 const skipped=workflow.replace("  integration:\n","  integration:\n    if: github.event_name == 'push'\n");
 assert.ok(semanticAuditEnforcementViolations({workflow:skipped})
   .some(message=>message.includes("Required integration job")));
});

test("T33: semantic reporting and artifact retention remain mandatory",()=>{
 const invalid=workflow.replace("npm run semantic:report 2>&1 | tee","echo skipped 2>&1 | tee");
 assert.ok(semanticAuditEnforcementViolations({workflow:invalid})
   .some(message=>message.includes("report and diagnostics")));
});

test("T33: approved artifact action v7 retains semantic reports, missing uploader remains blocked",()=>{
 const upgraded=workflow.replaceAll("actions/upload-artifact@v4","actions/upload-artifact@v7");
 assert.deepEqual(semanticAuditEnforcementViolations({workflow:upgraded}),[]);
 const removed=upgraded.replaceAll("uses: actions/upload-artifact@v7","uses: actions/checkout@v7");
 assert.ok(semanticAuditEnforcementViolations({workflow:removed}).some(e=>e.includes("report and diagnostics")));
});
