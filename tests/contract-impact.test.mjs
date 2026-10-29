import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {analyzeContractImpact,impactMarkdown} from '../scripts/lib/contract-impact.mjs';

function fixture(callback) {
  const root=mkdtempSync(join(tmpdir(),'e07-impact-'));
  const put=(path,value)=>{
    const full=join(root,path);
    mkdirSync(dirname(full),{recursive:true});
    writeFileSync(full,typeof value==='string'?value:JSON.stringify(value));
  };
  const spec=types=>({root:'a',elements:Object.fromEntries(types.map(([id,type,props={},on={}])=>
    [id,{type,props,on,children:[]}]))});
  for(const dir of ['src/ui-screens','pi-catalog/examples','pi-catalog/experimental-examples',
    'src/ui-catalog/extensions/composites/templates','src/ui-catalog/extensions/components']) {
    mkdirSync(join(root,dir),{recursive:true});
  }
  put('src/ui-screens/login.json',spec([
    ['a','Login01'],['b','Button',{label:'Save'},{press:{action:'buttonClick'}}],
    ['c','Text',{text:'Card is only text'}]]));
  put('pi-catalog/examples/Button.json',spec([['a','Button',{disabled:false}]]));
  put('pi-catalog/experimental-examples/Flow.json',spec([['a','Flow']]));
  put('src/ui-catalog/extensions/composites/templates/login.json',
    spec([['a','Card',{title:'Welcome'}],['b','Input',{label:'Email'}]]));
  put('src/ui-catalog/extensions/composites/templates/flow.json',
    spec([['a','Login01']]));
  put('src/ui-catalog/extensions/composites/generated-manifest.json',{
    components:[{name:'Login01',template:'login.json'},{name:'Flow',template:'flow.json'}]});
  put('src/ui-catalog/composition-policy.json',{
    primitiveExtensions:[],reactComposites:['DataTable']});
  put('src/ui-catalog/extensions/components/data-table.tsx',
    "import { Button } from '@/components/ui/button'; export const DataTable = Button;");
  put('pi-catalog/examples/DataTable.json',spec([['a','DataTable']]));
  const reviewed=['Button','Card','Input','Login01','Flow','DataTable'].map(name=>({
    name,version:'1.0.0',stability:'stable',status:'approved',
    semanticFingerprint:'a'.repeat(64)}));
  put('src/ui-catalog/contracts.lock.json',{components:reviewed});
  put('pi-catalog/contracts.json',{components:reviewed.map(x=>({
    type:x.name,version:x.version,stability:x.stability,lifecycle:'stable',
    fingerprint:x.semanticFingerprint}))});
  put('pi-catalog/props-json-schema.json',{types:Object.fromEntries(reviewed.map(x=>[x.name,{}]))});
  try{return callback({root,put,spec});}finally{rmSync(root,{recursive:true,force:true});}
}
const changed=(name,level='major',details=[])=>({name,level,reason:'fixture change',
  previous:'1.0.0',version:'2.0.0',details});

test('direct typed consumers include node ID and concrete property/event paths',()=>fixture(({root})=>{
  const report=analyzeContractImpact({root,changes:[changed('Button','major',[
    {category:'property',path:'props.label',kind:'removed'},
    {category:'event',path:'events.press',kind:'removed'}])]});
  assert.equal(report.valid,true,report.errors.join('; '));
  const button=report.contracts[0];
  const ui=button.consumers.find(c=>c.file==='src/ui-screens/login.json' && c.nodeId==='b');
  assert.deepEqual(ui.matchedPaths,['events.press','props.label']);
  assert.equal(ui.relationship,'direct');
  assert.equal(button.counts.examples,2); // Button example + DataTable React dependency
  assert.ok(button.consumers.some(c=>c.reference==='DataTable' &&
    c.relationship==='transitive' && c.via.join('>')==='DataTable>Button'));
  assert.equal(report.totals.piExposed,1);
}));

test('declarative dependency chains reach nested composition users and do not infer string mentions',()=>fixture(({root})=>{
  const card=analyzeContractImpact({root,changes:[changed('Card')]}).contracts[0];
  const screen=card.consumers.find(c=>c.category==='screens');
  assert.deepEqual(screen.via,['Login01','Card']);
  assert.equal(screen.nodeId,'a');
  assert.ok(card.consumers.some(c=>c.file==='pi-catalog/experimental-examples/Flow.json' &&
    c.via.join('>')==='Flow>Login01>Card'));
  assert.ok(!card.consumers.some(c=>c.nodeId==='c'));
  assert.ok(card.consumers.some(c=>c.relationship==='direct' &&
    c.file.endsWith('/login.json')));
}));

test('changed composition definition is included even without instances',()=>fixture(({root})=>{
  const output=analyzeContractImpact({root,changes:[changed('Login01','minor')]});
  assert.ok(output.contracts[0].consumers.some(x=>x.relationship==='definition' &&
    x.file.endsWith('/login.json')));
  assert.equal(output.contracts[0].priority,'medium');
  assert.match(impactMarkdown(output),/Login01/);
  assert.match(impactMarkdown(output),/src\/ui-screens\/login.json#a/);
}));

test('Pi projection drift is reported, never treated as approval',()=>fixture(({root,put})=>{
  put('pi-catalog/contracts.json',{components:[]});
  const out=analyzeContractImpact({root,changes:[changed('Card')]});
  assert.equal(out.contracts[0].pi.exposure,'not-published');
  assert.match(out.diagnostics.join(';'),/missing from Pi projection/);
  assert.equal(out.contracts[0].reviewRequired,true);
}));

test('malformed consumer specs fail visibly instead of reporting false zero impact',()=>fixture(({root,put})=>{
  put('src/ui-screens/invalid.json',{message:'Card'});
  const out=analyzeContractImpact({root,changes:[changed('Card')]});
  assert.equal(out.valid,false);
  assert.match(out.errors.join(';'),/Invalid JSON UI spec/);
}));

test('upstream SemVer failure remains visible in advisory impact output',()=>fixture(({root})=>{
  const out=analyzeContractImpact({root,changes:[],valid:false,upstreamErrors:['major bump required']});
  assert.equal(out.valid,false);
  assert.deepEqual(out.errors,['major bump required']);
  assert.match(impactMarkdown(out),/major bump required/);
}));
