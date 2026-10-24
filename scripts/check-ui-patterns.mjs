/** Offline JSON tree validator, shared across screens and reuse patterns. */
import {readdirSync,readFileSync} from 'node:fs';
import {graphErrors} from './lib/spec-invariants.mjs';
const directory='src/ui-patterns';
const allowed=JSON.parse(readFileSync('src/ui-catalog/contracts.lock.json','utf8')).components.map(c=>c.name);
let count=0,errors=0;
for(const file of readdirSync(directory).filter(f=>f.endsWith('.json')&&!f.endsWith('.meta.json'))){
 const name=file.slice(0,-5);const spec=JSON.parse(readFileSync(`${directory}/${file}`,'utf8'));
 const meta=JSON.parse(readFileSync(`${directory}/${name}.meta.json`,'utf8'));
 if(meta.id!==name||meta.approved!==true){console.error(name+': metadados inválidos');errors++;}
 const issues=graphErrors(spec,allowed);
 if(issues.length){console.error(name,issues);errors+=issues.length;}count++;
}
if(count!==8){console.error('Esperados 8 padrões, obtidos '+count);errors++;}
if(errors)process.exitCode=1;else console.log(`✓ ${count} padrões JSON de composição validados offline.`);
