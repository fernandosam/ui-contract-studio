import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const exporter = resolve(dirname(fileURLToPath(import.meta.url)), '../scripts/create-clean-project.mjs');
const run = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8' });
const write = (root, path, contents) => {
  const dest = join(root, path);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, contents, 'utf8');
};

function withFixture(callback) {
  const parent = mkdtempSync(join(tmpdir(), 'ui-contract-export-test-'));
  const source = join(parent, 'source');
  const dest = join(parent, 'ui-contract-studio');
  mkdirSync(source);
  try {
    write(source, 'package.json', '{"name":"ui-contract-studio","version":"0.24.0","scripts":{"project:export-clean":"node scripts/create-clean-project.mjs"}}');
    write(source, 'README.md', '# UI Contract Studio\n\n**Repositório:** [fernandosam/ui-contract-studio](https://github.com/fernandosam/ui-contract-studio). O endereço ficará disponível após a renomeação do repositório no GitHub.\n\nPara detalhes, consulte docs/README.md.');
    write(source, 'LICENSE', 'MIT License');
    write(source, 'THIRD_PARTY_NOTICES.md', 'shadcn/ui; ReUI');
    write(source, 'src/ui-catalog/catalog.ts', 'export const sample = true;');
    write(source, 'docs/archive/legacy.md', 'Former version history.');
    write(source, 'reports/summary.txt', 'Historical report.');
    write(source, 'scripts/create-clean-project.mjs', readFileSync(exporter));
    run(source, ['init', '-b', 'main']);
    run(source, ['add', '.']);
    run(source, ['-c', 'user.name=Snapshot Test', '-c', 'user.email=test@example.org', 'commit', '-m', 'fixture']);
    callback({ source, dest });
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
}

test('export creates a fresh repository without history, reports or archives', () => {
  withFixture(({ source, dest }) => {
    const cmd = spawnSync(process.execPath, ['scripts/create-clean-project.mjs', dest], { cwd: source, encoding: 'utf8' });
    assert.equal(cmd.status, 0, cmd.stderr || cmd.stdout);
    assert.ok(existsSync(join(dest, '.git')));
    assert.ok(existsSync(join(dest, 'src/ui-catalog/catalog.ts')));
    assert.ok(!existsSync(join(dest, 'docs/archive')));
    assert.ok(!existsSync(join(dest, 'reports')));
    assert.ok(!existsSync(join(dest, 'scripts/create-clean-project.mjs')));
    assert.equal(JSON.parse(readFileSync(join(dest, 'package.json'), 'utf8')).scripts['project:export-clean'], undefined);
    assert.match(readFileSync(join(dest, 'README.md'), 'utf8'), /ui-contract-studio\.git|ui-contract-studio\)/);
    assert.doesNotMatch(readFileSync(join(dest, 'README.md'), 'utf8'), /renomeação do repositório no GitHub/);
    assert.equal(run(dest, ['remote', '-v']).trim(), '');
    assert.notEqual(spawnSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: dest }).status, 0);
  });
});

test('export refuses a source containing an institutional identifier', () => {
  withFixture(({ source, dest }) => {
    const formerSuffix = String.fromCharCode(116, 114, 116, 49, 56);
    write(source, 'src/sensitive.txt', `Legacy marker: ${formerSuffix}`);
    run(source, ['add', '.']);
    run(source, ['-c', 'user.name=Snapshot Test', '-c', 'user.email=test@example.org', 'commit', '-m', 'fixture identifier']);
    const cmd = spawnSync(process.execPath, ['scripts/create-clean-project.mjs', dest], { cwd: source, encoding: 'utf8' });
    assert.equal(cmd.status, 2);
    assert.match(cmd.stderr, /Export rejected/);
    assert.ok(!existsSync(join(dest, '.git')));
  });
});