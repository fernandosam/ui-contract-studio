import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {catalog,componentDefinitions} from '../src/ui-catalog/catalog';
import {registry} from '../src/ui-catalog/registry';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const manifest=read('pi-catalog/contracts.json');
for(const entry of manifest.components.filter((item:{tier:string})=>item.tier!=='experimental')){
 test(`${entry.type}: schema Zod real aceita exemplo e registry contém renderer`,()=>{
  const spec=read(entry.example);
  const result=catalog.validate(spec);
  assert.equal(result.success,true,result.success?'':result.error.message);
  assert.ok(entry.type in componentDefinitions);
  assert.ok(entry.type in registry);
 });
 if(entry.contentProperty==='content')test(`${entry.type}: unknown content key é recusada`,()=>{
  const valid=read(entry.example);valid.elements[valid.root].props.content={'__not_approved__.className':'bg-red-500'};
  assert.equal(catalog.validate(valid).success,false);
 });
}
for(const [type,props] of [
 ['SiteCardsActivityGoal',{goal:500,minimum:0,maximum:900,step:25}],
 ['SiteCardsChat',{recipient:'Sofia',initialMessages:[{role:'mine',text:'Olá'}]}],
 ['SiteCardsCookieSettings',{necessaryLabel:'Obrigatórios',defaultAnalytics:true}]
] as const){
 test(`${type}: aceita API local interativa`,()=>{
  const spec=read(`pi-catalog/examples/${type}.json`);
  Object.assign(spec.elements[spec.root].props,props);
  assert.equal(catalog.validate(spec).success,true);
 });
}
