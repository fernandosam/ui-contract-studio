#!/usr/bin/env node
/** Pi advisory selection. Emits comparisons/reasons, not a generated UI spec. */
import {readFileSync} from 'node:fs';
import {buildSemanticKnowledge} from './lib/semantic-knowledge.mjs';
import {selectPiSemanticCandidates} from './lib/pi-semantic-selection.mjs';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const option=name=>process.argv.find(arg=>arg.startsWith('--'+name+'='))?.slice(name.length+3);
const requirement=option('requirement');
if(!requirement || process.argv.some(arg=>arg.startsWith('--channel=')&&arg!=='--channel=stable')){
 console.error('Uso: npm run pi:select -- --requirement="objetivo da interface" [--types=Button,Link] [--limit=10] (somente canal stable)');
 process.exit(2);
}
const limit=option('limit')===undefined?10:Number(option('limit'));
const manifest=read('pi-catalog/contracts.json');
const locked=new Map(read('src/ui-catalog/contracts.lock.json').components.map(item=>[item.name,item]));
for(const contract of manifest.components){
 const source=locked.get(contract.type);
 if(source){
  if(contract.version!==source.version || contract.fingerprint!==source.semanticFingerprint ||
     contract.stability!==source.stability ||
     (contract.lifecycle==='stable')!==(source.stability==='stable') ||
     (source.stability==='stable'&&source.status!=='approved'))
    throw new Error('Pi projection diverges from reviewed contract: '+contract.type);
 }else if(contract.fingerprint!==contract.sourceDigest ||
   contract.stability!==contract.lifecycle ||
   (contract.lifecycle==='stable'&&!['passed','ci-required'].includes(contract.validation?.e2e))){
  throw new Error('Unverified Pi composition: '+contract.type);
 }
}
const types=option('types')?.split(',').map(x=>x.trim()).filter(Boolean);
if(types && (!types.length || types.length>25 ||
   types.some(name=>!manifest.components.some(item=>item.type===name)))){
 console.error('Os tipos solicitados devem existir no manifesto Pi (até 25).');
 process.exit(2);
}
const semantic=buildSemanticKnowledge({
 approvedNames:new Set(manifest.components.filter(item=>item.tier!=='composition').map(item=>item.type)),
});
if(semantic.errors.length){
 semantic.errors.forEach(error=>console.error('✗ '+error));
 process.exit(1);
}
try {
 const result=selectPiSemanticCandidates({
  requirement,contracts:manifest.components,profiles:semantic.report.profiles,
  allowedTypes:types,limit,
 });
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
}catch(error){
 console.error(error instanceof Error?error.message:String(error));
 process.exit(2);
}
