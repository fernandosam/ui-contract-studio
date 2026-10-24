#!/usr/bin/env node
import {readFileSync,readdirSync} from 'node:fs';
import {graphErrors} from './lib/spec-invariants.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const lock=read('src/ui-catalog/contracts.lock.json');
const retired=read('src/ui-catalog/composite-pruning-review.json').retiredContracts;
const inventory=read('src/ui-catalog/create-preview-inventory.json');
const pi=read('pi-catalog/contracts.json');
const active=new Set(lock.components.map(x=>x.name)),retiredNames=new Set(retired.map(x=>x.name));
const manifest=read('src/ui-catalog/extensions/composites/generated-manifest.json').components;
const errors=[];
if(active.size!==156||retiredNames.size!==22||pi.contracts.length!==156||manifest.length!==91)errors.push('Inconsistência de total (156 contratos, 22 aposentados, 91 compostos estáticos)');
for(const {name} of retired){
 if(active.has(name)||manifest.some(x=>x.name===name)||pi.contracts.some(x=>x.type===name))errors.push(`${name}: reapareceu no catálogo`);
 if(readdirSync('pi-catalog/examples').includes(name+'.json'))errors.push(`${name}: fixture Pi órfã`);
}
let inlined=0;
for(const preview of inventory.previews){
 const spec=read(`src/ui-screens/${preview.screen}.json`);
 errors.push(...graphErrors(spec,[...active],{allowedActions:['setState','pushState','removeState','buttonClick','formSubmit','linkClick']}).map(x=>`${preview.screen}: ${x}`));
 for(const item of preview.cards){
  if(item.representation==='inline-primitives'){
   inlined++;
   if(!retiredNames.has(item.id)||spec.elements[item.inlineRoot]?.type!=='Card')errors.push(`${item.id}: não foi substituído por primitivas inline`);
  }else if(!active.has(item.id))errors.push(`${item.id}: componente não registrado`);
 }
}
if(inlined!==10)errors.push(`Esperados 10 exemplos inline, encontrados ${inlined}`);
if(errors.length){errors.forEach(x=>console.error('✗ '+x));process.exit(1)}
console.log(`✓ ${active.size} contratos ativos, ${retiredNames.size} retirados, ${inlined} demos inline e 91 composições geradas.`);
