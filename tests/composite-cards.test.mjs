import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {graphErrors} from '../scripts/lib/spec-invariants.mjs';
import {signatures} from '../scripts/lib/contract-lock.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const inv=read('src/ui-catalog/create-preview-inventory.json');
const approved=read('src/ui-catalog/contracts.lock.json').components;
const names=approved.map(x=>x.name);
const manifest=read('src/ui-catalog/extensions/composites/generated-manifest.json').components;
const declared=new Set(manifest.map(x=>x.name));
const base=approved.filter(c=>c.tier==='base').map(x=>x.name).concat(['DataTable','DatePicker','Field']);
const refs=read('src/ui-catalog/create-reference-audit.json');
const checks=['setState','pushState','removeState','buttonClick','formSubmit','linkClick'];
for(const group of inv.previews)for(const card of group.cards){
 test(`${card.id}: demonstração oficial sem contrato redundante`,()=>{
  const screen=read(`src/ui-screens/${group.screen}.json`);
  if(card.representation==='inline-primitives'){
   const node=screen.elements[card.inlineRoot];
   assert.equal(node.type,'Card',card.id);
   assert.equal(declared.has(card.id),false,card.id);
   assert.equal(names.includes(card.id),false,card.id);
   const descendants=Object.keys(screen.elements).filter(x=>x.startsWith(card.inlineRoot+'__inline__'));
   assert.ok(descendants.length>=1,card.id);
   assert.ok(descendants.every(x=>base.includes(screen.elements[x].type)),card.id);
  }else{
   assert.equal(card.representation,'registered-composite');
   assert.ok(declared.has(card.id),card.id);
   assert.ok(Object.values(screen.elements).some(x=>x.type===card.id),card.id);
   const p=`src/ui-catalog/extensions/composites/templates/${manifest.find(x=>x.name===card.id).template}`;
   const spec=read(p);
   assert.equal(spec.elements[spec.root].type,'Card');
   assert.equal(spec.elements[spec.root].props.title,refs.cards.find(x=>x.name===card.id)?.originalTitle);
   assert.deepEqual(graphErrors(spec,base,{allowedActions:checks}),[],card.id);
   assert.equal(approved.find(x=>x.name===card.id)?.version,'1.2.0');
  }
 });
}
test('156 contratos consistentes; 64 exemplos oficiais (54 contratos + 10 inline)',()=>{
 assert.equal(approved.length,156);
 assert.equal(signatures().length,156);
 for(const x of signatures())assert.equal(approved.find(c=>c.name===x.name)?.fingerprint,x.fingerprint,x.name);
 const cards=inv.previews.flatMap(x=>x.cards);
 assert.equal(cards.length,64);
 assert.equal(cards.filter(x=>x.representation==='inline-primitives').length,10);
 assert.equal(cards.filter(x=>x.representation==='registered-composite').length,54);
 for(const group of inv.previews){
  const spec=read(`src/ui-screens/${group.screen}.json`);
  assert.deepEqual(graphErrors(spec,names,{allowedActions:checks}),[],group.screen);
  assert.ok(Object.values(spec.elements).every(node=>Array.isArray(node.children)),group.screen);
 }
});
