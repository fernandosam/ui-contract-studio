import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {browserRequired,isDocumentationOnly,changedFiles} from '../scripts/ci-change-impact.mjs';

const read=path=>readFileSync(path,'utf8');
const quality=read('.github/workflows/quality.yml');
const manual=read('.github/workflows/e2e-manual.yml');

test('docs-only PRs skip browser, while any application or workflow change runs it',()=>{
 assert.equal(isDocumentationOnly(['README.md','docs/development.md','CHANGELOG.md']),true);
 assert.equal(browserRequired(['docs/development.md','docs/quality.pt-BR.md']),false);
 for(const paths of [
  [],['src/ui-catalog/catalog.ts'],['src/ui-runtime/app.tsx','README.md'],
  ['.github/workflows/quality.yml'],['docs/example.json'],['docs/hidden.tsx'],
  ['src/ui-catalog/contracts.lock.json'],['package-lock.json']
 ])assert.equal(browserRequired(paths),true,paths.join(','));
 assert.throws(()=>changedFiles('not-a-sha'),/SHA de comparação inválido/);
});
test('quality avoids repeating the complete offline suite in npm-based integration',()=>{
 assert.match(quality,/pull_request:\s*\n\s*branches: \[main\]/);
 assert.match(quality,/push:\s*\n\s*branches: \[main\]/);
 assert.match(quality,/permissions:\s*\n\s*contents: read/);
 assert.match(quality,/CONTRACT_BASE_REF:/);
 assert.match(quality,/CHANGE_BASE_SHA:/);
 assert.match(quality,/needs: changes/);
 assert.match(quality,/needs\.changes\.outputs\.browser == 'true'/);
 assert.match(quality,/npm run test:offline/);
 assert.match(quality,/npx tsx --test tests\/\*\.integration\.test\.ts/);
 assert.doesNotMatch(quality,/npm run validate/);
 assert.match(quality,/npm run admission:publish/);
 assert.match(quality,/setup-deps/);
 assert.match(quality,/setup-chromium/);
 assert.match(quality,/admission:evidence:report/);
});
test('single PR quality CI is the only local admission gate; manual E2E is diagnostic',()=>{
 assert.match(quality,/pull_request:/);
 assert.match(quality,/name: Source checks, schemas and production build/);
 assert.match(quality,/tests\/e2e\/declarative-form-certification\.spec\.ts/);
 assert.match(quality,/--project=desktop --project=mobile/);
 assert.match(quality,/admission-evidence\.mjs --report --candidate=form-declarative/);
 assert.match(quality,/admission-engine\.mjs --ci-verify/);
 const required=quality.split('  integration:\n')[1]?.split('  admission-browser:\n')[0]??'';
 assert.match(required,/setup-chromium/);
 assert.match(required,/admission-engine\.mjs --ci-verify/);
 assert.match(manual,/workflow_dispatch:/);
 assert.match(manual,/npm run test:e2e/);
 assert.match(manual,/npm run admission:evidence:report/);
 assert.doesNotMatch(manual,/certify:|certify_confirm:|gh pr create|contents: write|GH_TOKEN|admission:certify|admission:promote/);
 assert.doesNotMatch(quality,/gh pr create|admission:certify|admission:promote/);
 assert.match(manual,/cancel-in-progress: false/);
});
test('manual visual audit and paid Pi evaluation are separated from the E2E promotion',()=>{
 const visual=read('.github/workflows/bootstrap-visual.yml');
 const pi=read('.github/workflows/pi-evaluation.yml');
 assert.match(visual,/workflow_dispatch:/);
 assert.match(visual,/shadcn:official:capture/);
 assert.doesNotMatch(visual,/npm run test:e2e/);
 assert.match(visual,/setup-chromium/);
 assert.match(pi,/if: github\.ref == 'refs\/heads\/main'/);
 assert.match(pi,/contents: read/);
 assert.match(pi,/setup-deps/);
 assert.ok(!existsSync('.github/workflows/button-contract-review.yml'));
});
