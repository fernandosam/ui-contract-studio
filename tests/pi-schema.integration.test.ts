import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {catalog,componentDefinitions,unifiedComponentDefinitions,experimentalCatalog} from '../src/ui-catalog/catalog';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const project=read('package.json');
const all=read('pi-catalog/contracts.json');

test('catálogo unificado exporta schemas reais para estáveis e experimentais',()=>{
 const path='pi-catalog/props-json-schema.json';
 assert.ok(existsSync(path),'Execute npm run pi:zod-schema antes do teste integrado');
 const schemas=read(path);
 assert.equal(schemas.schemaVersion,3);
 assert.equal(schemas.projectVersion,project.version);
 assert.equal(all.schemaVersion,3);
 assert.equal(all.components.length,106);
 assert.deepEqual(Object.keys(schemas.types).sort(),Object.keys(unifiedComponentDefinitions).sort());
 assert.deepEqual(all.components.filter((x:{tier:string})=>x.tier!=="experimental").map((x:{type:string})=>x.type).sort(),Object.keys(componentDefinitions).sort());
 for(const contract of all.components){
  const prop=schemas.types[contract.type];
  assert.ok(prop,contract.type);
  assert.ok(typeof prop==='object',contract.type);
  assert.ok(Array.isArray(schemas.events[contract.type]),contract.type);
 }
});
test('exemplos estáveis e experimentais respeitam seus canais de catálogo',()=>{
 for(const entry of all.components){
  const spec=read(entry.example);
  const validation=entry.lifecycle==='experimental'?experimentalCatalog.validate(spec):catalog.validate(spec);
  assert.ok(validation.success,`${entry.type}: ${validation.success?'':validation.error.message}`);
 }
});
test('validador devolve ponteiros úteis para erros em children e props estritas',()=>{
 const valid=read('pi-catalog/examples/SiteCardsPaymentMethod.json');
 assert.ok(catalog.validate(valid).success);
 const malformed=structuredClone(valid);
 delete malformed.elements[malformed.root].children;
 malformed.elements[malformed.root].props.randomJSX='<script>alert(1)</script>';
 assert.ok(!catalog.validate(malformed).success);
 const tool=spawnSync('npm',['run','--silent','pi:validate','--','--file=tests/fixtures/pi-invalid-v018.json','--stdout'],{encoding:'utf8'});
 assert.notEqual(tool.status,0);
 const result=JSON.parse(tool.stdout);
 assert.equal(result.valid,false);
 assert.ok(result.issues.some((f:{pointer:string})=>f.pointer.includes('/children')));
 assert.ok(result.issues.some((f:{code:string;pointer:string})=>f.code==='unrecognized_keys'||f.pointer.includes('randomJSX')));
});
