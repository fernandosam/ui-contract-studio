import {readdirSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const specs=readdirSync('src/ui-screens').filter(n=>n.endsWith('.json'));
const metas=readdirSync('src/ui-screen-meta').filter(n=>n.endsWith('.json'));
assert.ok(specs.length>=5);
const names=new Set(specs);
for(const file of specs){
 assert.match(file,/^[a-z][a-z0-9-]{0,63}\.json$/);
 assert.ok(metas.includes(file),`${file} requer metadados com o mesmo nome`);
 const spec=JSON.parse(readFileSync(`src/ui-screens/${file}`));
 assert.ok(spec.root&&spec.elements?.[spec.root],file);
 const m=JSON.parse(readFileSync(`src/ui-screen-meta/${file}`));
 for(const key of ['title','subtitle','section','icon']) assert.ok(typeof m[key]==='string'&&m[key].trim(),`${file}: ${key}`);
 assert.ok(Number.isInteger(m.order) && m.order>=0,`${file}: order`);
}
for(const m of metas) assert.ok(names.has(m),`Metadados órfãos: ${m}`);
console.log(`✓ ${specs.length} telas e metadados descobertos sem registro manual`);
