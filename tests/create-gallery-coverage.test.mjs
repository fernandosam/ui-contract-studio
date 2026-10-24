import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {graphErrors} from '../scripts/lib/spec-invariants.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const inv=read('src/ui-catalog/create-preview-inventory.json');
const lock=read('src/ui-catalog/contracts.lock.json');
const types=lock.components.map(c=>c.name);
test('versão e dependências estáveis',()=>{
 const pkg=read('package.json');assert.match(pkg.version,/^0\.\d+\.\d+$/);
 assert.equal(pkg.dependencies['class-variance-authority'],'0.7.1');
});
test('64 cards do shadcn/create: 31 + 33, com origem referenciada',()=>{
 assert.equal(inv.origin,'shadcn-ui/ui');
 assert.equal(inv.previews.length,2);
 assert.deepEqual(inv.previews.map(x=>x.cards.length),[31,33]);
 const names=inv.previews.flatMap(p=>p.cards.map(x=>x.id));
 assert.equal(new Set(names).size,64);
 for(const preview of inv.previews){
  for(const c of preview.cards){
   assert.match(c.sourcePath,/^apps\/v4\/registry\/bases\/base\/blocks\/preview(?:-02)?\/cards\/.+\.tsx$/);
   assert.ok(c.title&&c.category);
  }
 }
});
for(const group of inv.previews){
 test(`galeria ${group.name} é árvore válida; inline preserva exemplos sem contratos`,()=>{
  const spec=read(`src/ui-screens/${group.screen}.json`);
  assert.deepEqual(graphErrors(spec,types,{allowedActions:['setState','pushState','removeState','buttonClick','formSubmit','linkClick']}),[]);
  const roots=group.cards.map(x=>x.representation==='inline-primitives'?spec.elements[x.inlineRoot]:Object.values(spec.elements).find(y=>y.type===x.id));
  assert.ok(roots.every(Boolean));
  assert.equal(roots.length,group.cards.length);
 });
}
