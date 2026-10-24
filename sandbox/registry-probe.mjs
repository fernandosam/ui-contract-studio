#!/usr/bin/env node
/** HTTPS-only npm registry discovery. No global npm config and no TLS bypass.
 * `--select` prints only the selected URL (shell capture) and writes an audit JSON.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const report = resolve(ROOT, process.env.UI_CONTRACT_STUDIO_NPM_PROBE_REPORT || 'reports/sandbox/npm-registry-probe.json');
const defaults = [
  'https://registry.npmjs.org',
  'https://registry.npmmirror.com',
  'https://registry.yarnpkg.com',
];
const requested = [process.env.UI_CONTRACT_STUDIO_NPM_REGISTRY, ...(process.env.UI_CONTRACT_STUDIO_NPM_REGISTRIES || '').split(','), ...defaults]
  .map(v => (v || '').trim()).filter(Boolean);
const registries = [...new Set(requested)].filter((value) => {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash; }
  catch { return false; }
});
const timeoutMs = Math.max(2000, Math.min(30000, Number(process.env.UI_CONTRACT_STUDIO_NPM_PROBE_TIMEOUT_MS) || 5000));
async function secureFetch(url, signal, redirects = 0) {
  const result = await fetch(url, { headers: { accept: 'application/json' }, redirect: 'manual', signal });
  if ([301,302,303,307,308].includes(result.status) && redirects < 3) {
    const location = result.headers.get('location');
    if (!location) throw new Error('Registry redirect without Location');
    const next = new URL(location, url);
    if (next.protocol !== 'https:') throw new Error('Registry redirects to non-HTTPS URL');
    return secureFetch(next.href, signal, redirects + 1);
  }
  return result;
}
const select = process.argv.includes('--select');
const results = [];
let chosen = null;
for (const url of registries) {
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try { response = await secureFetch(`${url.replace(/\/$/, '')}/react/latest`, controller.signal); } finally { clearTimeout(timeout); }
    const payload = response.ok ? await response.json() : null;
    const ok = response.ok && payload?.name === 'react' && /^\d+\.\d+\.\d+/.test(payload.version || '');
    results.push({ url, ok, status: response.status, elapsedMs: Date.now() - started,
      message: ok ? `react ${payload.version}` : 'Metadata /react/latest indisponível ou inválida' });
    if (ok) { chosen = url; break; }
  } catch (error) {
    const cause = error?.cause?.code || error?.code || error?.name || 'FETCH_FAILED';
    results.push({ url, ok: false, elapsedMs: Date.now() - started, code: cause, message: String(error.message || error) });
  }
}
mkdirSync(dirname(report), { recursive: true });
writeFileSync(report, JSON.stringify({ schemaVersion: 1, checkedAt: new Date().toISOString(),
  selected: chosen, results, tlsVerification: 'required', registryConfigChanged: false }, null, 2) + '\n');
if (select) {
  for (const item of results) console.error(`${item.ok ? 'OK' : 'FALHA'} ${item.url}: ${item.message}`);
  if (chosen) process.stdout.write(chosen + '\n');
} else console.log(JSON.stringify({ selected: chosen, results, report }, null, 2));
if (!chosen) process.exitCode = 25;
