#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
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
  const totals={property:0,state:0,event:0,structure:0,metadata:0};
  for(const change of changes){
    console.log(change.name+': '+change.level.toUpperCase()+' '+(change.previous??'novo')+
      ' -> '+(change.version??'removido')+': '+change.reason);
    for(const item of change.details??[]){
      totals[item.category]=(totals[item.category]??0)+1;
      console.log('  '+item.category+' '+item.kind+' '+item.path);
    }
  }
  const report={schemaVersion:1,baseCommit:base,valid:errors.length===0,totals,changes,errors};
  mkdirSync('reports/contract-diff',{recursive:true});
  writeFileSync('reports/contract-diff/changes.json',JSON.stringify(report,null,2)+'\n');
  console.log('Relatório: reports/contract-diff/changes.json');
  if(errors.length){
    for(const error of errors)console.error('✗ '+error);
    process.exitCode=1;
  }else console.log('✓ classificação conservadora de compatibilidade e versões contra a base do PR');
}catch(error){
  console.error('Falha ao analisar contratos: '+error.message);
  process.exitCode=1;
}
