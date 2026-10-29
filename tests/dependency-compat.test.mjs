import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));

test('baseline React/Vite/Tailwind is compatible and npm lock matches the supported matrix', () => {
  const output = execFileSync(process.execPath, ['scripts/check-dependency-compat.mjs'], { cwd: root, encoding: 'utf8' });
  assert.match(output, /Baseline de compatibilidade/);
  const { dependencies, devDependencies } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  assert.equal(dependencies.react, dependencies['react-dom']);
  assert.match(dependencies.react, /^19\.\d+\.\d+$/);
  assert.equal(devDependencies['@tailwindcss/vite'], devDependencies.tailwindcss);
  assert.match(devDependencies['@tailwindcss/vite'], /^4\.\d+\.\d+$/);
  assert.match(devDependencies.typescript, /^5\.9\.\d+$/);
  for (const key of ['react', 'react-dom']) {
    assert.equal(lock.packages[''].dependencies[key], dependencies[key]);
  }
  for (const key of ['@tailwindcss/vite', 'tailwindcss', 'typescript']) {
    assert.equal(lock.packages[''].devDependencies[key], devDependencies[key]);
  }
});
