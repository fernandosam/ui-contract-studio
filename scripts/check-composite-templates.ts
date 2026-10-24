import {readFileSync,existsSync} from 'node:fs';
import {catalog,componentDefinitions,actionDefinitions,componentEventDescriptors} from '../src/ui-catalog/catalog';
import {graphErrors} from './lib/spec-invariants.mjs';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const manifest=read('src/ui-catalog/extensions/composites/generated-manifest.json').components as Array<{name:string;template:string}>;
const lock=read('src/ui-catalog/contracts.lock.json').components as Array<{name:string;status:string}>;
const base=lock.filter(x=>read('src/ui-catalog/contracts.lock.json').components.find((y:{name:string;tier:string})=>y.name===x.name)?.tier==='base').map(x=>x.name);
const errors:string[]=[];
for(const {name,template} of manifest){
 if(!componentDefinitions[name as keyof typeof componentDefinitions]||!lock.some(x=>x.name===name&&x.status==='approved'))errors.push(`${name}: contrato não aprovado`);
 const path='src/ui-catalog/extensions/composites/templates/'+template;
 if(!existsSync(path)){errors.push(`${name}: template ausente`);continue;}
 const spec=read(path);
 errors.push(...graphErrors(spec,[...base,'DataTable','DatePicker','Field','BlockSidebar'],{allowedActions:Object.keys(actionDefinitions),allowedEvents:componentEventDescriptors}).map((e:string)=>`${name}: ${e}`));
 if(spec.elements?.[spec.root]?.type!=='Card')errors.push(`${name}: raiz não é Card`);
 const valid=catalog.validate(spec);
 if(!valid.success)errors.push(`${name}: JSON não validado pelo catálogo`);
}
if(!manifest.some(x=>x.name==='Dashboard01'))errors.push('Dashboard01 precisa permanecer como contrato composto');
if(errors.length){errors.forEach(e=>console.error('✗ '+e));process.exit(1)}
console.log(`✓ ${manifest.length} templates compostos ativos validados`);
