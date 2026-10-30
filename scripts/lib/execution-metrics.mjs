/** E10 offline aggregation of privacy-minimized events; no model calls or inferred usage. */
import {EXECUTION_PHASES, validateExecutionEvent} from './execution-events.mjs';

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const pct = (numerator, denominator) => denominator ? Number((100 * numerator / denominator).toFixed(2)) : null;
const emptyCounts = () => ({total:0,completed:0,failed:0,blocked:0,incomplete:0});
const emptyMetric = () => ({samples:0,meanMs:null,p50Ms:null,p95Ms:null,maxMs:null});
const percentile = (values, fraction) => values[Math.ceil(values.length * fraction) - 1];
function latency(values) {
  if (!values.length) return emptyMetric();
  const sorted=[...values].sort((a,b)=>a-b);
  return {samples:sorted.length,meanMs:Math.round(sorted.reduce((a,b)=>a+b,0)/sorted.length),
    p50Ms:percentile(sorted,0.5),p95Ms:percentile(sorted,0.95),maxMs:sorted.at(-1)};
}

/**
 * A terminal event with no matching start is UNKNOWN, not successful.
 * A start without terminal is UNKNOWN, not failed (SIGKILL/interrupted I/O).
 * Events from different processes have no global sequence guarantee.
 */
export function summarizeExecutionMetrics(events,{executionId}={}) {
  if (!Array.isArray(events) || events.length>100_000) throw new Error('Invalid E10 event collection');
  if (executionId!==undefined &&
      (typeof executionId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(executionId)))
    throw new Error('Invalid E10 execution filter');
  const seen=new Set(), operations=new Map(), executionIds=new Set();
  let selectedEvents=0;
  for (const event of events) {
    if (!validateExecutionEvent(event)) throw new Error('Invalid E10 event; metrics unavailable');
    if (seen.has(event.eventId)) throw new Error('Duplicate E10 eventId');
    seen.add(event.eventId);
    if (executionId && event.executionId!==executionId) continue;
    selectedEvents++;
    executionIds.add(event.executionId);
    const key=event.executionId+':'+event.operationId;
    let item=operations.get(key);
    if (!item) {
      item={source:event.source,phase:event.phase,start:null,terminal:null};
      operations.set(key,item);
    }
    if (item.source!==event.source||item.phase!==event.phase) throw new Error('Conflicting E10 operation');
    const slot=event.status==='started'?'start':'terminal';
    if (item[slot]) throw new Error('Duplicate E10 operation event');
    item[slot]=event;
  }

  const totals=emptyCounts();
  const byPhase=Object.fromEntries(EXECUTION_PHASES.map(phase=>[phase,{...emptyCounts(),latencyMs:emptyMetric()}]));
  const phaseDurations=Object.fromEntries(EXECUTION_PHASES.map(phase=>[phase,[]]));
  const allDurations=[];
  const attempts={...emptyCounts(),repairs:0,unclassified:0};
  const tokens={input:{samples:0,total:null},output:{samples:0,total:null},
    note:'Only actual Pi usage counters attached to completed or failed generation attempts; missing values are unknown.'};
  const contractValidation={completed:0,failed:0,blocked:0,incomplete:0,passRate:null};
  for(const item of operations.values()) {
    const {source,phase,start,terminal}=item;
    const status=start&&terminal?terminal.status:'incomplete';
    if(start&&terminal&&start.details.attempt!==undefined&&terminal.details.attempt!==undefined&&
      start.details.attempt!==terminal.details.attempt) throw new Error('Conflicting E10 attempt index');
    totals.total++;
    totals[status]++;
    byPhase[phase].total++;
    byPhase[phase][status]++;
    if(status!=='incomplete') {
      const duration=terminal.durationMs;
      phaseDurations[phase].push(duration);
      allDurations.push(duration);
    }
    if(source==='pi-eval'&&phase==='generation'){
      attempts.total++;
      attempts[status]++;
      const attempt=start?.details.attempt??terminal?.details.attempt;
      if(attempt===2) attempts.repairs++;
      if(attempt===undefined) attempts.unclassified++;
      if(status!=='incomplete'&&terminal) {
        for(const [key,field] of [['input','inputTokens'],['output','outputTokens']]) {
          if(Object.hasOwn(terminal.details,field)) {
            tokens[key].samples++;
            tokens[key].total=(tokens[key].total??0)+terminal.details[field];
          }
        }
      }
    }
    if(source==='pi-validate'&&phase==='validation'){
      contractValidation[status]++;
    }
  }
  for(const phase of EXECUTION_PHASES) byPhase[phase].latencyMs=latency(phaseDurations[phase]);
  const valid=contractValidation.completed;
  const executed=valid+contractValidation.failed;
  contractValidation.passRate=pct(valid,executed);
  return {
    schemaVersion:1,
    scope:{executionId:executionId??null,executions:executionIds.size,events:selectedEvents},
    operations:totals,latencyMs:latency(allDurations),byPhase,
    piGenerationAttempts:attempts,tokens,contractValidation,
    qualityCaveat:'Successful Zod/graph validation does not establish semantic, UX, visual or E2E quality.',
  };
}

/** Separate quality source; does not imply that scenarios belong to the selected executionId. */
export function summarizeEvaluationQuality(report) {
  if (!record(report)||!Array.isArray(report.results)||report.results.length>10_000||
      typeof report.executedAt!=='string'||!Number.isFinite(Date.parse(report.executedAt)))
    throw new Error('Invalid Pi evaluation report');
  const counts={passed:0,failed:0,notRun:0,firstPass:0,repairsAttempted:0,repairsSuccessful:0};
  for(const result of report.results) {
    if(!record(result)||!['pass','fail','not-run'].includes(result.status)) throw new Error('Invalid Pi evaluation result');
    if(result.status==='pass') counts.passed++;
    if(result.status==='fail') counts.failed++;
    if(result.status==='not-run') counts.notRun++;
    if(result.status==='not-run'&& (result.firstPass===true||result.repaired===true||result.repairAttempted===true))
      throw new Error('Inconsistent Pi evaluation result');
    if(result.firstPass===true) counts.firstPass++;
    if(result.repairAttempted===true) counts.repairsAttempted++;
    if(result.repaired===true) counts.repairsSuccessful++;
    if(result.repaired===true&&result.status!=='pass') throw new Error('Inconsistent Pi repair result');
  }
  const executed=counts.passed+counts.failed;
  return {
    source:'independent-pi-evaluation-report',
    evidenceTime:report.executedAt,
    scope:'Zod/graph/required-contract acceptance only; not human semantic, visual or usability review',
    total:report.results.length,executed, ...counts,
    firstPassRatePct:pct(counts.firstPass,executed),
    finalPassRatePct:pct(counts.passed,executed),
    repairSuccessRatePct:pct(counts.repairsSuccessful,counts.repairsAttempted),
  };
}
