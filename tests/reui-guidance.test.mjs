import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const catalog=JSON.parse(readFileSync('src/ui-catalog/reui-guidance.json','utf8'));
test('ReUI guidance: verified source attribution and usable agent sections',()=>{
 for(const [name,guide] of Object.entries(catalog)){
  assert.match(name,/^[A-Z][a-zA-Z]+$/);
  for(const key of ['whenUse','whenNotUse','agentNotes']){
   assert.ok(Array.isArray(guide[key]) && guide[key].length>0,name+' lacks '+key);
   assert.ok(guide[key].every(x=>typeof x==='string'&&x.length>0&&x.length<360),name+' invalid '+key);
  }
  assert.ok(Array.isArray(guide.examples),name+' lacks example array');
  for(const item of guide.examples){
   assert.equal(item.length,2);
   assert.match(item[1],/^c-[a-z0-9-]+-\d+$/);
  }
 }
 for(const name of ['Accordion','Button','Card','Input','Checkbox','Tabs','Alert']){
  assert.ok(catalog[name],name+' must have sourced guidance');
 }
 assert.ok(catalog.Accordion.examples.length>=11,'Preserve Accordion examples');
 assert.ok(catalog.Button.examples.length>=61,'Preserve Button examples');
});
