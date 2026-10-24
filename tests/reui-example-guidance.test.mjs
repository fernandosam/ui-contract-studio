import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const catalog=JSON.parse(readFileSync('src/ui-catalog/reui-guidance.json','utf8'));
const metadata=JSON.parse(readFileSync('src/ui-catalog/reui-example-guidance.json','utf8'));
const slug=name=>name.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase();

test('ReUI: critérios oficiais de uso para cada um dos 559 exemplos',()=>{
 const all=Object.entries(catalog).flatMap(([kind,guide])=>guide.examples.map(([,id])=>({kind,id})));
 assert.equal(all.length,559);
 assert.deepEqual(Object.keys(metadata).sort(),all.map(({id})=>id).sort(),'cobertura 1:1 para todos os exemplos, sem entradas órfãs');
 for(const {kind,id} of all){
  const item=metadata[id];
  assert.ok(item && typeof item==='object',id);
  assert.equal(item.sourceUrl,`https://reui.io/components/${slug(kind)}/${id}`,id);
  assert.equal(item.language,'en',id);
  assert.equal(typeof item.bestFor,'string',id);
  assert.ok(item.bestFor.trim().length>=12,`${id}: melhor para ausente`);
  assert.ok(Array.isArray(item.whenNotUse)&&item.whenNotUse.length>0,`${id}: quando não usar ausente`);
  for(const reason of item.whenNotUse)assert.ok(typeof reason==='string'&&reason.trim().length>=12,`${id}: critério inválido`);
 }
});

test('ReUI: orientações por exemplo, acessibilidade e legibilidade',()=>{
 const source=readFileSync('src/ui-runtime/catalog-explorer.tsx','utf8');
 assert.match(source,/exampleGuides\[id\]/,'metadados são indexados pelo ID do exemplo');
 assert.match(source,/Melhor para/);
 assert.match(source,/Quando não usar/);
 assert.match(source,/<details\b/,'detalhes recolhíveis para evitar sobrecarga visual');
 assert.match(source,/data-testid=\{`reui-guidance-\$\{id\}`\}/);
 assert.match(source,/Critérios originais no ReUI/,'proveniência pública');
});
