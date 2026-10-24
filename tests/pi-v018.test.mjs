import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync,mkdtempSync,rmSync,cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const lock=read('src/ui-catalog/contracts.lock.json');
const registry=readFileSync('src/ui-catalog/extensions/registry.tsx','utf8');
const catalog=readFileSync('src/ui-catalog/extensions/catalog.ts','utf8');
const packScript=resolve('scripts/select-pi-context.mjs');
for(const [type,events] of Object.entries({SiteCardsPaymentMethod:['planChange','select'],SiteCardsTeamMembers:['roleChange']})){
 test(`${type}: contrato com props semânticas, events e adapter stateful`,()=>{
  const start=catalog.indexOf(`  ${type}: {`);
  const segment=catalog.slice(start,catalog.indexOf('\n  },',start));
  assert.match(segment,/content: strict/);
  for(const event of events)assert.ok(segment.includes(`"${event}"`),event);
  const info=lock.components.find(x=>x.name===type);
  assert.equal(info.version,'1.2.0');
  assert.ok(registry.includes(`${type}: ({props,emit}`));
  const file=readFileSync(`src/ui-catalog/extensions/components/${type.replace(/([a-z0-9])([A-Z])/g,'$1-$2').replace(/^site-/,'site-').toLowerCase()}.tsx`,'utf8');
  assert.match(file,/useState/);
  assert.match(file,/onEvent\?\./);
 });
}
test('Pi context carrega schemas por seleção, com actions e sem extravasar tipos',()=>{
 const cwd=mkdtempSync(join(tmpdir(),'pi-context-'));
 try{
  mkdirSync(join(cwd,'pi-catalog/examples'),{recursive:true});
  const manifest=read('pi-catalog/contracts.json');
  cpSync('pi-catalog/contracts.json',join(cwd,'pi-catalog/contracts.json'));
  const desired=['Card','SiteCardsPaymentMethod'];
  for(const name of desired)cpSync(`pi-catalog/examples/${name}.json`,join(cwd,`pi-catalog/examples/${name}.json`));
  const schemas={schemaVersion:2,projectVersion:manifest.projectVersion,catalogSize:156,types:{},actions:{buttonClick:{type:'object',additionalProperties:false}},events:{}};
  for(const type of desired){schemas.types[type]={type:'object',additionalProperties:false,properties:{title:{type:'string'}}};schemas.events[type]=type==='Card'?[]:['planChange','select']}
  writeFileSync(join(cwd,'pi-catalog/props-json-schema.json'),JSON.stringify(schemas));
  const result=spawnSync(process.execPath,[packScript,'--types=Card,SiteCardsPaymentMethod','--stdout'],{cwd,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const pack=JSON.parse(result.stdout);
  assert.equal(pack.metadataOnly,false);
  assert.deepEqual(pack.selected.map(c=>c.contract.type),desired);
  assert.deepEqual(pack.selected[1].events,['planChange','select']);
  assert.equal(pack.selected[1].propsSchema.additionalProperties,false);
  assert.equal(pack.actionSchemas.buttonClick.type,'object');
  schemas.projectVersion='0.0.0';writeFileSync(join(cwd,'pi-catalog/props-json-schema.json'),JSON.stringify(schemas));
  const stale=spawnSync(process.execPath,[packScript,'--types=Card','--stdout'],{cwd,encoding:'utf8'});
  assert.notEqual(stale.status,0);assert.match(stale.stderr,/incompatível/);
 }finally{rmSync(cwd,{force:true,recursive:true})}
});
