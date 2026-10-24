import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {signatures,normalizedTokens} from '../scripts/lib/contract-lock.mjs';
import {compileComposition} from '../src/ui-catalog/extensions/composites/compile-composition.mjs';
const text=p=>readFileSync(p,'utf8');
const read=p=>JSON.parse(text(p));
const manifest=read('src/ui-catalog/extensions/composites/generated-manifest.json');
const generated=text('src/ui-catalog/extensions/generated/composite-implementations.tsx');
const oldLock=read('src/ui-catalog/contracts.lock.json');

test('91 templates têm registro gerado único e nenhum wrapper manual restante',()=>{
 assert.equal(manifest.components.length,91);
 assert.equal(new Set(manifest.components.map(x=>x.name)).size,91);
 for(const item of manifest.components){
  assert.match(generated,new RegExp(`\\b${item.name}: createComposite<`));
  assert.ok(existsSync(`src/ui-catalog/extensions/composites/templates/${item.template}`));
  assert.ok(!existsSync(item.formerComponentPath)||item.name==='NotificationSettings',item.name);
 }
 assert.equal(readdirSync('src/ui-catalog/extensions/components').filter(x=>x.endsWith('.tsx')).length,25);
 const result=spawnSync(process.execPath,['scripts/generate-composite-registry.mjs','--check'],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});

test('renderer não importa o registry raiz em runtime e recebe contexto tipado',()=>{
 assert.doesNotMatch(text('src/ui-catalog/extensions/composites/approved-card-composition.tsx'),/import\s*\{\s*registry\s*\}/);
 assert.match(text('src/ui-runtime/spec-screen.tsx'),/CompositeRegistryContext.Provider/);
 assert.match(text('src/ui-catalog/extensions/registry.tsx'),/\.\.\.compositeImplementations/);
});

test('compilador puro mantém invariantes e propriedades anteriores para 91 composições',()=>{
 for(const item of manifest.components){
  const source=read(`src/ui-catalog/extensions/composites/templates/${item.template}`);
  const original=structuredClone(source);
  const first=compileComposition(source,{});
  assert.deepEqual(first,source,item.name);
  const override=compileComposition(source,{title:'Revisado',description:'Versão de teste'});
  assert.equal(override.elements[override.root].props.title,'Revisado');
  assert.deepEqual(source,original,`${item.name}: fonte imutável`);
  const field=Object.entries(source.elements).flatMap(([id,node])=>Object.entries(node.props).filter(([k,v])=>typeof v==='string'&&['label','text','placeholder'].includes(k)).map(([k,v])=>({id,k,v})))[0];
  if(field){
   const altered=compileComposition(source,{content:{[`${field.id}.${field.k}`]:'Alterado'}});
   assert.equal(altered.elements[field.id].props[field.k],'Alterado');
  }
 }
});

test('fingerprints semânticos são insensíveis à formatação, não ao conteúdo',()=>{
 assert.deepEqual(normalizedTokens('A: {props: z.string(), /* comment */ value: 2}'), normalizedTokens('A:{props:z.string(),value:2}'));
 assert.notDeepEqual(normalizedTokens('A:{label:"Texto A"}'),normalizedTokens('A:{label:"Texto B"}'));
 assert.notDeepEqual(normalizedTokens('A:{min:1}'),normalizedTokens('A:{min:2}'));
 assert.equal(oldLock.components.length,156);
 for(const item of signatures()){
  const old=oldLock.components.find(x=>x.name===item.name);
  assert.equal(old.semanticFingerprint,item.semanticFingerprint,item.name);
  assert.equal(old.fingerprint,item.fingerprint,item.name);
 }
});

test('Exemplos do Pi e do Explorador usam a mesma fonte versionada',()=>{
 const source=text('src/ui-runtime/catalog-explorer.tsx');
 assert.match(source,/pi-catalog\/examples\/\*\.json/);
 assert.doesNotMatch(source,/import\.meta\.glob\('\.\.\/ui-catalog\/extensions\/composites\/templates/);
 assert.equal(readdirSync('pi-catalog/examples').filter(x=>x.endsWith('.json')).length,156);
});
