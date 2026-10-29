import test from 'node:test';
import assert from 'node:assert/strict';
import {compareSemanticContracts,type SemanticComparisonEntry} from '../src/ui-runtime/semantic-comparison.ts';

function record(name:string,capabilities:SemanticComparisonEntry['capabilities']=[]):SemanticComparisonEntry {
 return {name,capabilities,whenUse:[],whenNotUse:[],piAvailable:false,reviewed:false};
}
test('compares capabilities strictly by reviewed document ID, not similar descriptions',()=>{
 const left=record('Dialog',[
  {id:'shared',description:'Controle modal local',state:'implemented-static-evidence'},
  {id:'dialog-only',description:'Fechamento',state:'runtime-review-required'},
 ]);
 const right=record('AlertDialog',[
  {id:'shared',description:'Evento local diferente',state:'documented-not-implemented'},
  {id:'alert-only',description:'Confirmação',state:'implemented-static-evidence'},
 ]);
 const outcome=compareSemanticContracts(left,right);
 assert.deepEqual(outcome.shared.map(item=>item.id),['shared']);
 assert.deepEqual(outcome.shared.map(item=>[item.left.state,item.right.state]),[['implemented-static-evidence','documented-not-implemented']]);
 assert.deepEqual(outcome.onlyLeft.map(item=>item.id),['dialog-only']);
 assert.deepEqual(outcome.onlyRight.map(item=>item.id),['alert-only']);
});
test('same wording with different IDs is not assumed equivalent',()=>{
 const cap=(id:string)=>({id,description:'Exibe um botão',state:'implemented-static-evidence'});
 const result=compareSemanticContracts(record('Button',[cap('press')]),record('Link',[cap('navigate')]));
 assert.equal(result.shared.length,0);
 assert.deepEqual(result.onlyLeft.map(item=>item.id),['press']);
 assert.deepEqual(result.onlyRight.map(item=>item.id),['navigate']);
});
test('absence of reviewed capabilities is unknown rather than an implementation failure',()=>{
 const result=compareSemanticContracts(record('WithoutKnowledge'),record('AnotherWithoutKnowledge'));
 assert.deepEqual(result,{shared:[],onlyLeft:[],onlyRight:[]});
});
test('comparison sorts deterministically without mutating semantic evidence',()=>{
 const left=record('One',[{id:'z',description:'z',state:'runtime-review-required'},{id:'a',description:'a',state:'implemented-static-evidence'}]);
 const right=record('Two',[{id:'a',description:'a',state:'implemented-static-evidence'},{id:'z',description:'z',state:'documented-not-implemented'}]);
 const before=JSON.stringify([left,right]);
 assert.deepEqual(compareSemanticContracts(left,right).shared.map(item=>item.id),['a','z']);
 assert.equal(JSON.stringify([left,right]),before);
});
test('cannot compare a component with itself',()=>{
 assert.throws(()=>compareSemanticContracts(record('Dialog'),record('Dialog')),/componentes diferentes/);
});
