#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {catalogSegmentsFromContents} from './lib/contract-lock.mjs';
import {classifyContractChanges} from './lib/contract-compatibility.mjs';

const base=process.env.CONTRACT_BASE_REF;
if(!base){console.log('Sem CONTRACT_BASE_REF: comparação histórica reservada ao PR.');process.exit(0);}
if(!/^[0-9a-f]{40}$/.test(base)){console.error('Ref base inválida');process.exit(1);}
const paths=['src/ui-catalog/contracts.lock.json','src/ui-catalog/catalog.ts','src/ui-catalog/extensions/catalog.ts'];
const previous=new Map();
for(const path of paths){
  const result=spawnSync('git',['show',base+':'+path],{encoding:'utf8'});
  if(result.status!==0){console.error('Fonte do commit base indisponível: '+path);process.exit(1);}
  previous.set(path,result.stdout);
}
try{
  const oldLock=JSON.parse(previous.get(paths[0]));
  const newLock=JSON.parse(readFileSync(paths[0],'utf8'));
  const oldSegments=new Map(catalogSegmentsFromContents(previous.get(paths[1]),previous.get(paths[2])).map(x=>[x.name,x.segment]));
  const newSegments=new Map(catalogSegmentsFromContents(readFileSync(paths[1],'utf8'),readFileSync(paths[2],'utf8')).map(x=>[x.name,x.segment]));
  const {errors,changes}=classifyContractChanges(oldLock,newLock,oldSegments,newSegments);
  for(const c of changes)console.log(c.name+': '+c.level.toUpperCase()+' '+(c.previous??'novo')+' -> '+c.version+': '+c.reason);
  if(errors.length){
    for(const error of errors)console.error('✗ '+error);
    process.exitCode=1;
  }else console.log('✓ classificação conservadora de compatibilidade e versões contra a base do PR');
}catch(error){
  console.error('Falha ao analisar contratos: '+error.message);
  process.exitCode=1;
}
