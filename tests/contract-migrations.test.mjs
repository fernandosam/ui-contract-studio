import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkMigrationRegistry,migrateContractSpec,snapshotContractVersions} from '../scripts/lib/contract-migrations.mjs';

const read=file=>JSON.parse(readFileSync(file,'utf8'));
const lock=read('src/ui-catalog/contracts.lock.json');
const registry=read('src/ui-catalog/contract-migrations.json');
const item=type=>lock.components.find(entry=>entry.name===type);
const legacy=type=>registry.migrations.find(entry=>entry.type===type);
const node=(type,props={},on)=>({type,props,children:[],...(on?{on}:{})});
const spec={root:'root',elements:{
 root:{type:'Card',props:{title:'Known title',description:null},children:['badge','input']},
 badge:node('Badge',{label:'Draft',variant:'outline'}),
 input:node('Input',{label:'Email',name:'email',value:null,placeholder:null})
}};
const versions={schemaVersion:1,contracts:Object.fromEntries(
 ['Badge','Card','Input'].map(type=>[type,{version:legacy(type).from,fingerprint:legacy(type).sourceFingerprint}]))};
const run=(changes={})=>migrateContractSpec({spec,versions,registry,lock,...changes});

test('only reviewed historical Card/Badge/Input source fingerprints are supported',()=>{
 assert.equal(checkMigrationRegistry(registry,lock).size,3);
 assert.equal(registry.migrations.every(step=>step.operations.length===0),true);
 const result=run();
 assert.deepEqual(result.spec,spec);
 assert.deepEqual(result.report.changedTypes,['Badge','Card','Input']);
 assert.equal(result.report.steps.length,3);
 for(const type of ['Badge','Card','Input']){
  assert.deepEqual(result.versions.contracts[type],
   {version:item(type).version,fingerprint:item(type).semanticFingerprint});
 }
 assert.deepEqual(run(),result,'same input produces identical output');
 assert.deepEqual(versions.contracts.Card,
  {version:legacy('Card').from,fingerprint:legacy('Card').sourceFingerprint},
  'the caller input is never mutated');
});

test('current snapshot is explicit, stable and deterministic',()=>{
 const manifest=snapshotContractVersions(spec,lock);
 assert.deepEqual(manifest,run().versions);
 const result=run({versions:manifest});
 assert.equal(result.report.steps.length,0);
 assert.deepEqual(result.spec,spec);
});

test('unknown, future, fingerprint-mismatched and incomplete versions fail closed',()=>{
 for(const [version,fingerprint] of [
  ['1.0.0',legacy('Card').sourceFingerprint],
  ['99.0.0',legacy('Card').sourceFingerprint],
  [legacy('Card').from,'0'.repeat(64)],
  [item('Card').version,legacy('Card').sourceFingerprint]
 ]){
  const changed=structuredClone(versions);
  changed.contracts.Card={version,fingerprint};
  assert.throws(()=>run({versions:changed}),/unsupported source release/);
 }
 const missing=structuredClone(versions);delete missing.contracts.Input;
 assert.throws(()=>run({versions:missing}),/must list exactly/);
 const extra=structuredClone(versions);extra.contracts.Text={version:'2.0.0',fingerprint:'f'.repeat(64)};
 assert.throws(()=>run({versions:extra}),/must list exactly/);
});

test('no unknown or experimental type becomes allowed through migration metadata',()=>{
 const bad=structuredClone(spec);bad.elements.badge.type='NotAdmitted';
 assert.throws(()=>run({spec:bad}),/tipo não registrado/);
 const experimental=structuredClone(lock);
 experimental.components.find(x=>x.name==='Card').stability='experimental';
 assert.throws(()=>run({lock:experimental}),/no approved stable target/);
});

test('registry is closed: no unknown opcode, ambiguous edge, mismatch or bad final fingerprint',()=>{
 const duplicate=structuredClone(registry);duplicate.migrations.push(duplicate.migrations[0]);
 assert.throws(()=>checkMigrationRegistry(duplicate,lock),/duplicate migration origin/);
 const drift=structuredClone(registry);drift.migrations[0].targetFingerprint='a'.repeat(64);
 assert.throws(()=>checkMigrationRegistry(drift,lock),/final target differs/);
 const arbitrary=structuredClone(registry);arbitrary.migrations[0].operations=[{op:'javascript',code:'alert(1)'}];
 assert.throws(()=>checkMigrationRegistry(arbitrary,lock),/unsupported operation/);
});

test('declared rename and default operations are deterministic, preserve handlers and reject collisions',()=>{
 const syntheticLock={components:[{name:'Widget',version:'2.0.0',semanticFingerprint:'b'.repeat(64),
  stability:'stable',status:'approved'}]};
 const syntheticRegistry={schemaVersion:1,migrations:[{type:'Widget',from:'1.0.0',to:'2.0.0',
  sourceFingerprint:'a'.repeat(64),targetFingerprint:'b'.repeat(64),note:'Reviewed rename',
  operations:[{op:'rename-prop',from:'oldLabel',to:'label'},
    {op:'rename-event',from:'click',to:'press'},
    {op:'set-default-prop',key:'disabled',value:false}]}]};
 const syntheticVersions={schemaVersion:1,contracts:{Widget:{version:'1.0.0',fingerprint:'a'.repeat(64)}}};
 const original={root:'x',elements:{x:node('Widget',{oldLabel:'Submit'},
  {click:{action:'buttonClick',params:{message:'hello'}}})}};
 const migrated=migrateContractSpec({spec:original,versions:syntheticVersions,
  registry:syntheticRegistry,lock:syntheticLock});
 assert.deepEqual(migrated.spec.elements.x.props,{label:'Submit',disabled:false});
 assert.deepEqual(migrated.spec.elements.x.on,{press:{action:'buttonClick',params:{message:'hello'}}});
 assert.equal(migrated.report.operations.length,3);
 assert.equal(original.elements.x.props.oldLabel,'Submit');
 const collision=structuredClone(original);collision.elements.x.props.label='Do not overwrite';
 assert.throws(()=>migrateContractSpec({spec:collision,versions:syntheticVersions,
  registry:syntheticRegistry,lock:syntheticLock}),/migration collision/);
 const next=structuredClone(syntheticRegistry);
 next.migrations[0].operations=[{op:'set-default-prop',key:'label',value:'unexpected'}];
 assert.deepEqual(migrateContractSpec({spec:original,versions:syntheticVersions,
  registry:next,lock:syntheticLock}).spec.elements.x.props,
  {oldLabel:'Submit',label:'unexpected'});
});

test('chained releases must preserve intermediate fingerprints',()=>{
 const syntheticLock={components:[{name:'Widget',version:'3.0.0',
  semanticFingerprint:'c'.repeat(64),status:'approved',stability:'stable'}]};
 const registry={schemaVersion:1,migrations:[
  {type:'Widget',from:'1.0.0',to:'2.0.0',sourceFingerprint:'a'.repeat(64),
   targetFingerprint:'b'.repeat(64),note:'step one',operations:[]},
  {type:'Widget',from:'2.0.0',to:'3.0.0',sourceFingerprint:'b'.repeat(64),
   targetFingerprint:'c'.repeat(64),note:'step two',operations:[]}
 ]};
 const actual=migrateContractSpec({spec:{root:'x',elements:{x:node('Widget')}},
  versions:{schemaVersion:1,contracts:{Widget:{version:'1.0.0',fingerprint:'a'.repeat(64)}}},
  registry,lock:syntheticLock});
 assert.equal(actual.report.steps.length,2);
 registry.migrations[1].sourceFingerprint='f'.repeat(64);
 assert.throws(()=>checkMigrationRegistry(registry,syntheticLock),/fingerprint discontinuity/);
});
