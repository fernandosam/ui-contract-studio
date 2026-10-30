import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {summarizeExecutionTrends,executionTrendsCsv} from '../scripts/lib/execution-trends.mjs';
import {renderExecutionTrendsHtml} from '../scripts/lib/execution-dashboard.mjs';
import {readExecutionEvents} from '../scripts/lib/execution-report-input.mjs';

const executionId=randomUUID();
function pair(timestamp,{source='pi-eval',phase='generation',status='completed',durationMs=40,
  details={},startDetails={},terminalTime=timestamp}={}){
  const operationId=randomUUID();
  const base={schemaVersion:1,executionId,operationId,source,phase};
  return [
    {...base,eventId:randomUUID(),sequence:1,timestamp,type:phase+'.started',
      status:'started',details:startDetails},
    {...base,eventId:randomUUID(),sequence:2,timestamp:terminalTime,type:phase+'.'+status,
      status,durationMs,details},
  ];
}

test('UTC buckets, cross-midnight starts, absent dates and bounded latest-period window',()=>{
  const events=[
    ...pair('2026-10-26T23:59:59.000Z',{terminalTime:'2026-10-27T00:02:00.000Z',
      details:{attempt:1,inputTokens:22,outputTokens:11},startDetails:{attempt:1}}),
    ...pair('2026-10-28T08:00:00.000Z',{status:'failed',details:{reasonCode:'command_failed'}}),
    pair('2026-11-02T12:00:00.000Z')[0],
  ];
  const daily=summarizeExecutionTrends(events);
  assert.deepEqual(daily.series.map(x=>x.period),['2026-10-26','2026-10-28','2026-11-02']);
  assert.equal(daily.series[0].operations.total,1);
  assert.equal(daily.series[0].tokens.input.total,22);
  assert.equal(daily.series[1].operations.failed,1);
  assert.equal(daily.series[1].tokens.input.total,null);
  assert.equal(daily.series[2].operations.incomplete,1);
  assert.equal(daily.coverage.observedPeriods,3);
  const weekly=summarizeExecutionTrends(events,{period:'week',limit:1});
  assert.deepEqual(weekly.series.map(x=>x.period),['2026-11-02']);
  assert.equal(weekly.coverage.olderPeriodsOmitted,true);
  assert.equal(weekly.summary.operations.total,1);
  assert.equal(weekly.scope.totalSourceEvents,events.length);
  const monthly=summarizeExecutionTrends(events,{period:'month'});
  assert.deepEqual(monthly.series.map(x=>x.period),['2026-10','2026-11']);
});

test('empty and incomplete samples remain unknown; no fabricated quality',()=>{
  const empty=summarizeExecutionTrends([]);
  assert.equal(empty.collectionStatus,'no-events');
  assert.deepEqual(empty.series,[]);
  assert.equal(empty.summary.latencyMs.p95Ms,null);
  assert.equal(empty.summary.tokens.input.total,null);
  const single=summarizeExecutionTrends([pair('2026-10-29T08:00:00.000Z')[0]]);
  assert.equal(single.series[0].operations.incomplete,1);
  assert.equal(single.series[0].latencyMs.samples,0);
  assert.equal(single.series[0].tokens.input.total,null);
  assert.equal(single.series[0].contractValidation.passRate,null);
  const html=renderExecutionTrendsHtml(empty);
  assert.match(html,/Nenhum evento observado/);
  assert.match(html,/N\/D/);
  assert.doesNotMatch(html,/<script[\s>]/i);
});

test('CSV reflects summaries, null becomes blank, no IDs or raw event content appear',()=>{
  const events=pair('2026-10-29T10:00:00.000Z',{
    details:{attempt:1,inputTokens:0,outputTokens:30},startDetails:{attempt:1}});
  const report=summarizeExecutionTrends(events);
  const csv=executionTrendsCsv(report);
  assert.match(csv,/2026-10-29,1,1,0,0,0,1,40,40,40,1,0,1,0,1,30,/);
  assert.doesNotMatch(csv,new RegExp(executionId));
  const html=renderExecutionTrendsHtml(report,{
    evaluationQuality:{evidenceTime:'2026-10-29T11:00:00.000Z',executed:1,notRun:2,finalPassRatePct:100},
  });
  assert.match(html,/Content-Security-Policy/);
  assert.match(html,/Fotografia isolada/);
  assert.match(html,/Não executados/);
  assert.doesNotMatch(html,new RegExp(executionId));
  assert.doesNotMatch(html,/https?:\/\//);
  assert.doesNotMatch(html,/<script[\s>]/i);
});

test('rejects malformed, duplicate and conflicting data before applying window',()=>{
  const events=pair('2026-10-29T00:00:00.000Z');
  assert.throws(()=>summarizeExecutionTrends([...events,{...events[0],details:{prompt:'private'}}]),/Invalid/);
  assert.throws(()=>summarizeExecutionTrends([...events,events[1]]),/Duplicate/);
  assert.throws(()=>summarizeExecutionTrends(events,{limit:366}),/limit/);
  assert.throws(()=>summarizeExecutionTrends(events,{period:'quarter'}),/period/);
});

test('CLI offers independent JSON / CSV / HTML stdout with no writes or paid Pi calls',()=>{
  const root=mkdtempSync(join(tmpdir(),'e10-trends-'));
  try{
    mkdirSync(join(root,'reports/pi-execution'),{recursive:true});
    const observedAt=new Date().toISOString();
    const events=pair(observedAt,{
      details:{attempt:1,inputTokens:20},startDetails:{attempt:1}});
    writeFileSync(join(root,'reports/pi-execution/events.jsonl'),
      events.map(event=>JSON.stringify(event)).join('\n')+'\n');
    const script=resolve('scripts/report-pi-trends.mjs');
    const invoke=(...args)=>spawnSync(process.execPath,[script,...args],
      {cwd:root,encoding:'utf8',timeout:5_000});
    const json=invoke('--period=week');
    assert.equal(json.status,0,json.stderr);
    const report=JSON.parse(json.stdout);
    const observedDate=new Date(observedAt);
    const monday=new Date(Date.UTC(observedDate.getUTCFullYear(),observedDate.getUTCMonth(),observedDate.getUTCDate()));
    monday.setUTCDate(monday.getUTCDate()-(monday.getUTCDay()+6)%7);
    assert.equal(report.series[0].period,monday.toISOString().slice(0,10));
    assert.equal(report.series[0].tokens.input.total,20);
    assert.equal(report.evaluationQuality,null);
    const csv=invoke('--format=csv');
    assert.equal(csv.status,0,csv.stderr);
    assert.match(csv.stdout,/^period,operations,completed/);
    const html=invoke('--format=html');
    assert.equal(html.status,0,html.stderr);
    assert.match(html.stdout,/<!doctype html>/);
    assert.doesNotMatch(html.stdout,new RegExp(executionId));
    const invalid=invoke('--file=../secret.jsonl');
    assert.equal(invalid.status,2);
    assert.doesNotMatch(invalid.stderr,/secret.jsonl/);
    const missing=invoke('--file=reports/pi-execution/absent.jsonl');
    assert.equal(missing.status,1);
    assert.doesNotMatch(missing.stderr,/absent.jsonl/);
  }finally{rmSync(root,{recursive:true,force:true});}
});

test('reader refuses symlinked local report sources before reading',()=>{
  const root=mkdtempSync(join(tmpdir(),'e10-trends-safe-'));
  try{
    mkdirSync(join(root,'reports/pi-execution'),{recursive:true});
    writeFileSync(join(root,'private.jsonl'),'private');
    symlinkSync(join(root,'private.jsonl'),join(root,'reports/pi-execution/events.jsonl'));
    assert.throws(()=>readExecutionEvents({root}),/Unsafe/);
  }finally{rmSync(root,{recursive:true,force:true});}
});
