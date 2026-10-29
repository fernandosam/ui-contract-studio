import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkMigrationRegistry,migrateContractSpec,snapshotContractVersions} from '../scripts/lib/contract-migrations.mjs';

const read=path=>JSON.parse(readFileSync(path,'utf8'));
const lock=read('src/ui-catalog/contracts.lock.json');
const registry=read('src/ui-catalog/contract-migrations.json');
const fixture='tests/fixtures/contract-migrations/';
const original=read(fixture+'legacy-reui-spec.json');
const historical=read(fixture+'legacy-reui-versions.json');
const current=type=>{
 const entry=lock.components.find(item=>item.name===type);
 return {version:entry.version,fingerprint:entry.semanticFingerprint};
};
const migrate=(spec=original,versions=historical,options={})=>
 migrateContractSpec({spec,versions,registry,lock,...options});
const node=(type,props={},children=[],on)=>({type,props,children,...(on?{on}:{})});
const hash=char=>char.repeat(64);
const step=(type,from,to,sourceFingerprint,targetFingerprint,operations=[])=>({
 type,from,to,sourceFingerprint,targetFingerprint,operations,note:'Reviewed synthetic transition'
});
const fixtureSpec=(types)=>{
 const selected=types.filter(type=>type!=='Card').map(type=>type.toLowerCase());
 const root=types.includes('Card')?'root':selected[0];
 const elements={};
 if(types.includes('Card'))elements.root={...original.elements.root,children:selected};
 for(const type of types.filter(type=>type!=='Card')){
  const id=type.toLowerCase();
  elements[id]=structuredClone(original.elements[id]);
 }
 return {root,elements};
};
const fixtureVersions=types=>({schemaVersion:1,contracts:Object.fromEntries(
 types.map(type=>[type,structuredClone(historical.contracts[type])] ))});

test('historical compatibility: every reviewed 2.0.0 fixture migrates without altering a single JSON node',()=>{
 for(const type of ['Badge','Card','Input']){
  const spec=fixtureSpec([type]),versions=fixtureVersions([type]);
  const result=migrate(spec,versions);
  assert.deepEqual(result.spec,spec,type);
  assert.deepEqual(result.versions.contracts[type],current(type),type);
  assert.deepEqual(result.report.changedTypes,[type]);
  assert.equal(result.report.steps.length,1);
  assert.deepEqual(result.report.operations,[]);
  assert.equal(result.report.steps[0].sourceFingerprint,versions.contracts[type].fingerprint);
 }
 const full=migrate();
 assert.deepEqual(full.spec,original);
 assert.deepEqual(full.versions,snapshotContractVersions(original,lock));
 assert.deepEqual(full.report.changedTypes,['Badge','Card','Input']);
 assert.deepEqual(migrate(),full,'serialization and ordering are deterministic');
 assert.deepEqual(historical,read(fixture+'legacy-reui-versions.json'));
});

test('mixed old/current contracts, independent versions and repeated migration are no-ops for current releases',()=>{
 const mixed=structuredClone(historical);
 mixed.contracts.Badge=current('Badge');
 const first=migrate(original,mixed);
 assert.deepEqual(first.report.changedTypes,['Card','Input']);
 assert.equal(first.report.steps.length,2);
 assert.deepEqual(first.spec,original);
 const second=migrate(first.spec,first.versions);
 assert.equal(second.report.steps.length,0);
 assert.deepEqual(second.report.changedTypes,[]);
 assert.deepEqual(second.report.operations,[]);
 assert.deepEqual(second.spec,first.spec);
 assert.deepEqual(second.versions,first.versions);
});

test('reversibility is snapshot-based: callers can restore the exact original spec and provenance',()=>{
 const spec=structuredClone(original),versions=structuredClone(historical);
 const originalBytes=JSON.stringify({spec,versions});
 const migrated=migrate(spec,versions);
 assert.deepEqual({spec,versions},JSON.parse(originalBytes),'migration leaves source and manifest intact');
 assert.deepEqual(migrated.spec,original,'optional-only historical transitions are content preserving');
 assert.deepEqual(JSON.parse(originalBytes),{spec:original,versions:historical},
  'rollback retains the historical version/fingerprint instead of pretending to downgrade');
 const backwards=structuredClone(migrated.versions);
 backwards.contracts.Card={version:'1.0.0',fingerprint:historical.contracts.Card.fingerprint};
 assert.throws(()=>migrate(migrated.spec,backwards),/unsupported source release/);
});

test('reviewed chained transformations are deterministic and reversible by a retained original snapshot',()=>{
 const syntheticLock={components:[{name:'Widget',version:'3.0.0',
  semanticFingerprint:hash('c'),status:'approved',stability:'stable'}]};
 const syntheticRegistry={schemaVersion:1,migrations:[
  step('Widget','1.0.0','2.0.0',hash('a'),hash('b'),[
   {op:'rename-prop',from:'oldLabel',to:'label'},
   {op:'rename-event',from:'click',to:'press'}]),
  step('Widget','2.0.0','3.0.0',hash('b'),hash('c'),[
   {op:'set-default-prop',key:'disabled',value:false}])
 ]};
 const versions={schemaVersion:1,contracts:{Widget:{version:'1.0.0',fingerprint:hash('a')}}};
 const input={root:'first',elements:{
  first:node('Widget',{oldLabel:'Save'},['second'],{click:{action:'buttonClick',params:{message:'go'}}}),
  second:node('Widget',{oldLabel:'Cancel',disabled:true})
 }};
 const source=structuredClone({input,versions,syntheticRegistry});
 const run=()=>migrateContractSpec({spec:input,versions,registry:syntheticRegistry,lock:syntheticLock});
 const result=run();
 assert.deepEqual(result,run());
 assert.equal(result.report.steps.length,2);
 assert.equal(result.report.operations.length,4);
 assert.deepEqual(result.spec.elements.first.props,{label:'Save',disabled:false});
 assert.deepEqual(result.spec.elements.second.props,{disabled:true,label:'Cancel'});
 assert.deepEqual(result.spec.elements.first.on,{press:{action:'buttonClick',params:{message:'go'}}});
 assert.deepEqual({input,versions,syntheticRegistry},source);
 const restore=structuredClone(source.input);
 assert.deepEqual(restore,input,'restore from retained snapshot is lossless even with added defaults');
 assert.deepEqual(migrateContractSpec({spec:result.spec,versions:result.versions,
  registry:syntheticRegistry,lock:syntheticLock}).report.steps,[]);
});

test('failure halfway through multiple nodes or types is atomic to caller-owned data',()=>{
 const syntheticLock={components:[
  {name:'Alpha',version:'2.0.0',semanticFingerprint:hash('b'),status:'approved',stability:'stable'},
  {name:'Beta',version:'2.0.0',semanticFingerprint:hash('d'),status:'approved',stability:'stable'}
 ]};
 const syntheticRegistry={schemaVersion:1,migrations:[
  step('Alpha','1.0.0','2.0.0',hash('a'),hash('b'),[
   {op:'rename-prop',from:'oldLabel',to:'label'}]),
  step('Beta','1.0.0','2.0.0',hash('c'),hash('d'),[])
 ]};
 const spec={root:'root',elements:{
  root:node('Alpha',{oldLabel:'Will migrate'},['colliding','beta']),
  colliding:node('Alpha',{oldLabel:'Collision',label:'Protected'}),
  beta:node('Beta',{value:3})
 }};
 const versions={schemaVersion:1,contracts:{
  Alpha:{version:'1.0.0',fingerprint:hash('a')},
  Beta:{version:'1.0.0',fingerprint:hash('c')}
 }};
 const before=JSON.stringify({spec,versions,syntheticRegistry});
 assert.throws(()=>migrateContractSpec({spec,versions,registry:syntheticRegistry,
  lock:syntheticLock}),/migration collision props.oldLabel -> label/);
 assert.equal(JSON.stringify({spec,versions,syntheticRegistry}),before);
 delete spec.elements.colliding.props.label;
 const bad=structuredClone(versions);
 bad.contracts.Beta.fingerprint=hash('e');
 const secondBefore=JSON.stringify(spec);
 assert.throws(()=>migrateContractSpec({spec,versions:bad,registry:syntheticRegistry,
  lock:syntheticLock}),/unsupported source release/);
 assert.equal(JSON.stringify(spec),secondBefore,'no first-type mutation leaks if later type fails');
});

test('unknown sources and unapproved or unlisted types never gain admission by migration',()=>{
 for(const [version,fingerprint] of [
  ['2.0.0',hash('f')],['1.0.0',historical.contracts.Card.fingerprint],
  ['99.0.0',historical.contracts.Card.fingerprint],
  [current('Card').version,historical.contracts.Card.fingerprint]
 ]){
  const invalid=structuredClone(historical);
  invalid.contracts.Card={version,fingerprint};
  assert.throws(()=>migrate(original,invalid),/unsupported source release/);
 }
 const incomplete=structuredClone(historical);
 delete incomplete.contracts.Card;
 assert.throws(()=>migrate(original,incomplete),/must list exactly/);
 const unknown=structuredClone(original);
 unknown.elements.badge.type='NotInCatalog';
 assert.throws(()=>migrate(unknown),/tipo não registrado/);
 const unapproved=structuredClone(lock);
 unapproved.components.find(x=>x.name==='Badge').stability='experimental';
 assert.throws(()=>migrate(original,historical,{lock:unapproved}),/no approved stable target/);
 const malformed={...historical,contracts:{...historical.contracts,Extra:current('Card')}};
 assert.throws(()=>migrate(original,malformed),/must list exactly/);
});

test('registry fails closed for ambiguous steps, discontinuities and non-declarative operations',()=>{
 const mutate=fn=>{const candidate=structuredClone(registry);fn(candidate);return candidate;};
 assert.throws(()=>checkMigrationRegistry(mutate(r=>r.migrations.push(
  structuredClone(r.migrations[0]))),lock),/duplicate migration origin/);
 assert.throws(()=>checkMigrationRegistry(mutate(r=>{
  r.migrations[0].targetFingerprint=hash('f');
 }),lock),/final target differs/);
 for(const operation of [
  {op:'eval',code:'process.exit(0)'},
  {op:'rename-prop',from:'old',to:'constructor'},
  {op:'rename-event',from:'__proto__',to:'newEvent'},
  {op:'set-default-prop',key:'safe',value:Number.POSITIVE_INFINITY},
  {op:'set-default-prop',key:'safe',value:{nested:{prototype:'unsafe'}}},
  {op:'set-default-prop',key:'safe',value:[1,undefined]},
  {op:'set-default-prop',key:'safe',value:{x:NaN}}
 ]){
  const candidate=mutate(r=>r.migrations[0].operations=[operation]);
  assert.throws(()=>checkMigrationRegistry(candidate,lock),/unsupported operation|unsafe|invalid default/);
 }
});
