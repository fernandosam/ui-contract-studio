import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {autoMergeEligibility} from "../scripts/ci-auto-merge-policy.mjs";

const row=(filename,extra={})=>({filename,status:"modified",...extra});
const decision=(...files)=>autoMergeEligibility([files.map(x=>typeof x==="string"?row(x):x)]);

test("ordinary same-repository changes are eligible only for native gated auto-merge",()=>{
 for(const paths of [
  ["README.md"],["docs/development.pt-BR.md","src/ui-catalog/knowledge/alert-dialog.json"],
  ["src/ui-runtime/requirements-wizard.tsx","tests/requirements-flow.integration.test.ts"],
  ["src/ui-catalog/recommendations/engine.ts","tests/e2e/semantic-risk-t29.spec.ts"],
 ]){
  const result=decision(...paths);
  assert.equal(result.eligible,true,result.reason);
 }
});

test("sensitive workflow, Pi, schema/permission, dependencies and policy changes require ordinary review",()=>{
 for(const file of [
  ".github/workflows/quality.yml",".github/actions/setup-deps/action.yml",
  "src/ui-catalog/admission-engine/policy.json","src/ui-catalog/admission-engine/generated/NewForm.schema.ts",
  "src/ui-catalog/admission-engine/certifications.json",
  "src/ui-catalog/contracts.lock.json","src/ui-catalog/catalog.ts",
  "src/ui-catalog/extensions/catalog.ts","src/ui-catalog/registry.tsx",
  "pi-catalog/contracts.json","pi-catalog/other.schema.json",
  "scripts/ci-auto-merge-policy.mjs","scripts/ci-change-impact.mjs",
  "scripts/admission-engine.mjs","scripts/build-pi-api.mjs",
  "package.json","package-lock.json","server/routes.ts","backend/handler.ts"
 ]){
  const result=decision("docs/readme.md",file);
  assert.equal(result.eligible,false,file);
  assert.match(result.reason,/Sensitive change/);
 }
});

test("renames, pagination and malformed/missing file metadata fail closed",()=>{
 assert.equal(autoMergeEligibility([]).eligible,false);
 assert.equal(autoMergeEligibility([[]]).eligible,false);
 assert.equal(autoMergeEligibility({files:[]}).eligible,false);
 assert.equal(autoMergeEligibility([[row("../bad")]]).eligible,false);
 assert.equal(autoMergeEligibility([[row("wrong\nname")]]).eligible,false);
 assert.equal(autoMergeEligibility([[{filename:"docs/new.md",status:"renamed"}]]).eligible,false);
 assert.equal(autoMergeEligibility([[row("docs/readme.md")],[row("src/ui-runtime/app.tsx")]]).eligible,true);
 const rename=autoMergeEligibility([[{filename:"docs/renamed.md",previous_filename:".github/workflows/quality.yml",status:"renamed"}]]);
 assert.equal(rename.eligible,false);
 assert.match(rename.reason,/\.github\/workflows/);
 assert.equal(autoMergeEligibility([[row("docs/good.md")],null]).eligible,false);
 assert.equal(autoMergeEligibility([Array.from({length:3000},(_,i)=>row(`docs/safe-${i}.md`))]).eligible,false);

});

test("only protected PR workflow can enable auto-merge; no bypass or untrusted checkout",()=>{
 const quality=readFileSync(".github/workflows/quality.yml","utf8");
 const protectedJob=quality.split("  auto-merge:\n")[1];
 assert.ok(protectedJob,"auto-merge must be part of the existing quality workflow");
 assert.match(quality,/pull_request:[\s\S]*types: \[opened, reopened, synchronize, ready_for_review, converted_to_draft\]/);
 assert.match(protectedJob,/head\.repo\.full_name == github\.repository/);
 assert.match(protectedJob,/ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
 assert.doesNotMatch(protectedJob,/ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
 assert.match(protectedJob,/pull-requests: write/);
 assert.match(protectedJob,/! -f scripts\/ci-auto-merge-policy\.mjs/);
 assert.match(protectedJob,/gh api --paginate --slurp/);
 assert.match(protectedJob,/scripts\/ci-auto-merge-policy\.mjs/);
 assert.match(protectedJob,/PR_IS_DRAFT/);
 assert.match(protectedJob,/gh pr merge "\$PR_NUMBER" --disable-auto/);
 assert.match(protectedJob,/gh pr merge "\$PR_NUMBER" --auto --squash --match-head-commit "\$PR_HEAD_SHA"/);
 assert.doesNotMatch(protectedJob,/^\s*gh pr merge[^\n]*--admin|gh pr merge "\$PR_NUMBER" --squash\s*$/m);
 assert.match(quality,/name: Source, docs and offline tests/);
 assert.match(quality,/name: Source checks, schemas and production build/);
});
