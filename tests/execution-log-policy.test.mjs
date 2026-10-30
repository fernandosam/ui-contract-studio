import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,symlinkSync,readdirSync,rmSync,statSync,utimesSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createExecutionRecorder,validateExecutionEvent} from '../scripts/lib/execution-events.mjs';
import {appendExecutionLogEvent,pruneExecutionLogs,redactSensitiveText,EXECUTION_LOG_POLICY} from '../scripts/lib/execution-log-policy.mjs';
import {readExecutionEvents} from '../scripts/lib/execution-report-input.mjs';

function withRoot(callback){
  const root=mkdtempSync(join(tmpdir(),'e10-policy-'));
  try{return callback(root);}finally{rmSync(root,{recursive:true,force:true});}
}
function paths(root){
  const directory=join(root,'reports/pi-execution');
  mkdirSync(directory,{recursive:true});
  return {directory,target:join(directory,'events.jsonl')};
}
function event(timestamp=new Date().toISOString()){
  return {schemaVersion:1,eventId:randomUUID(),executionId:randomUUID(),
    operationId:randomUUID(),sequence:1,timestamp,source:'pi-select',phase:'selection',
    type:'selection.started',status:'started',details:{}};
}
function read(target){
  return readFileSync(target,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
}

test('diagnostic redaction masks credentials, headers, CPF, query tokens and email',()=>{
  const input='Ana <ana.teste@example.org> CPF 123.456.789-09 password=hunter2 '+
    'Bearer eyJhbGciOiABC api_key="private" ?token=credential';
  const masked=redactSensitiveText(input);
  for(const secret of ['ana.teste@example.org','123.456.789-09','hunter2','eyJhbGciOiABC','private','credential'])
    assert.ok(!masked.includes(secret),secret);
  assert.match(masked,/REDACTED/);
  assert.equal(redactSensitiveText({password:'bad'}),'[REDACTED]');
});

test('writer keeps closed event metadata and does not log untrusted strings',()=>withRoot(root=>{
  const recorder=createExecutionRecorder({source:'pi-select',root,file:'reports/pi-execution/events.jsonl'});
  assert.throws(()=>recorder.start('selection',{email:'a@example.org',password:'secret'}),/sensitive/);
  const op=recorder.start('selection',{candidateCount:1});
  op.complete({decision:'recommended'});
  const {target}=paths(root);
  const content=readFileSync(target,'utf8');
  assert.doesNotMatch(content,/example.org|password|secret/);
  assert.equal(read(target).length,2);
  assert.ok(read(target).every(validateExecutionEvent));
  if(process.platform!=='win32') assert.equal(statSync(target).mode&0o077,0);
}));

test('opt-in writer removes expired records from an active JSONL file',()=>withRoot(root=>{
  const {target}=paths(root);
  const stale=new Date(Date.now()-10*86_400_000).toISOString();
  writeFileSync(target,JSON.stringify(event(stale))+'\n');
  const recorder=createExecutionRecorder({source:'pi-select',root,file:'reports/pi-execution/events.jsonl'});
  recorder.start('selection').complete();
  const events=read(target);
  assert.equal(events.length,2);
  assert.ok(events.every(item=>Date.parse(item.timestamp)>Date.now()-7*86_400_000));
}));

test('writer prunes old E10 JSONL files only, preserving unrelated reports',()=>withRoot(root=>{
  const {directory,target}=paths(root);
  const old=new Date(Date.now()-10*86_400_000);
  for(const name of ['old.jsonl','historical.jsonl']){
    const file=join(directory,name);
    writeFileSync(file,JSON.stringify(event(old.toISOString()))+'\n');
    utimesSync(file,old,old);
  }
  writeFileSync(join(directory,'notes.txt'),'keep');
  const recorder=createExecutionRecorder({source:'pi-select',root,file:'reports/pi-execution/events.jsonl'});
  recorder.start('selection').complete();
  assert.equal(read(target).length,2);
  assert.deepEqual(readdirSync(directory).filter(x=>x.endsWith('.jsonl')),['events.jsonl']);
  assert.ok(readdirSync(directory).includes('notes.txt'));
}));

test('distinct execution IDs have a hard cap, with no partial overflow append',()=>withRoot(root=>{
  const {target}=paths(root);
  for(let i=0;i<EXECUTION_LOG_POLICY.maxExecutionIdsPerFile;i++)
    appendExecutionLogEvent(target,event(),{validate:validateExecutionEvent});
  assert.throws(()=>appendExecutionLogEvent(target,event(),{validate:validateExecutionEvent}),/cardinality/);
  assert.equal(read(target).length,EXECUTION_LOG_POLICY.maxExecutionIdsPerFile);
}));

test('abnormal symlinks and stale writer locks fail closed',()=>withRoot(root=>{
  const {directory,target}=paths(root);
  const other=join(root,'private.jsonl');
  writeFileSync(other,'private');
  symlinkSync(other,target);
  assert.throws(()=>appendExecutionLogEvent(target,event(),{validate:validateExecutionEvent}),/Unsafe/);
  assert.equal(readFileSync(other,'utf8'),'private');
  rmSync(target);
  writeFileSync(join(directory,'.e10-writer.lock'),'manual intervention required');
  assert.throws(()=>appendExecutionLogEvent(target,event(),{validate:validateExecutionEvent}),/lock unavailable/);
  assert.equal(readdirSync(directory).filter(x=>x.endsWith('.jsonl')).length,0);
}));

test('read-only reports exclude expired events; oversized logs fail closed',()=>withRoot(root=>{
  const {target}=paths(root);
  writeFileSync(target,[event(new Date(Date.now()-10*86_400_000).toISOString()),event()]
    .map(item=>JSON.stringify(item)).join('\n')+'\n');
  assert.equal(readExecutionEvents({root}).length,1);
  writeFileSync(target,'x'.repeat(EXECUTION_LOG_POLICY.maxFileBytes+1));
  assert.throws(()=>readExecutionEvents({root}),/Oversized/);
  assert.throws(()=>appendExecutionLogEvent(target,event(),{validate:validateExecutionEvent}),/quota/);
}));



test('retention maintenance previews without writes, then removes expired events',()=>withRoot(root=>{
  const {target}=paths(root);
  const stale=event(new Date(Date.now()-10*86_400_000).toISOString());
  writeFileSync(target,[stale,event()].map(value=>JSON.stringify(value)).join('\n')+'\n');
  const preview=pruneExecutionLogs({root,validate:validateExecutionEvent});
  assert.equal(preview.applied,false);
  assert.equal(preview.expiredEvents,1);
  assert.equal(read(target).length,2);
  const cleaned=pruneExecutionLogs({root,validate:validateExecutionEvent,apply:true});
  assert.equal(cleaned.applied,true);
  assert.equal(read(target).length,1);
  assert.ok(!readdirSync(join(root,'reports/pi-execution')).includes('.e10-writer.lock'));
  const cli=spawnSync(process.execPath,[resolve('scripts/prune-pi-logs.mjs')],
    {cwd:root,encoding:'utf8',timeout:5000});
  assert.equal(cli.status,0,cli.stderr);
  assert.equal(JSON.parse(cli.stdout).expiredEvents,0);
  assert.doesNotMatch(cli.stdout,new RegExp(stale.eventId));
}));
