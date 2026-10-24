import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {catalog,componentDefinitions} from '../src/ui-catalog/catalog';
import {compileComposition} from '../src/ui-catalog/extensions/composites/compile-composition.mjs';
const read=(name:string)=>JSON.parse(readFileSync(name,'utf8'));
const manifest=read('src/ui-catalog/extensions/composites/generated-manifest.json').components as Array<{name:string;template:string}>;
for(const item of manifest){
 test(`real Zod: ${item.name} nodeProps whitelist, required graph validation`,()=>{
  const schema=componentDefinitions[item.name as keyof typeof componentDefinitions].props;
  const fixture=read(`pi-catalog/examples/${item.name}.json`);
  const value=fixture.elements[fixture.root].props;
  const ok=schema.safeParse(value);assert.equal(ok.success,true,`${item.name}: ${!ok.success?ok.error.message:''}`);
  const denied=schema.safeParse({...value,nodeProps:{badNode:{on:{press:{action:'malicious'}}}}});
  assert.equal(denied.success,false,`${item.name}: unknown node/action should be rejected`);
  const original=read(`src/ui-catalog/extensions/composites/templates/${item.template}`);
  const compiled=compileComposition(original,value);
  const valid=catalog.validate(compiled);
  assert.equal(valid.success,true,`${item.name}: ${!valid.success?String(valid.error):''}`);
 });
}
