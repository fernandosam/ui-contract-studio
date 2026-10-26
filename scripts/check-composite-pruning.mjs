#!/usr/bin/env node
import {readFileSync,readdirSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const lock=read('src/ui-catalog/contracts.lock.json');
const retired=read('src/ui-catalog/composite-pruning-review.json').retiredContracts;
const pi=read('pi-catalog/contracts.json');
const manifest=read('src/ui-catalog/extensions/composites/generated-manifest.json').components;
const active=new Set(lock.components.map(x=>x.name));
const names=new Set(manifest.map(x=>x.name));
const errors=[];
if(active.size!==102||retired.length!==22||pi.components.filter(x=>x.tier!=='experimental').length!==102||manifest.length!==37)errors.push('Inconsistência dos totais ativos (102 contratos, 22 históricos aposentados, 37 composições estáticas)');
for(const {name} of retired){
 if(active.has(name)||names.has(name)||pi.components.some(x=>x.type===name))errors.push(`${name}: contrato aposentado reapareceu`);
 if(readdirSync('pi-catalog/examples').includes(name+'.json'))errors.push(`${name}: amostra Pi órfã`);
}
for(const {name} of manifest)if(!active.has(name))errors.push(`${name}: composição sem contrato ativo`);
for(const name of ['Dashboard01','Login01','Sidebar01','Signup01'])if(!names.has(name))errors.push(`${name}: bloco composto foi perdido`);
for(const filename of ['exemplo-01.json','exemplo-02.json','blocos-dashboard.json']){
 if(readdirSync('src/ui-screens').includes(filename))errors.push(`${filename}: tela retirada ainda publicada`);
}
if(errors.length){errors.forEach(x=>console.error('✗ '+x));process.exit(1)}
console.log(`✓ ${active.size} contratos ativos, ${manifest.length} composições, sem galerias legadas ou bloco Dashboard publicado.`);
