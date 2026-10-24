import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const original=JSON.parse(readFileSync('src/ui-catalog/reui-example-guidance.json','utf8'));
const localized=JSON.parse(readFileSync('src/ui-catalog/reui-example-guidance.pt-BR.json','utf8'));
const catalog=JSON.parse(readFileSync('src/ui-catalog/reui-guidance.json','utf8'));
const allIds=Object.values(catalog).flatMap(guide=>guide.examples.map(([,id])=>id));

test('Galeria 3: traduções pt-BR para todos os 559 exemplos, com correspondência por ID e fonte',()=>{
 assert.equal(allIds.length,559);
 assert.deepEqual(Object.keys(localized).sort(),allIds.slice().sort(),'todos os exemplos precisam de tradução sem lacunas');
 for(const id of allIds){
  const src=original[id],translated=localized[id];
  assert.ok(src&&translated,id);
  assert.equal(translated.language,'pt-BR',id);
  assert.equal(translated.sourceUrl,src.sourceUrl,id);
  assert.equal(typeof translated.bestFor,'string',id);
  assert.ok(translated.bestFor.trim().length>=6,id+' melhor para vazio');
  assert.notEqual(translated.bestFor.trim(),src.bestFor.trim(),id+' melhor para não traduzido');
  assert.equal(translated.whenNotUse.length,src.whenNotUse.length,id+' quantidade de contraindicações alterada');
  for(const [index,line] of translated.whenNotUse.entries()){
   const sourceLine=src.whenNotUse[index].replace(/\s*\(get_(?:example|component)\("[^"]+"\)\)/g,'').trim();
   assert.ok(typeof line==='string'&&line.trim().length>=6,id+' quando não usar vazio');
   assert.notEqual(line.trim(),sourceLine,id+' quando não usar não traduzido ('+index+')');
   assert.doesNotMatch(line,/get_(?:example|component)\(/,id+' comando técnico exibido');
  }
 }
});
test('Galeria 3: interface consome catálogo localizado e marca idioma correto',()=>{
 const code=readFileSync('src/ui-runtime/catalog-explorer.tsx','utf8');
 assert.match(code,/reui-example-guidance\.pt-BR\.json/);
 assert.match(code,/language:'pt-BR'/);
 assert.match(code,/lang=\{exampleGuides\[id\]\.language\}/);
 assert.match(code,/Melhor para/);
 assert.match(code,/Quando não usar/);
});