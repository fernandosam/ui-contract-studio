import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
test('baseline React/Vite/Tailwind valida', () => {
  const output = execFileSync(process.execPath, ['scripts/check-dependency-compat.mjs'], { cwd: root, encoding: 'utf8' });
  assert.match(output, /Baseline de compatibilidade/);
  const { dependencies, devDependencies } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(dependencies.react, '19.2.3');
  assert.equal(dependencies['react-dom'], '19.2.3');
  assert.equal(devDependencies['@tailwindcss/vite'], '4.1.16');
  assert.equal(devDependencies.tailwindcss, '4.1.16');
  assert.equal(devDependencies.typescript, '5.9.3');
});
