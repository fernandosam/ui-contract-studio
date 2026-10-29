import test from 'node:test';
import assert from 'node:assert/strict';
import {classifySegmentChange,classifyContractChanges,versionBump} from '../scripts/lib/contract-compatibility.mjs';

const old='Button: { props: obj({label:z.string(),size:z.enum(["sm","lg"]).optional()}), events:["click"], description:"Botão antigo" },';
const changed=text=>old.replace('description:"Botão antigo"','description:"Botão novo"').replace('size:z.enum(["sm","lg"]).optional()',text);
const fingerprint=marker=>marker.repeat(64);
const component=(version='1.2.3',semanticFingerprint=fingerprint('a'),extra={})=>
 ({name:'Button',tier:'base',version,semanticFingerprint,stability:'stable',status:'approved',...extra});
const compare=(nextSegment,version,extra={})=>classifyContractChanges(
 {components:[component()]},{components:[component(version,fingerprint(nextSegment===old?'a':'b'),extra)]},
 new Map([['Button',old]]),new Map([['Button',nextSegment]]));

test('strict semver rejects regression and malformed versions',()=>{
 assert.equal(versionBump('1.2.3','1.2.4'),'patch');
 assert.equal(versionBump('1.2.3','1.3.0'),'minor');
 assert.equal(versionBump('1.2.3','2.0.0'),'major');
 assert.equal(versionBump('1.2.3','1.3.4'),'minor');
 assert.equal(versionBump('1.2.3','1.1.9'),'regression');
 assert.equal(versionBump('1.2.3','1.02.4'),'invalid');
 assert.equal(versionBump('1.2.3','1.2.3'),'none');
});
test('description-only changes are PATCH and cannot bypass the bump',()=>{
 const descriptionOnly=old.replace('Botão antigo','Botão novo');
 assert.equal(classifySegmentChange(old,descriptionOnly).level,'patch');
 assert.equal(compare(descriptionOnly,'1.2.4').errors.length,0);
 assert.match(compare(descriptionOnly,'1.2.3').errors.join('\n'),/exige incremento PATCH/);
});
test('pure optional property addition is MINOR, including nested enums',()=>{
 const additive=changed('size:z.enum(["sm","lg"]).optional(),tone:z.enum(["light","dark"]).optional()');
 assert.equal(classifySegmentChange(old,additive).level,'minor');
 assert.equal(compare(additive,'1.3.0').errors.length,0);
 assert.match(compare(additive,'1.2.4').errors.join('\n'),/exige incremento MINOR/);
});
test('required props, narrowing, renamed props and events are MAJOR',()=>{
 for(const edit of [
  changed('size:z.enum(["sm","lg"]).optional(),tone:z.string()'),
  changed('size:z.enum(["sm"]).optional()'),
  old.replace('events:["click"]','events:[]'),
  old.replace('label:z.string()','title:z.string()'),
  old.replace('size:z.enum(["sm","lg"]).optional()','size:z.enum(["sm","lg"]).nullable()'),
 ]){
  assert.equal(classifySegmentChange(old,edit).level,'major');
  assert.match(compare(edit,'1.3.0').errors.join('\n'),/exige incremento MAJOR/);
  assert.equal(compare(edit,'2.0.0').errors.length,0);
 }
});
test('fingerprint mismatch and unjustified version bumps are blocked',()=>{
 const mismatch=classifyContractChanges({components:[component()]},{components:[component()]},
 new Map([['Button',old]]),new Map([['Button',old.replace('label:z.string()','label:z.number()')]]));
 assert.match(mismatch.errors.join(' '),/sem atualização do fingerprint/);
 assert.match(compare(old,'1.2.4').errors.join(' '),/versão alterada sem mudança/);
});
test('stable withdrawal is MAJOR and stable publication is MINOR',()=>{
 assert.match(compare(old,'1.3.0',{stability:'deprecated'}).errors.join(' '),/exige incremento MAJOR/);
 const prior=component('1.2.3',fingerprint('a'),{stability:'beta'});
 assert.equal(classifyContractChanges({components:[prior]},{components:[component('1.3.0')]},
 new Map([['Button',old]]),new Map([['Button',old]])).errors.length,0);
});
test('deletions, tier changes, duplicate names and invalid stable status fail closed',()=>{
 assert.match(classifyContractChanges({components:[component()]},{components:[]},new Map(),new Map()).errors.join(' '),/remoção exige/);
 assert.match(compare(old,'1.2.3',{tier:'extension'}).errors.join(' '),/migração de tier proibida/);
 assert.match(classifyContractChanges({components:[component()]},{components:[component(),component()]},
 new Map([['Button',old]]),new Map([['Button',old]])).errors.join(' '),/nome duplicado/);
 assert.match(compare(old,'1.2.3',{status:'pending'}).errors.join(' '),/metadados de versão/);
});
