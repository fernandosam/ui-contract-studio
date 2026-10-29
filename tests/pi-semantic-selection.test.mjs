import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {selectPiSemanticCandidates} from '../scripts/lib/pi-semantic-selection.mjs';

const stable = type => ({
 type, version:'1.0.0',stability:'stable',lifecycle:'stable',
 validation:{static:'approved',e2e:'not-recorded'},
});
const experimental = type => ({
 type,version:'0.1.0',stability:'experimental',lifecycle:'experimental',
 validation:{static:'pending',e2e:'pending'},
});
const profiles=[
 {component:'Button',documentationReview:'reviewed-documentation',
  purpose:'Disparar ação local',whenUse:['Acionar ação local de salvar'],
  whenNotUse:['Navegar para outra página: preferir Link'],
  capabilities:[
   {id:'shared',description:'Sinal local',state:'implemented-static-evidence'},
   {id:'press-only',description:'Evento press',state:'implemented-static-evidence'},
  ],sources:['src/ui-catalog/knowledge/button.json']},
 {component:'Link',documentationReview:'guidance-only',
  purpose:'Navegar para outra página',whenUse:['Navegar para outra página com href'],
  whenNotUse:['Executar operação destrutiva'],
  capabilities:[{id:'shared',description:'Outra API',state:'documented-not-implemented'}],
  sources:['src/ui-catalog/shadcn-guidance.json']},
 {component:'OtherLink',documentationReview:'guidance-only',
  purpose:'Navegar para outra página',whenUse:['Navegar para outra página com href'],
  whenNotUse:[],capabilities:[]},
 {component:'Combobox',documentationReview:'reviewed-documentation',
  purpose:'Navegar para outra página',whenUse:['Navegar para outra página'],
  whenNotUse:[],capabilities:[]},
];
const run=(requirement, contracts=[stable('Button'),stable('Link')], options={}) =>
 selectPiSemanticCandidates({requirement,contracts,profiles,...options});

test('a negative when-not-use vetoes an otherwise tempting choice, not a permission',()=>{
 const result=run('navegar para outra página');
 assert.equal(result.status,'recommended');
 assert.equal(result.selectedType,'Link');
 assert.equal(result.authority,'advisory-only');
 assert.equal(result.candidates.find(x=>x.type==='Button').decision,'avoid');
 assert.ok(result.candidates.find(x=>x.type==='Button').contraindications.length);
 assert.ok(result.candidates.find(x=>x.type==='Link').evidence.some(x=>x.field==='whenUse'));
});

test('comparison reuses catalog documentary ID rules, exposing distinct states',()=>{
 const result=run('navegar para outra página');
 const pair=result.comparison.find(x=>x.alternative==='Button');
 assert.ok(pair);
 assert.deepEqual(pair.documentaryOverlap.map(x=>[x.id,x.primaryState,x.alternativeState]),
  [['shared','documented-not-implemented','implemented-static-evidence']]);
 assert.deepEqual(pair.alternativeOnly.map(x=>x.id),['press-only']);
 assert.match(pair.note,/documentais/);
});

test('ambiguity and weak evidence abstain rather than arbitrarily authorizing a type',()=>{
 const tied=run('navegar outra página',[stable('Link'),stable('OtherLink')]);
 assert.equal(tied.status,'ambiguous');
 assert.equal(tied.selectedType,null);
 const missing=run('gestão bancária complexa');
 assert.equal(missing.status,'no-match');
 assert.equal(missing.selectedType,null);
 const weak=run('navegar relatórios históricos extensos', [stable('Link')]);
 assert.equal(weak.status,'ambiguous');
 assert.equal(weak.selectedType,null);
});

test('unapproved lifecycle and missing static certification are not selectable',()=>{
 const result=run('navegar para outra página',[
   experimental('Combobox'),{...stable('Link'),validation:{static:'pending',e2e:'pending'}},
 ]);
 assert.equal(result.selectedType,null);
 assert.equal(result.status,'no-match');
 assert.ok(result.candidates.every(item=>item.decision==='unavailable'));
});

test('name matches are deterministic; output neither mutates source nor invents APIs',()=>{
 const contracts=[stable('Button'),stable('Link')],before=JSON.stringify([contracts,profiles]);
 const first=run('Button',contracts), second=run('Button',contracts);
 assert.deepEqual(first,second);
 assert.equal(first.selectedType,'Button');
 assert.equal(JSON.stringify([contracts,profiles]),before);
 assert.equal(first.candidates[0].version,'1.0.0');
 assert.equal(Object.hasOwn(first,'propsSchema'),false);
});

test('empty or oversized requirements and invalid limits fail closed',()=>{
 for(const requirement of ['', ' '.repeat(10),'a'.repeat(501)])
  assert.throws(()=>run(requirement),/requirement/);
 assert.throws(()=>run('Button',undefined,{limit:26}),/limite/);
});

test('Pi context embeds explanations when opted in, keeping selection scoped to --types',()=>{
 const cli=spawnSync(process.execPath,[
  'scripts/select-pi-context.mjs','--types=Button,Card',
  '--requirement=Button','--metadata-only','--stdout',
 ],{encoding:'utf8'});
 assert.equal(cli.status,0,cli.stderr);
 const pack=JSON.parse(cli.stdout);
 assert.deepEqual(pack.selected.map(item=>item.contract.type),['Button','Card']);
 assert.equal(pack.selection.selectedType,'Button');
 assert.equal(pack.selection.authority,'advisory-only');
 assert.ok(pack.selection.candidates.every(item=>['Button','Card'].includes(item.type)));
 assert.deepEqual(pack.actions,JSON.parse(readFileSync('pi-catalog/contracts.json','utf8')).actions);
 assert.equal(pack.selected.every(item=>!item.propsSchema),true);
});

test('Pi selection CLI uses stable projections and does not emit a generated spec',()=>{
 const cli=spawnSync(process.execPath,[
  'scripts/select-pi-candidates.mjs','--requirement=Button','--types=Button,Card',
 ],{encoding:'utf8'});
 assert.equal(cli.status,0,cli.stderr);
 const result=JSON.parse(cli.stdout);
 assert.equal(result.selectedType,'Button');
 assert.equal(result.authority,'advisory-only');
 assert.ok(result.candidates.every(item=>['Button','Card'].includes(item.type)));
 assert.equal(Object.hasOwn(result,'elements'),false);
 const bad=spawnSync(process.execPath,[
  'scripts/select-pi-candidates.mjs','--requirement=Button','--types=UnknownContract',
 ],{encoding:'utf8'});
 assert.notEqual(bad.status,0);
});
