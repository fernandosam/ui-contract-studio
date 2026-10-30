import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdtempSync,readFileSync,readdirSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createExecutionRecorder} from '../scripts/lib/execution-events.mjs';
import {selectPiSemanticCandidates,PI_SELECTION_POLICY} from '../scripts/lib/pi-semantic-selection.mjs';
import {recordPiDecision,buildPiDecisionRecord,validatePiDecisionRecord} from '../scripts/lib/pi-decision-records.mjs';

const uuid='f9b1b6d2-ea18-4eea-8f78-b1712fdced1f';
const stable=type=>({type,version:'1.2.3',fingerprint:'a'.repeat(64),
 lifecycle:'stable',stability:'stable',validation:{static:'approved',e2e:'not-recorded'}});
const contracts=[stable('Button'),stable('Link')];
const profiles=[
 {component:'Button',purpose:'Acionar operação local',whenUse:['Acionar operação local'],
  whenNotUse:['Navegar para outra página: prefira Link']},
 {component:'Link',purpose:'Navegar para outra página',whenUse:['Navegar para outra página'],
  whenNotUse:['Executar operação destrutiva']},
];
const decision=(requirement='navegar para outra página',override={})=>{
 const result=selectPiSemanticCandidates({requirement,contracts,profiles,limit:10});
 return buildPiDecisionRecord({source:'pi-select',executionId:uuid,result,contracts,profiles,...override});
};
const withRoot=fn=>{
 const root=mkdtempSync(join(tmpdir(),'e10-decisions-'));
 try{return fn(root)}finally{rmSync(root,{recursive:true,force:true})}
};
const path=root=>join(root,'reports/pi-execution/decisions.jsonl');
const read=root=>readFileSync(path(root),'utf8').trim().split('\n').map(JSON.parse);

test('recommended decision references reviewed contract fingerprint and numbered semantic evidence',()=>{
 const entry=decision();
 assert.equal(entry.outcome,'recommended');
 assert.equal(entry.selectedContract.type,'Link');
 assert.equal(entry.selectedContract.version,'1.2.3');
 assert.equal(entry.selectedContract.fingerprint,'a'.repeat(64));
 assert.deepEqual(entry.policy,PI_SELECTION_POLICY);
 assert.equal(entry.authority,'advisory-only');
 const chosen=entry.candidates.find(c=>c.contract.type==='Link');
 assert.equal(chosen.criteria.stableEligible,true);
 assert.equal(chosen.criteria.hasPositiveEvidence,true);
 assert.ok(chosen.evidence.some(e=>e.field==='whenUse'&&e.index===0&&e.matchedCount>0));
 assert.match(chosen.profileDigest,/^[a-f0-9]{64}$/);
 const avoided=entry.candidates.find(c=>c.contract.type==='Button');
 assert.equal(avoided.disposition,'avoid');
 assert.equal(avoided.criteria.negativeVeto,true);
 assert.ok(avoided.evidence.some(e=>e.field==='whenNotUse'));
 assert.equal(validatePiDecisionRecord(entry),true);
});

test('ambiguous and unmatched requests record abstention without claiming an admitted selection',()=>{
 const same=[stable('Link'),stable('OtherLink')];
 const docs=[profiles[1],{...profiles[1],component:'OtherLink'}];
 const tied=selectPiSemanticCandidates({requirement:'navegar para outra página',contracts:same,profiles:docs});
 const ambiguous=buildPiDecisionRecord({source:'pi-context',executionId:uuid,
  result:tied,contracts:same,profiles:docs});
 assert.equal(ambiguous.outcome,'ambiguous');
 assert.equal(ambiguous.selectedContract,null);
 assert.equal(validatePiDecisionRecord(ambiguous),true);
 const none=decision('gestão bancária complexa');
 assert.equal(none.outcome,'no-match');
 assert.equal(none.selectedContract,null);
 assert.equal(validatePiDecisionRecord(none),true);
});

test('does not persist text of requirements, excerpts, terms or secrets, even in memory records',()=>{
 const secret='SENHA_CLIENTE_PRIVADA_123';
 const result=selectPiSemanticCandidates({requirement:'navegar para outra página',contracts,profiles});
 result.requirement=secret;
 result.terms=[secret];
 result.candidates[0].evidence[0].userNote=secret;
 const entry=buildPiDecisionRecord({source:'pi-select',executionId:uuid,result,contracts,profiles});
 const serialized=JSON.stringify(entry);
 assert.ok(!serialized.includes(secret));
 assert.ok(!serialized.includes('Navegar para outra página'));
 assert.ok(!serialized.includes('Acionar operação local'));
 assert.ok(!serialized.includes('SENHA'));
 assert.equal(validatePiDecisionRecord({...entry,prompt:secret}),false);
 assert.equal(validatePiDecisionRecord({...entry,candidates:[{...entry.candidates[0],raw:secret}]}),false);
});

test('fails closed when evidence cannot be located or contract projection is missing',()=>{
 const result=selectPiSemanticCandidates({requirement:'navegar para outra página',contracts,profiles});
 const broken=structuredClone(result);
 broken.candidates[0].evidence[0].excerpt='no matching documentation';
 assert.throws(()=>buildPiDecisionRecord({source:'pi-select',executionId:uuid,
   result:broken,contracts,profiles}),/not backed/);
 assert.throws(()=>buildPiDecisionRecord({source:'pi-select',executionId:uuid,
   result,contracts:[],profiles}),/reviewed projection/);
 assert.throws(()=>decision(undefined,{executionId:'unverified-user-id'}),/inputs/);
});

test('correlates JSONL decisions and event phases without changing event schema',()=>withRoot(root=>{
 const eventFile='reports/pi-execution/events.jsonl';
 const recorder=createExecutionRecorder({source:'pi-select',executionId:uuid,file:eventFile,root});
 const phase=recorder.start('selection');
 const result=selectPiSemanticCandidates({requirement:'navegar para outra página',contracts,profiles});
 const entry=recordPiDecision({source:'pi-select',executionId:recorder.executionId,
  result,contracts,profiles,file:'reports/pi-execution/decisions.jsonl',root});
 phase.complete({decision:result.status});
 assert.equal(read(root).length,1);
 assert.equal(read(root)[0].decisionId,entry.decisionId);
 const events=readFileSync(join(root,eventFile),'utf8').trim().split('\n').map(JSON.parse);
 assert.equal(events.length,2);
 assert.equal(events[0].executionId,entry.executionId);
 assert.equal(events[1].executionId,entry.executionId);
 assert.ok(events.every(e=>e.schemaVersion===1&&e.type.startsWith('selection.')));
}));

test('opt-in only; never creates directories when decision output is unset',()=>withRoot(root=>{
 const result=selectPiSemanticCandidates({requirement:'navegar para outra página',contracts,profiles});
 const entry=recordPiDecision({source:'pi-select',executionId:uuid,result,contracts,profiles,file:'',root});
 assert.equal(entry.outcome,'recommended');
 assert.equal(existsSync(join(root,'reports')),false);
}));

test('rejects traversal, shared event file, symlinked parent, and unknown metadata',()=>withRoot(root=>{
 const result=selectPiSemanticCandidates({requirement:'navegar para outra página',contracts,profiles});
 const run=(file)=>recordPiDecision({source:'pi-select',executionId:uuid,
  result,contracts,profiles,file,root});
 for(const file of ['../secret.jsonl','reports/pi-execution/../secret.jsonl','reports/other/secret.jsonl'])
   assert.throws(()=>run(file),/path/);
 const previous=process.env.UI_CONTRACT_EVENTS_FILE;
 process.env.UI_CONTRACT_EVENTS_FILE='reports/pi-execution/decisions.jsonl';
 try{assert.throws(()=>run('reports/pi-execution/decisions.jsonl'),/separate/)}
 finally{if(previous===undefined)delete process.env.UI_CONTRACT_EVENTS_FILE;
       else process.env.UI_CONTRACT_EVENTS_FILE=previous}
 const outside=mkdtempSync(join(tmpdir(),'e10-redirect-'));
 try{
  symlinkSync(outside,join(root,'reports'),'dir');
  assert.throws(()=>run('reports/pi-execution/decisions.jsonl'),/symlink/);
  assert.deepEqual(readdirSync(outside),[]);
 }finally{rmSync(outside,{recursive:true,force:true})}
}));

test('pi:select preserves stdout JSON while writing one correlated decision',()=>{
 const output='reports/pi-execution/decision-test-'+randomUUID()+'.jsonl';
 const file=join(process.cwd(),output);
 const env={...process.env,UI_CONTRACT_DECISIONS_FILE:output,
  UI_CONTRACT_EXECUTION_ID:uuid,UI_CONTRACT_EVENTS_FILE:''};
 try{
  const cli=spawnSync(process.execPath,['scripts/select-pi-candidates.mjs',
   '--requirement=Button','--types=Button,Card'],{env,encoding:'utf8'});
  assert.equal(cli.status,0,cli.stderr);
  assert.equal(JSON.parse(cli.stdout).selectedType,'Button');
  const rows=readFileSync(file,'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(rows.length,1);
  assert.equal(rows[0].executionId,uuid);
  assert.equal(rows[0].selectedContract.type,'Button');
  assert.ok(rows.every(validatePiDecisionRecord));
 }finally{rmSync(file,{force:true})}
});

test('pi:context records only semantic choices, and preserves context payload',()=>{
 const output='reports/pi-execution/decision-context-'+randomUUID()+'.jsonl';
 const file=join(process.cwd(),output);
 const env={...process.env,UI_CONTRACT_DECISIONS_FILE:output,
  UI_CONTRACT_EXECUTION_ID:uuid,UI_CONTRACT_EVENTS_FILE:''};
 try{
  const cli=spawnSync(process.execPath,['scripts/select-pi-context.mjs',
    '--types=Button,Card','--requirement=Button','--metadata-only','--stdout'],{env,encoding:'utf8'});
  assert.equal(cli.status,0,cli.stderr);
  const pack=JSON.parse(cli.stdout);
  assert.equal(pack.selection.selectedType,'Button');
  assert.deepEqual(pack.selected.map(x=>x.contract.type),['Button','Card']);
  const rows=readFileSync(file,'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(rows.length,1);
  assert.equal(rows[0].source,'pi-context');
  assert.equal(rows[0].selectedContract.type,'Button');
  assert.equal(rows[0].executionId,uuid);
  assert.equal(validatePiDecisionRecord(rows[0]),true);
 }finally{rmSync(file,{force:true})}
});

test('pi:context with explicit types but no requirement does not fabricate agent reasoning',()=>{
 const output='reports/pi-execution/decision-host-'+randomUUID()+'.jsonl';
 const file=join(process.cwd(),output);
 const env={...process.env,UI_CONTRACT_DECISIONS_FILE:output,
  UI_CONTRACT_EXECUTION_ID:uuid,UI_CONTRACT_EVENTS_FILE:''};
 try{
  const cli=spawnSync(process.execPath,['scripts/select-pi-context.mjs',
    '--types=Button,Card','--metadata-only','--stdout'],{env,encoding:'utf8'});
  assert.equal(cli.status,0,cli.stderr);
  assert.equal(Object.hasOwn(JSON.parse(cli.stdout),'selection'),false);
  assert.equal(existsSync(file),false);
 }finally{rmSync(file,{force:true})}
});
