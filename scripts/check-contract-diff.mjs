import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const base=process.env.CONTRACT_BASE_REF;
if(!base){console.log('Sem CONTRACT_BASE_REF: comparação histórica reservada ao PR.');process.exit(0);}
if(!/^[0-9a-f]{40}$/.test(base)){console.error('Ref base inválida');process.exit(1);}
const previous=spawnSync('git',['show',`${base}:src/ui-catalog/contracts.lock.json`],{encoding:'utf8'});
if(previous.status!==0){console.error('Lock do commit base indisponível');process.exit(1);}
const old=Object.fromEntries(JSON.parse(previous.stdout).components.map(x=>[x.name,x]));
const next=JSON.parse(readFileSync('src/ui-catalog/contracts.lock.json','utf8'));
const semver=v=>v.split('.').map(Number);
const newer=(a,b)=>{const x=semver(a),y=semver(b);return x.some((n,i)=>n>y[i]&&x.slice(0,i).every((v,j)=>v===y[j]));};
const review=JSON.parse(readFileSync('src/ui-catalog/retired-gallery-contracts.json','utf8'));
const allowedRetired=new Set(review.names);
const errors=[];
if(review.schemaVersion!==1||review.version!=='0.24.0'||allowedRetired.size!==54)errors.push('Manifesto de retirada das galerias não revisado');
for(const entry of next.components){
 const prior=old[entry.name];
 if(!prior){if(entry.tier!=='extension')errors.push(`${entry.name}: contratos base não podem ser adicionados.`);continue;}
 if((prior.semanticFingerprint && entry.semanticFingerprint ? entry.semanticFingerprint!==prior.semanticFingerprint : entry.fingerprint!==prior.fingerprint)&&!newer(entry.version,prior.version))errors.push(`${entry.name}: contrato alterado sem incremento de versão.`);
 if(entry.tier!==prior.tier)errors.push(`${entry.name}: migração de camada proibida.`);
 delete old[entry.name];
}
for(const name of Object.keys(old))if(!allowedRetired.has(name))errors.push(`${name}: contrato removido sem procedimento de migração.`);
for(const name of allowedRetired)if(next.components.some(c=>c.name===name))errors.push(`${name}: contrato retirado voltou ao catálogo sem revisão.`);
if(errors.length){errors.forEach(e=>console.error('✗ '+e));process.exit(1);}
console.log('✓ diferenças de contrato com versão semântica revisável');
