#!/usr/bin/env node
import {existsSync,readFileSync} from 'node:fs';
import {graphErrors} from './lib/spec-invariants.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const lock=read('src/ui-catalog/contracts.lock.json');const manifest=read('pi-catalog/contracts.json');
const details=read('src/ui-catalog/composite-content-fields.json').components;
const names=new Set(lock.components.map(c=>c.name)),issues=[];
if(manifest.schemaVersion!==3 || manifest.components.length!==names.size+read('src/ui-catalog/admission-engine/entries.json').entries.length)issues.push('Invalid unified Pi v3 manifest');
for(const item of lock.components){
 const file=`pi-catalog/examples/${item.name}.json`;
 if(!existsSync(file)){issues.push(`${item.name}: example missing`);continue;}
 const spec=read(file);issues.push(...graphErrors(spec,[...names],{allowedActions:manifest.actions}).map(e=>`${item.name}: ${e}`));
 if(spec.elements[spec.root]?.type!==item.name)issues.push(`${item.name}: root mismatch`);
 if(details[item.name]){
  const code=readFileSync('src/ui-catalog/extensions/catalog.ts','utf8');
  const pos=code.indexOf('  '+item.name+': {');
  if(pos<0 || !code.slice(pos,code.indexOf('\n  },',pos)).includes('content: strict({'))issues.push(`${item.name}: content schema missing`);
  const comp=read(details[item.name].template?`src/ui-catalog/extensions/composites/templates/${details[item.name].template}.json`:file);
  for(const field of details[item.name].fields){const [key,prop]=field.path.split('.');if(typeof comp.elements[key]?.props?.[prop]!=='string')issues.push(`${item.name}: content key ${field.path} invalid`);}
 }
}
if(names.size!==lock.components.length||manifest.components.filter(x=>x.tier!=='experimental').length!==lock.components.length)issues.push('Catalog size differs from approved lock');
const expected=read('src/ui-catalog/extensions/composites/generated-manifest.json').components.length+5;
if(Object.keys(details).length!==expected)issues.push('Configurable compositions mismatch manifest');
if(issues.length){issues.slice(0,70).forEach(e=>console.error('✗ '+e));process.exit(1)}
console.log(`✓ ${lock.components.length} examples, ${Object.keys(details).length} strict composite schemas verified structurally`);
if(!existsSync('package-lock.json')||!existsSync('src/components/ui/button.tsx')){
 console.log('⚠ Build/E2E não homologados: npm lockfile e/ou primitivas oficiais shadcn ausentes neste pacote.');
}
