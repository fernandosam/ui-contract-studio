#!/usr/bin/env node
/** Deterministic integration inventory. Never equates presence of files with a working build. */
import {readFileSync,existsSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {items,plan} from './shadcn-plan.mjs';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const pkg=read('package.json');
const contracts=read('src/ui-catalog/contracts.lock.json');
const primitives=items.map(item=>({name:item.name,present:existsSync(resolve(`src/components/ui/${item.name}.tsx`))}));
const lockPresent=existsSync('package-lock.json');
let lockConsistent=false;
if(lockPresent){try{const lock=read('package-lock.json');lockConsistent=lock.name===pkg.name&&lock.version===pkg.version&&lock.lockfileVersion>=3;}catch{lockConsistent=false;}}
const patterns=readdirSync('src/ui-patterns').filter(f=>f.endsWith('.json')&&!f.endsWith('.meta.json')).length;
const screens=readdirSync('src/ui-screens').filter(f=>f.endsWith('.json')).length;
const allPrimitivesPresent=primitives.every(x=>x.present);
const status={schemaVersion:2,version:pkg.version,framework:'React + Vite + json-render',
 baselineContracts:contracts.components.filter(x=>x.tier==='base').length,
 extensionContracts:contracts.components.filter(x=>x.tier==='extension').map(x=>x.name).sort(),
 totalContracts:contracts.components.length,primitiveBase:plan.primitiveBase,componentStyle:plan.projectStyle,
 installationStatus:allPrimitivesPresent&&lockConsistent?'source-files-present-build-unverified':'pending-bootstrap',
 installedPrimitiveCount:primitives.filter(x=>x.present).length,requiredPrimitiveCount:primitives.length,
 missingPrimitives:primitives.filter(x=>!x.present).map(x=>x.name),
 lockfilePresent:lockPresent,lockfileHeaderConsistent:lockConsistent,
 screenCount:screens,approvedPatternCount:patterns,
 checksRequiredForHomologation:['npm ci','npm run shadcn:verify','npm run validate','npm run build','npm run test:e2e','npm run eval:pi:strict (se avaliação real do Pi habilitada)'],
 disclaimer:'Presença de arquivos não comprova compatibilidade, build, acessibilidade ou aprovação de componentes.'};
const text=JSON.stringify(status,null,2)+'\n';
if(process.argv.includes('--write')){writeFileSync('integration-status.json',text);console.log('integration-status.json atualizado com fatos detectados.');}
else if(process.argv.includes('--check')){if(!existsSync('integration-status.json')||readFileSync('integration-status.json','utf8')!==text){console.error('Manifesto divergente; execute npm run integration:update e versioná-lo.');process.exitCode=1;}else console.log(`Manifesto coerente: ${pkg.version}, ${status.totalContracts} contratos, ${screens} telas, ${patterns} padrões.`);}
else console.log(text);
if(process.argv.includes('--strict')&&(!allPrimitivesPresent||!lockConsistent))process.exitCode=1;
