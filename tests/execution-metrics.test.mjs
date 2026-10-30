import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {validateExecutionEvent} from '../scripts/lib/execution-events.mjs';
import {summarizeExecutionMetrics,summarizeEvaluationQuality} from '../scripts/lib/execution-metrics.mjs';

const executionId='f9b1b6d2-ea18-4eea-8f78-b1712fdced1f';
function pair(source,phase,status,durationMs,details={},startDetails={},timestamp='2026-10-29T12:00:00.000Z') {
  const operationId=randomUUID(),base={schemaVersion:1,executionId,operationId,source,phase,
    timestamp};
  const start={...base,eventId:randomUUID(),sequence:1,type:phase+'.started',status:'started',details:startDetails};
  const end={...base,eventId:randomUUID(),sequence:2,type:phase+'.'+status,status,
    durationMs,details};
  return [start,end];
}

test('aggregates measured latency, known tokens, retries and incomplete operations',()=>{
  const events=[
    ...pair('pi-eval','generation','completed',110,{attempt:1,inputTokens:200,outputTokens:45},{attempt:1}),
    ...pair('pi-eval','generation','failed',500,{attempt:2,reasonCode:'command_failed'},{attempt:2}),
    ...pair('pi-context','selection','completed',20,{selectedCount:1}),
    ...pair('pi-validate','validation','completed',30,{valid:true,issueCount:0}),
    pair('requirements-preview','planning','completed',300,{selectedCount:1})[0],
  ];
  assert.ok(events.every(validateExecutionEvent));
  const metrics=summarizeExecutionMetrics(events);
  assert.equal(metrics.scope.events,9);
  assert.equal(metrics.scope.executions,1);
  assert.deepEqual(metrics.operations,{total:5,completed:3,failed:1,blocked:0,incomplete:1});
  assert.deepEqual(metrics.latencyMs,{samples:4,meanMs:165,p50Ms:30,p95Ms:500,maxMs:500});
  assert.deepEqual(metrics.byPhase.generation.latencyMs,{samples:2,meanMs:305,p50Ms:110,p95Ms:500,maxMs:500});
  assert.deepEqual(metrics.piGenerationAttempts,{total:2,completed:1,failed:1,blocked:0,incomplete:0,repairs:1,unclassified:0});
  assert.deepEqual(metrics.tokens.input,{samples:1,total:200});
  assert.deepEqual(metrics.tokens.output,{samples:1,total:45});
  assert.equal(metrics.contractValidation.passRate,100);
});

test('missing telemetry never becomes zero tokens or zero latency',()=>{
  const empty=summarizeExecutionMetrics([]);
  assert.equal(empty.latencyMs.meanMs,null);
  assert.equal(empty.tokens.input.total,null);
  assert.equal(empty.tokens.output.samples,0);
  assert.equal(empty.contractValidation.passRate,null);
  const missing=summarizeExecutionMetrics(pair('pi-eval','generation','failed',20,{reasonCode:'command_failed'}));
  assert.equal(missing.tokens.input.total,null);
  assert.equal(missing.piGenerationAttempts.unclassified,1);
});

test('rejects unsafe, malformed, duplicated and conflicting events',()=>{
  const samples=pair('pi-eval','generation','completed',100,{attempt:1,inputTokens:25},{attempt:1});
  assert.equal(validateExecutionEvent({...samples[1],details:{prompt:'sensitive'}}),false);
  assert.equal(validateExecutionEvent({...samples[0],details:{inputTokens:3}}),false);
  assert.equal(validateExecutionEvent({...samples[1],details:{attempt:3}}),false);
  assert.equal(validateExecutionEvent({...samples[1],details:{inputTokens:-2}}),false);
  assert.equal(validateExecutionEvent({...samples[1],source:'pi-context'}),false);
  assert.throws(()=>summarizeExecutionMetrics([...samples,samples[1]]),/Duplicate/);
  assert.throws(()=>summarizeExecutionMetrics([samples[0],{...samples[1],details:{attempt:2}}]),/Conflicting/);
  assert.throws(()=>summarizeExecutionMetrics([{...samples[0],details:{prompt:'injection'}}]),/Invalid/);
});

test('quality aggregates measured outcomes and excludes not-run',()=>{
  const quality=summarizeEvaluationQuality({executedAt:'2026-10-29T12:00:00.000Z',results:[
    {status:'pass',firstPass:true,repairAttempted:false},
    {status:'pass',firstPass:false,repairAttempted:true,repaired:true},
    {status:'fail',firstPass:false,repairAttempted:true,repaired:false},
    {status:'not-run'},
  ]});
  assert.equal(quality.executed,3);
  assert.equal(quality.notRun,1);
  assert.equal(quality.firstPassRatePct,33.33);
  assert.equal(quality.finalPassRatePct,66.67);
  assert.equal(quality.repairSuccessRatePct,50);
  assert.equal(summarizeEvaluationQuality({executedAt:'2026-10-29T12:00:00.000Z',results:[{status:'not-run'}]}).finalPassRatePct,null);
  assert.throws(()=>summarizeEvaluationQuality({executedAt:'2026-10-29T12:00:00.000Z',results:[{status:'fail',repaired:true}]}),/Inconsistent/);
});

test('CLI prints safe offline JSON and never produces files or model calls',()=>{
  const root=mkdtempSync(join(tmpdir(),'e10-metrics-'));
  try {
    mkdirSync(join(root,'reports/pi-execution'),{recursive:true});
    const lines=pair('pi-eval','generation','completed',40,{attempt:1,inputTokens:12,outputTokens:9},{attempt:1},new Date().toISOString());
    writeFileSync(join(root,'reports/pi-execution/events.jsonl'),lines.map(e=>JSON.stringify(e)).join('\n')+'\n');
    writeFileSync(join(root,'reports/pi-evaluation.json'),JSON.stringify({executedAt:'2026-10-29T12:00:00.000Z',
      results:[{status:'pass',firstPass:true},{status:'not-run'}]}));
    const script=resolve('scripts/report-pi-metrics.mjs');
    const run=spawnSync(process.execPath,[script,'--include-evaluation','--execution-id='+executionId],
      {cwd:root,encoding:'utf8',timeout:5_000});
    assert.equal(run.status,0,run.stderr);
    const output=JSON.parse(run.stdout);
    assert.equal(output.tokens.input.total,12);
    assert.equal(output.evaluationQuality.finalPassRatePct,100);
    assert.equal(output.evaluationQuality.notRun,1);
    assert.doesNotMatch(run.stdout,/prompt|scenario ID|model output/i);
    const invalid=spawnSync(process.execPath,[script,'--file=../private.jsonl'],{cwd:root,encoding:'utf8',timeout:5_000});
    assert.equal(invalid.status,2);
    assert.doesNotMatch(invalid.stderr,/private.jsonl/);
  } finally {rmSync(root,{recursive:true,force:true});}
});
