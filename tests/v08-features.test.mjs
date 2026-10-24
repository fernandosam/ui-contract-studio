import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {graphErrors} from '../scripts/lib/spec-invariants.mjs';
const text=path=>readFileSync(path,'utf8');
const read=path=>JSON.parse(text(path));
const names=read('src/ui-catalog/contracts.lock.json').components.map(c=>c.name);
test('v0.12 preserva os 44 anteriores e adiciona 54 componentes compostos ativos e 10 demonstrações inline',()=>{
 const lock=read('src/ui-catalog/contracts.lock.json');assert.equal(lock.components.length,156);
 assert.equal(lock.components.filter(c=>c.tier==='base').length,41);
 assert.equal(lock.components.filter(c=>c.tier==='extension').length,115);
 assert.ok(['DataTable','DatePicker','Field'].every(name=>lock.components.some(c=>c.name===name)));
});
test('8 padrões só utilizam contratos aprovados e árvores válidas',()=>{
 const dir='src/ui-patterns';const list=readdirSync(dir).filter(n=>n.endsWith('.json')&&!n.endsWith('.meta.json'));
 assert.equal(list.length,8);
 for(const file of list){
  const spec=read(`${dir}/${file}`);const meta=read(`${dir}/${file.slice(0,-5)}.meta.json`);
  assert.equal(meta.approved,true);assert.deepEqual(graphErrors(spec,names),[],file);
 }
});
test('catálogo visual usa registry autorizado e não uma biblioteca externa arbitrária',()=>{
 const s=text('src/ui-runtime/catalog-explorer.tsx');
 assert.match(s,/componentDefinitions/);assert.match(s,/SpecScreen/);assert.match(s,/patternFiles/);
 assert.match(text('src/ui-runtime/app.tsx'),/PrimitiveExplorer|CompositeExplorer|ExamplesExplorer/);
});
test('DataTable utiliza debounce para consultas remotas',()=>{
 const s=text('src/ui-catalog/extensions/components/data-table.tsx');
 assert.match(s,/debouncedQuery/);assert.match(s,/setTimeout\(\(\)=>setDebouncedQuery\(query\),300\)/);
});
test('backend de processos exige autenticação e acesso por tenant',()=>{
 const src=text('server-example/processos-route.mjs');
 assert.match(src,/tenantId/);assert.match(src,/authenticate\(request\)/);assert.match(src,/processos:read/);
 assert.match(text('src/ui-data/providers.ts'),/credentials:'same-origin'/);
});
test('avaliação Pi tem modo estrito, executor real e relatórios de métricas',()=>{
 assert.ok(existsSync('scripts/run-pi-evals.mjs'));
 const runner=text('scripts/run-pi-evals.mjs');
 assert.match(runner,/spawnSync\('pi'/);assert.match(runner,/PI_EVAL_CONFIRM/);
 assert.match(text('.github/workflows/pi-evaluation.yml'),/eval:pi:strict/);
 const evals=text('scripts/evaluate-pi.ts');assert.match(evals,/pi-evaluation\.md/);assert.match(evals,/status:'not-run'/);
});
test('manifesto é derivado da versão e não declara instalação concluída indevidamente',()=>{
 const status=read('integration-status.json');const pkg=read('package.json');
 assert.equal(status.version,pkg.version);assert.equal(status.totalContracts,156);
 assert.equal(status.approvedPatternCount,8);assert.equal(status.lockfilePresent,existsSync('package-lock.json'));
 if(!status.lockfilePresent)assert.notEqual(status.installationStatus,'source-files-present-build-unverified');
});
