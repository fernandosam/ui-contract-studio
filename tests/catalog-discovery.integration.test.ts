import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverContracts,functionalGroup,semanticScore} from '../src/ui-runtime/catalog-discovery.ts';

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
