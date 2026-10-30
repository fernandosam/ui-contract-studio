import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDiscoveryIndex,discoverIndexedContracts,discoverContracts,functionalGroup,semanticScore} from '../src/ui-runtime/catalog-discovery.ts';

const entries=[
 {name:'AlertDialog',description:'Confirmação de operações',whenUse:['Confirmar decisões irreversíveis'],maturity:'stable',piAvailable:true},
 {name:'Dialog',description:'Janela de conteúdo',whenUse:['Editar formulários temporários'],maturity:'stable',piAvailable:true},
 {name:'UnreviewedWidget',description:'Composição candidata',whenUse:['Visualizar dados locais'],maturity:'experimental',piAvailable:false},
];
test('intent search tolerates Portuguese accents and ranks names before descriptions',()=>{
 assert.deepEqual(discoverContracts(entries,{query:'confirmacao'}).map(x=>x.entry.name),['AlertDialog']);
 assert.ok(semanticScore(entries[0],'alertdialog')>semanticScore(entries[0],'confirmar'));
 assert.deepEqual(discoverContracts(entries,{query:'formulários'}).map(x=>x.entry.name),['Dialog']);
});
test('all query words must match positive evidence; undocumented negative capabilities never become available',()=>{
 assert.equal(discoverContracts(entries,{query:'exclusao remota'}).length,0);
 assert.equal(semanticScore({name:'Alert',description:'Aviso',whenUse:[]},'confirmacao'),0);
});
test('functional group and Pi filters work together without conflating availability with maturity',()=>{
 assert.equal(functionalGroup('AlertDialog'),'Confirmação e feedback');
 assert.equal(functionalGroup('DataTable'),'Dados e visualização');
 assert.deepEqual(discoverContracts(entries,{pi:'unavailable'}).map(x=>x.entry.name),['UnreviewedWidget']);
 assert.deepEqual(discoverContracts(entries,{maturity:'experimental',pi:'available'}),[]);
 assert.deepEqual(discoverContracts(entries,{group:'Formulários e entrada'}).map(x=>x.entry.name),[]);
});
test('results are deterministic, stable and preserve names for exact matching',()=>{
 const before=JSON.stringify(entries);
 assert.deepEqual(discoverContracts(entries,{query:'a'}),discoverContracts(entries,{query:'a'}));
 assert.equal(JSON.stringify(entries),before);
});

test('pre-indexing preserves ranking and filters across repeated queries',()=>{
 const index=buildDiscoveryIndex(entries);
 for(const query of ['','confirmacao','  FORMULÁRIOS ','a','inexistente','confirmar decisões']){
  for(const pi of ['all','available','unavailable']){
   const options={query,pi};
   assert.deepEqual(discoverIndexedContracts(index,options),discoverContracts(entries,options));
  }
 }
 assert.equal(index[0].entry,entries[0],'keep original approved record identity');
});

test('cached index follows contract identity, public guidance and current Pi filtering',()=>{
 const fp='a'.repeat(64);
 const reviewed=entries.map(entry=>({...entry,version:'1.0.0',fingerprint:fp}));
 assert.deepEqual(discoverContracts(reviewed,{query:'confirmacao'}).map(x=>x.entry.name),['AlertDialog']);
 // Same contract identity but edited public guidance must never reuse stale text.
 const revised=reviewed.map(entry=>entry.name==='Dialog'
  ? {...entry,whenUse:['Confirmar revisão de dados']} : entry);
 assert.deepEqual(discoverContracts(revised,{query:'confirmar'}).map(x=>x.entry.name),
  ['AlertDialog','Dialog']);
 const nextVersion=revised.map(entry=>entry.name==='Dialog'
  ? {...entry,version:'1.1.0',piAvailable:false} : entry);
 assert.deepEqual(discoverContracts(nextVersion,{query:'confirmar',pi:'available'}).map(x=>x.entry.name),
  ['AlertDialog']);
 const nextFingerprint=nextVersion.map(entry=>entry.name==='Dialog'
  ? {...entry,fingerprint:'b'.repeat(64),description:'Tabela revisada'} : entry);
 assert.deepEqual(discoverContracts(nextFingerprint,{query:'tabela'}).map(x=>x.entry.name),['Dialog']);
 assert.deepEqual(discoverContracts(reviewed,{query:'tabela'}),[]);
});
