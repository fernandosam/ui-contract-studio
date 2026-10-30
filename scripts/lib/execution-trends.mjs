/** Offline UTC trends from the same validated E10 operations as pi:metrics. */
import {summarizeExecutionMetrics} from './execution-metrics.mjs';

export const TREND_PERIODS=Object.freeze(['day','week','month']);
const MAX_PERIODS=365;

function utcPeriod(timestamp,period) {
  const date=new Date(timestamp);
  if(period==='day') return date.toISOString().slice(0,10);
  if(period==='month') return date.toISOString().slice(0,7);
  const monday=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate()-(monday.getUTCDay()+6)%7);
  return monday.toISOString().slice(0,10);
}

function compactMetric(metrics) {
  return {
    operations:metrics.operations,
    latencyMs:metrics.latencyMs,
    byPhase:metrics.byPhase,
    piGenerationAttempts:metrics.piGenerationAttempts,
    tokens:metrics.tokens,
    contractValidation:metrics.contractValidation,
  };
}

/**
 * A cross-midnight operation belongs to its start date. Orphan terminals
 * are still unknown/incomplete and bucketed at their observed timestamp.
 * No empty calendar periods are invented: an absent period is unobserved.
 */
export function summarizeExecutionTrends(events,{period='day',limit=30}={}) {
  if(!TREND_PERIODS.includes(period)) throw new Error('Invalid E10 trend period');
  if(!Number.isSafeInteger(limit)||limit<1||limit>MAX_PERIODS)
    throw new Error('Invalid E10 trend limit');
  // Validate the ENTIRE input first: no ignored malformed record outside the visible window.
  const all=summarizeExecutionMetrics(events);
  const operations=new Map();
  for(const event of events){
    const key=event.executionId+':'+event.operationId;
    let operation=operations.get(key);
    if(!operation){
      operation={start:null,terminal:null,events:[]};
      operations.set(key,operation);
    }
    if(event.status==='started') operation.start=event;
    else operation.terminal=event;
    operation.events.push(event);
  }
  const groups=new Map();
  for(const operation of operations.values()){
    const timestamp=(operation.start??operation.terminal).timestamp;
    const bucket=utcPeriod(timestamp,period);
    if(!groups.has(bucket)) groups.set(bucket,[]);
    groups.get(bucket).push(...operation.events);
  }
  const keys=[...groups.keys()].sort();
  const visible=keys.slice(-limit);
  const series=visible.map(key=>{
    const metrics=summarizeExecutionMetrics(groups.get(key));
    return {period:key,...compactMetric(metrics)};
  });
  const visibleEvents=visible.flatMap(key=>groups.get(key));
  const summary=summarizeExecutionMetrics(visibleEvents);
  return {
    schemaVersion:1,period,timezone:'UTC',
    collectionStatus:events.length?'observed':'no-events',
    coverage:{
      observedPeriods:keys.length,displayedPeriods:visible.length,limit,
      olderPeriodsOmitted:keys.length>visible.length,
      firstObservedPeriod:keys[0]??null,lastObservedPeriod:keys.at(-1)??null,
      note:'Only periods with observed events appear. Missing dates are unknown, not zero. An operation belongs to its UTC start period.',
    },
    summary:compactMetric(summary),
    scope:{events:visibleEvents.length,executions:summary.scope.executions,
      totalSourceEvents:all.scope.events},
    series,
    qualityCaveat:'Contract validation is structural, not semantic, UX, visual, accessibility or E2E quality. Pi evaluation snapshots have no automatic execution correlation.',
  };
}

/** CSV is limited to numeric aggregates and fixed UTC bucket labels, never event content. */
export function executionTrendsCsv(report) {
  const header=['period','operations','completed','failed','blocked','incomplete',
    'latency_samples','latency_mean_ms','latency_p50_ms','latency_p95_ms',
    'pi_attempts','pi_repairs','input_token_samples','input_tokens',
    'output_token_samples','output_tokens','validation_pass_rate_pct'];
  const numeric=value=>value===null||value===undefined?'':String(value);
  const rows=report.series.map(bucket=>[
    bucket.period,bucket.operations.total,bucket.operations.completed,
    bucket.operations.failed,bucket.operations.blocked,bucket.operations.incomplete,
    bucket.latencyMs.samples,bucket.latencyMs.meanMs,bucket.latencyMs.p50Ms,
    bucket.latencyMs.p95Ms,bucket.piGenerationAttempts.total,bucket.piGenerationAttempts.repairs,
    bucket.tokens.input.samples,bucket.tokens.input.total,
    bucket.tokens.output.samples,bucket.tokens.output.total,
    bucket.contractValidation.passRate].map(numeric).join(','));
  return [header.join(','),...rows].join('\n')+'\n';
}
