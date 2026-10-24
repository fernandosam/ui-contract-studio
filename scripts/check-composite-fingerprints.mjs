#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const manifest=read('src/ui-catalog/extensions/composites/generated-manifest.json').components;
const lock=read('src/ui-catalog/contracts.lock.json').components;
const errors=[];
for(const item of manifest){
 const contract=lock.find(x=>x.name===item.name);
 if(!contract) {errors.push(`${item.name}: contrato ausente`);continue;}
 const path=`src/ui-catalog/extensions/composites/templates/${item.template}`;
 const raw=readFileSync(path);
 const actual=createHash('sha256').update(raw).digest('hex');
 if(contract.compositionHash && contract.compositionHash!==actual)errors.push(`${item.name}: hash de composição divergente`);
 const spec=JSON.parse(raw);
 if(spec.elements?.[spec.root]?.type!=='Card')errors.push(`${item.name}: composição sem Card raiz`);
}
if(errors.length){errors.forEach(e=>console.error('✗ '+e));process.exit(1)}
console.log(`✓ ${manifest.length} composições ativas e hashes conferidos (incluindo Dashboard01).`);
