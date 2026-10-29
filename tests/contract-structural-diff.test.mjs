import test from 'node:test';
import assert from 'node:assert/strict';
import {detectContractChanges} from '../scripts/lib/contract-structural-diff.mjs';
import {classifySegmentChange, classifyContractChanges} from '../scripts/lib/contract-compatibility.mjs';

const original = `Input: {
  props: strict({
    label: z.string(),
    open: z.boolean().optional(),
    steps: z.array(strict({id:z.string(),status:z.enum(["idle","done"])})).max(12),
  }),
  events: ["change", "blur"],
  slots: ["default"],
  description: "Old documentation",
},`;
const change=(from,to)=>original.replace(from,to);
const entries=(changes,category,path)=>changes.filter(x=>x.category===category && x.path===path);

test('insignificant whitespace and comments do not create API deltas',()=>{
  assert.deepEqual(detectContractChanges(original,original.replace('label: z.string(),','label:   z.string(), // nothing')),[]);
});

test('top-level properties report additions, removals and schema changes',()=>{
  const added=detectContractChanges(original,change('label: z.string(),','label: z.string(), placeholder:z.string().optional(),'));
  assert.deepEqual(entries(added,'property','props.placeholder').map(x=>x.kind),['added']);
  const removed=detectContractChanges(original,change('label: z.string(),',''));
  assert.deepEqual(entries(removed,'property','props.label').map(x=>x.kind),['removed']);
  const type=detectContractChanges(original,change('label: z.string()','label: z.number()'));
  assert.deepEqual(entries(type,'property','props.label').map(x=>x.kind),['modified']);
});

test('state changes are detected for root and nested state-like fields',()=>{
  const open=detectContractChanges(original,change('open: z.boolean().optional()','open: z.boolean().nullable()'));
  assert.deepEqual(entries(open,'state','props.open').map(x=>x.kind),['modified']);
  const nested=detectContractChanges(original,change('"idle","done"','"idle","processing","done"'));
  assert.deepEqual(entries(nested,'state','props.steps[].status').map(x=>x.kind),['modified']);
  const explicit=detectContractChanges('Input: { states:["idle"] },','Input: { states:["idle","done"] },');
  assert.deepEqual(entries(explicit,'state','states.done').map(x=>x.kind),['added']);
});

test('events and slots are compared as discrete public contract members',()=>{
  const events=detectContractChanges(original,change('["change", "blur"]','["change", "submit"]'));
  assert.deepEqual(entries(events,'event','events.blur').map(x=>x.kind),['removed']);
  assert.deepEqual(entries(events,'event','events.submit').map(x=>x.kind),['added']);
  const slots=detectContractChanges(original,change('slots: ["default"]','slots: ["actions"]'));
  assert.deepEqual(entries(slots,'structure','slots.default').map(x=>x.kind),['removed']);
  assert.deepEqual(entries(slots,'structure','slots.actions').map(x=>x.kind),['added']);
});

test('container and opaque structural changes cannot disappear from the report',()=>{
  const container=detectContractChanges(original,change('props: strict({','props: obj({'));
  assert.deepEqual(entries(container,'structure','props.$container').map(x=>x.kind),['modified']);
  const opaque=detectContractChanges('X: {props: compositeNodePropsSchemas.X},',
    'X: {props: compositeNodePropsSchemas.Y},');
  assert.deepEqual(entries(opaque,'structure','props').map(x=>x.kind),['modified']);
  const unknown=detectContractChanges('X: {events:["go"]},','X: {events:dynamicEvents},');
  assert.equal(unknown.some(x=>x.category==='event'),true);
});

test('documentation, ordering and source-extraction failures are visible',()=>{
  const description=detectContractChanges(original,change('Old documentation','New documentation'));
  assert.deepEqual(entries(description,'metadata','description').map(x=>x.kind),['modified']);
  const reorder=detectContractChanges('X: {props: strict({a:z.string(),b:z.number()})},',
    'X: {props: strict({b:z.number(),a:z.string()})},');
  assert.deepEqual(entries(reorder,'structure','$ordering-or-opaque').map(x=>x.kind),['modified']);
  assert.equal(entries(detectContractChanges(undefined,'X: {props: strict({a:z.string()})},'),
    'structure','$component').length,1);
});

test('structured details cannot bypass existing conservative MAJOR classification',()=>{
  const changed=change('["change", "blur"]','["change", "submit"]');
  const source=classifySegmentChange(original,changed);
  assert.equal(source.level,'major');
  assert.deepEqual(source.details.filter(x=>x.category==='event').map(x=>x.path),
    ['events.blur','events.submit']);
  const component=(version,fp)=>({name:'Input',tier:'base',version,
    semanticFingerprint:fp.repeat(64),stability:'stable',status:'approved'});
  const outcome=classifyContractChanges({components:[component('1.2.3','a')]},
    {components:[component('1.3.0','b')]},
    new Map([['Input',original]]),new Map([['Input',changed]]));
  assert.match(outcome.errors.join(' '),/exige incremento MAJOR/);
  assert.equal(outcome.changes[0].details.some(x=>x.category==='event'),true);
});
