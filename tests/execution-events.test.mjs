import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createExecutionRecorder,validateExecutionEvent} from '../scripts/lib/execution-events.mjs';

const withRoot=fn=>{
  const root=mkdtempSync(join(tmpdir(),'e10-events-'));
  try {return fn(root);} finally {rmSync(root,{recursive:true,force:true});}
};
const readEvents=root=>readFileSync(join(root,'reports/pi-execution/events.jsonl'),'utf8').trim().split('\n').map(JSON.parse);

test('correlated phases produce structured versioned events',()=>withRoot(root=>{
  const id='f9b1b6d2-ea18-4eea-8f78-b1712fdced1f';
  for(const source of ['requirements-preview','pi-select','pi-validate']){
    const recorder=createExecutionRecorder({source,executionId:id,file:'reports/pi-execution/events.jsonl',root});
    const phase=recorder.start(source==='pi-select'?'selection':source==='pi-validate'?'validation':'planning');
    phase.complete({selectedCount:1});
  }
  const events=readEvents(root);
  assert.equal(events.length,6);
  assert.equal(new Set(events.map(e=>e.executionId)).size,1);
  assert.equal(new Set(events.map(e=>e.eventId)).size,6);
  assert.equal(new Set(events.map(e=>e.operationId)).size,3);
  assert.ok(events.every(validateExecutionEvent));
  assert.equal(events[0].durationMs,undefined);
  assert.equal(events[1].status,'completed');
  assert.equal(events[1].operationId,events[0].operationId);
}));

test('failure and block have safe reasons, not raw errors',()=>withRoot(root=>{
  const recorder=createExecutionRecorder({source:'requirements-preview',file:'reports/pi-execution/events.jsonl',root});
  recorder.start('generation').block('requirements_blocked',{blockerCount:2});
  recorder.start('validation').fail('validation_failed',{issueCount:1,valid:false});
  assert.deepEqual(readEvents(root).filter(e=>e.status!=='started').map(e=>e.details.reasonCode),
    ['requirements_blocked','validation_failed']);
  assert.ok(readEvents(root).every(validateExecutionEvent));
}));

test('rejects sensitive metadata and invalid execution IDs',()=>withRoot(root=>{
  const recorder=createExecutionRecorder({source:'pi-select',root});
  assert.throws(()=>recorder.start('selection',{requirement:'secret'}),/sensitive/);
  assert.throws(()=>recorder.start('selection',{channel:'stable',prompt:'ignore previous'}),/sensitive/);
  const stage=recorder.start('selection');
  assert.throws(()=>stage.complete({reasonCode:'command_failed'}),/Invalid/);
  stage.complete({decision:'no-match',candidateCount:0});
  assert.throws(()=>createExecutionRecorder({source:'pi-select',executionId:'not-uuid',root}),/UUID/);
}));

test('opt-in file rejects traversal and symlink redirects',()=>withRoot(root=>{
  for (const file of ['../leak.jsonl','reports/pi-execution/../leak.jsonl','reports/private/leak.jsonl','reports/pi-execution/a.json'])
    assert.throws(()=>createExecutionRecorder({source:'pi-select',file,root}),/path/);
  mkdirSync(join(root,'reports'),{recursive:true});
  const outside=mkdtempSync(join(tmpdir(),'e10-outside-'));
  try {
    symlinkSync(outside,join(root,'reports/pi-execution'),'dir');
    assert.throws(()=>createExecutionRecorder({source:'pi-select',file:'reports/pi-execution/events.jsonl',root}),/symlink/);
  } finally {rmSync(outside,{recursive:true,force:true});}
}));

test('uncompleted stage writes only a generic failure on process exit',()=>withRoot(root=>{
  const modulePath=resolve('scripts/lib/execution-events.mjs');
  const code='import {createExecutionRecorder} from '+JSON.stringify('file://'+modulePath)+';'+
    "const r=createExecutionRecorder({source:'pi-validate'});r.start('validation');process.exit(1);";
  const result=spawnSync(process.execPath,['--input-type=module','-e',code],{
    env:{...process.env,UI_CONTRACT_EVENTS_FILE:'reports/pi-execution/events.jsonl'},cwd:root,encoding:'utf8'
  });
  assert.equal(result.status,1,result.stderr);
  assert.deepEqual(readEvents(root).map(e=>e.status),['started','failed']);
  assert.equal(readEvents(root)[1].details.reasonCode,'command_failed');
}));

test('tracing never writes JSON to stdout by itself',()=>withRoot(root=>{
  const modulePath=resolve('scripts/lib/execution-events.mjs');
  const code='import {createExecutionRecorder} from '+JSON.stringify('file://'+modulePath)+';'+
    "const r=createExecutionRecorder({source:'pi-context'});r.start('selection').complete({selectedCount:2});process.stdout.write('{\"ok\":true}\\n');";
  const run=spawnSync(process.execPath,['--input-type=module','-e',code],{
    env:{...process.env,UI_CONTRACT_EVENTS_FILE:'reports/pi-execution/events.jsonl'},cwd:root,encoding:'utf8'
  });
  assert.equal(run.status,0,run.stderr);
  assert.deepEqual(JSON.parse(run.stdout),{ok:true});
  assert.equal(readEvents(root).length,2);
}));
