import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {graphErrors} from '../scripts/lib/spec-invariants.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const code=p=>readFileSync(p,'utf8');
const lock=read('src/ui-catalog/contracts.lock.json');
const obsolete=read('src/ui-catalog/composite-pruning-review.json');
const originals=new Set(obsolete.retiredContracts.map(x=>x.name));
test('3 ferramentas independentes, em rotas visíveis no menu Ferramentas',()=>{
 const app=code('src/ui-runtime/app.tsx'), shell=code('src/ui-runtime/layout.tsx');
 const editor=code('src/ui-runtime/catalog-explorer.tsx');
 for(const x of ['explorador-primitivos','explorador-compostos','explorador-exemplos'])assert.ok(app.includes(x),x);
 for(const x of ['PrimitiveExplorer','CompositeExplorer','ExamplesExplorer']){assert.ok(app.includes(x));assert.ok(editor.includes(`export function ${x}`));}
 assert.match(shell,/label:"Ferramentas"/);
 assert.match(editor,/tier==='base'/);
 assert.match(editor,/concat\(/);
 assert.match(editor,/primitiveList/);
 assert.match(editor,/compositeList/);
 assert.match(editor,/screenOptions/);
 assert.match(editor,/targetId/);
 assert.match(editor,/catalog.validate\(candidate\)/);
});
test('22 contratos redundantes removidos sem tipos desconhecidos em telas/padrões',()=>{
 assert.equal(obsolete.retiredContracts.length,22);
 assert.equal(lock.components.length,102);
 const live=new Set(lock.components.map(x=>x.name));
 for(const name of originals)assert.equal(live.has(name),false,name);
 for(const source of ['src/ui-screens','src/ui-patterns']){
  const fs=requireFiles(source);
  for(const f of fs){const spec=read(`${source}/${f}`);
   assert.deepEqual(graphErrors(spec,[...live],{allowedActions:['setState','pushState','removeState','buttonClick','formSubmit','linkClick']}),[],f);
  }
 }
});
function requireFiles(path){return requireDir(path).filter(f=>f.endsWith('.json')&&!f.endsWith('.meta.json'));}
import {readdirSync as requireDir} from 'node:fs';
test('Pi publica apenas os 102 contratos ativos e rejeita nomes aposentados',()=>{
 const pi=read('pi-catalog/contracts.json');
 assert.equal(pi.catalogSize,102);
 assert.deepEqual(new Set(pi.contracts.map(x=>x.type)),new Set(lock.components.map(c=>c.name)));
 for(const contract of pi.contracts) assert.ok(!originals.has(contract.type));
});
