import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const exists = (path) => existsSync(new URL(`../${path}`, import.meta.url));
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('standalone repository no longer ships the one-time export tool', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(exists('scripts/create-clean-project.mjs'), false);
  assert.equal(Object.hasOwn(pkg.scripts, 'project:export-clean'), false);
});

test('standalone snapshot retains the application and uses its own clone URL', () => {
  assert.ok(exists('src/ui-catalog/catalog.ts'));
  assert.ok(exists('src/ui-runtime/layout.tsx'));
  assert.ok(exists('LICENSE'));
  assert.ok(exists('THIRD_PARTY_NOTICES.md'));
  assert.match(read('README.md'), /git clone https:\/\/github\.com\/fernandosam\/ui-contract-studio\.git/);
  assert.doesNotMatch(read('README.md'), /renomeação do repositório no GitHub/);
});
