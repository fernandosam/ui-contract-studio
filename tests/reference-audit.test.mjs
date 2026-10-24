import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const audit=read('src/ui-catalog/create-reference-audit.json');
const gallery=read('src/ui-catalog/create-preview-inventory.json');
const accepted=gallery.previews.flatMap(p=>p.cards.filter(x=>x.representation!=='inline-primitives').map(x=>x.id));
const types=n=>Object.values(read(audit.cards.find(c=>c.name===n).templatePath).elements).map(x=>x.type);
test('as 64 fontes oficiais continuam documentadas (10 demos inline)',()=>{
 assert.equal(audit.cards.length,64);
 for(const c of audit.cards){
  assert.equal(c.sourceStatus,'read');
  assert.equal(c.visualStatus,'browser-screenshot-pending');
  assert.ok(c.sourceUrl.startsWith('https://github.com/shadcn-ui/ui/blob/main/'));
  if(accepted.includes(c.name))assert.ok(types(c.name).includes('Card'));
  else assert.equal(c.currentUsage,'inline-primitives');
 }
});
test('campos e controles de negócio importantes continuam presentes',()=>{
 const address=read(audit.cards.find(c=>c.name==='ShippingAddress').templatePath);
 const labels=Object.values(address.elements).map(n=>n.props?.label);
 for(const x of ['Street address','Apt / Suite','City','State','ZIP Code','Country'])assert.ok(labels.includes(x));
 assert.ok(types('NotificationSettings').includes('Checkbox'));
 assert.ok(types('Invoice').includes('Table'));
});
test('homologação visual não é simulada',()=>{
 const run=spawnSync(process.execPath,['scripts/check-source-visual-review.mjs','--strict'],{encoding:'utf8'});
 assert.notEqual(run.status,0);
 assert.match(run.stderr,/revisão visual pendente/);
});
