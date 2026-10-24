import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,readdirSync } from 'node:fs';
import {signatures} from '../scripts/lib/contract-lock.mjs';
const read=path=>readFileSync(path,'utf8');
test('102 contratos estão versionados e fingerprints coerentes',()=>{
 const lock=JSON.parse(read('src/ui-catalog/contracts.lock.json'));
 assert.equal(lock.components.length,102);
 for(const sig of signatures()) assert.equal(lock.components.find(x=>x.name===sig.name)?.fingerprint,sig.fingerprint,sig.name);
 assert.equal(lock.components.find(x=>x.name==='DataTable')?.version,'1.2.0');
});
test('todas as telas têm metadados; nenhuma depende de um import manual',()=>{
 const app=read('src/ui-runtime/app.tsx');assert.doesNotMatch(app,/import dashboard from/);
 assert.match(read('src/ui-runtime/screen-registry.ts'),/import\.meta\.glob/);
 const screens=readdirSync('src/ui-screens').filter(x=>x.endsWith('.json'));
 for(const screen of screens){ const meta=JSON.parse(read(`src/ui-screen-meta/${screen}`));assert.ok(meta.title); }
 assert.ok(!screens.includes('blocos-dashboard.json'));
 assert.ok(screens.includes('blocos-login.json'));
 assert.ok(!screens.includes('auditoria.json'));
 assert.equal(screens.length,3);
});
test('dados externos não aceitam URLs geradas pela IA',()=>{
 const source=read('src/ui-data/providers.ts');
 assert.match(source,/sourceId!=='processos-api'/);
 assert.match(source,/\/api\/ui-data\/processos/);
 const extension=read('src/ui-catalog/extensions/catalog.ts');
 assert.match(extension,/demo-processos/); assert.match(extension,/processos-api/);
 assert.doesNotMatch(extension,/sourceUrl: z\.string/);
});
test('20 cenários definidos, com expectativas de tipos registrados',()=>{
 const data=JSON.parse(read('tests/prompt-evals/scenarios.json'));
 const ids=data.scenarios.map(x=>x.id);
 assert.equal(ids.length,20);assert.equal(new Set(ids).size,20);
 for(const x of data.scenarios)assert.ok(x.requiredTypes.length>0);
});
test('scripts de avaliação não fingem execução do Pi',()=>{
 const evalCode=read('scripts/evaluate-pi.ts');
 assert.match(evalCode,/status:'not-run'/);assert.match(evalCode,/--strict/);
});
