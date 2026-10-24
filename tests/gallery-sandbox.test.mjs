import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { graphErrors } from '../scripts/lib/spec-invariants.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const lock=read('src/ui-catalog/contracts.lock.json');
const refs=read('src/ui-catalog/create-preview-inventory.json');
const active=new Set(lock.components.map(x=>x.name));
const actions=['buttonClick','formSubmit','linkClick','setState','pushState','removeState'];
test('64 cards presentes sem exceções Zod estruturais e sem tipos desconhecidos',()=>{
 assert.deepEqual(refs.previews.map(g=>g.cards.length),[31,33]);
 for(const group of refs.previews){
  const spec=read(`src/ui-screens/${group.screen}.json`);
  assert.deepEqual(graphErrors(spec,[...active],{allowedActions:actions}),[],group.screen);
  for(const card of group.cards){
   const node=card.representation==='inline-primitives'?spec.elements[card.inlineRoot]:Object.values(spec.elements).find(x=>x.type===card.id);
   assert.ok(node,`${group.screen}: ${card.id}`);
   assert.ok(Array.isArray(node.children),`${card.id}: children`);
  }
 }
});
test('endereçamento mantém rótulos, campos, opções e estado originais',()=>{
 const t=read('src/ui-catalog/extensions/composites/templates/shipping-address.json');
 for(const [id,label] of [['street','Street address'],['apt','Apt / Suite'],['city','City'],['state','State'],['zip','ZIP Code'],['country','Country'],['save','Save as default address']])
   assert.equal(t.elements[id].props.label,label);
 assert.deepEqual(t.elements.state.props.options.map(x=>x.value),['CA','NY','TX']);
 assert.deepEqual(t.elements.country.props.options.map(x=>x.value),['US','CA','UK']);
 assert.deepEqual(t.elements.buttons.children,['cancel','submit']);
});
test('fatura USD mantém total calculável e textos da referência',()=>{
 const t=read('src/ui-catalog/extensions/composites/templates/invoice.json');
 const r=t.elements.table.props.rows;
 assert.equal(t.elements.root.props.title,'Invoice #INV-2847');
 assert.deepEqual(t.elements.table.props.columns,['Item','Qty','Rate','Amount']);
 const number=v=>Number(v.replaceAll(/[$,]/g,''));
 assert.equal(r.slice(0,3).reduce((sum,row)=>sum+Number(row[1])*number(row[2]),0),2437);
 assert.equal(number(r.find(row=>row[0]==='Total Due')[3]),2437);
});
test('notificações oferecem descrições e seleção conjunta local com estado intermediário',()=>{
 const t=read('src/ui-catalog/extensions/composites/templates/notification-settings.json');
 const x=readFileSync('src/ui-catalog/extensions/components/notification-settings.tsx','utf8');
 assert.equal(Object.values(t.elements).filter(n=>n.type==='Checkbox').length,5);
 for(const help of ['Deposits, withdrawals, and transfers.','Login attempts and account changes.','Updates at 25%, 50%, 75%, and 100%.','Daily portfolio summary and price alerts.'])
  assert.ok(Object.values(t.elements).some(n=>n.props?.text===help),help);
 for(const logic of ['allChecked','someChecked','toggleAll','setChecked','indeterminate={someChecked}'])assert.ok(x.includes(logic),logic);
 assert.ok(readFileSync('src/ui-catalog/extensions/registry.tsx','utf8').includes('NotificationSettings: ({props}'));
});
test('navegação demonstrativa usa duas listas e não aponta para as telas aposentadas',()=>{
 const g=read('src/ui-screens/exemplo-02.json');
 const main=g.elements['n0129'];
 assert.equal(main.children.length,1);
 const columns=g.elements[main.children[0]];
 assert.equal(columns.type,'Grid');assert.equal(columns.props.columns,2);
 assert.equal(columns.children.length,2);
 assert.deepEqual(columns.children.map(id=>g.elements[id].props.title),['Overview','Account']);
 for(const id of columns.children)assert.equal(g.elements[id].children.length,9);
 for(const group of refs.previews){
  const s=read(`src/ui-screens/${group.screen}.json`);
  for(const node of Object.values(s.elements))if(node.type==='Link'){
    assert.ok(!['?screen=dashboard','?screen=catalogo','?screen=usuarios','?screen=auditoria'].includes(node.props.href));
  }
 }
});
test('fidelidade visual estrita requer screenshots reais, não rótulo aprovado automaticamente',()=>{
 const a=read('src/ui-catalog/composite-fidelity-audit.json');
 assert.ok(a.composites>0);
 assert.equal(a.items.some(x=>x.visualStatus==='screenshot-pending'),true);
});
