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
test('full E2E is exclusively manual on main, and certification has isolated write privilege',()=>{
 assert.match(manual,/workflow_dispatch:/);
 assert.doesNotMatch(manual,/pull_request:|\n {2}push:/);
 const first=manual.split('  certify:\n')[0],second=manual.split('  certify:\n')[1];
 assert.match(first,/permissions:\s*\n\s*contents: read/);
 assert.match(first,/npm run pi:zod-schema/);
 assert.ok(first.indexOf('npm run pi:zod-schema')<first.indexOf('npm run validate'),
  'Must export current Pi schemas before validating the manual E2E source');
 assert.ok(first.indexOf('npm run validate')<first.indexOf('npm run test:e2e'),
  'Must validate before executing the complete E2E suite');
 assert.match(first,/npm run admission:evidence:reset/);
 assert.match(first,/npm run requirements:browser:prepare/);
 assert.match(first,/npm run requirements:browser:report/);
 assert.ok(first.indexOf('npm run requirements:browser:prepare')<first.indexOf('npm run test:e2e'),
  'Fail closed: prepare source-bound fingerprints before complete browser E2E');
 assert.ok(first.indexOf('npm run test:e2e')<first.indexOf('npm run requirements:browser:report'),
  'Fail closed: only attest real browser evidence after complete test execution');
 assert.match(first,/reports\/requirements-browser\//);
 assert.match(first,/npm run test:e2e/);
 assert.match(first,/npm run admission:evidence:report/);
 assert.doesNotMatch(first,/contents: write|GH_TOKEN/);
 assert.match(second,/needs: e2e/);
 assert.match(second,/contents: write/);
 assert.match(second,/actions\/download-artifact@v4/);
 assert.match(second,/npm run admission:certify/);
 assert.match(second,/git fetch --quiet origin main/);
 assert.doesNotMatch(second,/git push origin HEAD:main|push origin HEAD:main|HEAD:refs\/heads\/main/);
 assert.match(second,/gh pr create --draft --base main/);
 assert.match(second,/gh workflow run quality\.yml --ref/);
 assert.match(second,/push origin "HEAD:refs\/heads\/\$branch"/);
 assert.match(second,/npm run admission:certify -- --candidate=/);
 assert.match(manual,/certify_confirm:/);
 assert.match(manual,/form-declarative/);
 assert.match(quality,/workflow_dispatch:/);
 assert.match(second,/http\.https:\/\/github\.com\/\.extraheader/);
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
