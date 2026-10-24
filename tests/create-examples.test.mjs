import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { graphErrors } from '../scripts/lib/spec-invariants.mjs';
const json = path => JSON.parse(readFileSync(path,'utf8'));
const lock = json('src/ui-catalog/contracts.lock.json');
const allowed = lock.components.map(x=>x.name);
const actions = ['setState','pushState','removeState','buttonClick','formSubmit','linkClick'];

test('duas telas shadcn/create declarativas descobertas por metadata', () => {
 for (const n of ['01','02']) {
  const name=`exemplo-${n}`;
  const spec=json(`src/ui-screens/${name}.json`);
  const meta=json(`src/ui-screen-meta/${name}.json`);
  assert.equal(meta.section,'Exemplos');
  assert.equal(graphErrors(spec,allowed,{allowedActions:actions}).length,0);
  assert.ok(Object.keys(spec.elements).length>=25);
  assert.equal(Object.values(spec.elements).some(x=>['script','iframe','HTML'].includes(x.type)),false);
 }
});
test('Field é registrado antes de uso nos exemplos', () => {
 const f=lock.components.find(x=>x.name==='Field');
 assert.equal(f?.tier,'extension'); assert.equal(f?.status,'approved');
 const source=json('src/ui-catalog/sources.json').components.find(x=>x.name==='Field');
 assert.match(source.sourceUrl,/ui.shadcn.com\/docs\/components/);
 const plan=json('shadcn-plan.json').groups.flatMap(g=>g.items);
 assert.ok(plan.some(x=>x.name==='field'));
 assert.ok(readFileSync('src/ui-catalog/extensions/registry.tsx','utf8').includes('Field:'));
 assert.ok(readFileSync('src/ui-catalog/extensions/components/field.tsx','utf8').includes('ShadcnField'));
 const inventory=json('src/ui-catalog/create-preview-inventory.json');
 const card=inventory.previews[1].cards.find(x=>x.id==='NotificationSettings');
 assert.ok(card);
 const componentName=card.id.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase();
 const template=json(`src/ui-catalog/extensions/composites/templates/${componentName}.json`);
 assert.ok(Object.values(template.elements).some(x=>x.type==='Field'));
});
test('menu agrupa exemplos sem telas React arbitrárias', () => {
 const layout=readFileSync('src/ui-runtime/layout.tsx','utf8');
 assert.match(layout,/label:"Exemplos"/);
 assert.match(layout,/SidebarGroupLabel/);
 assert.match(readFileSync('src/ui-runtime/screen-registry.ts','utf8'),/import.meta.glob/);
});
