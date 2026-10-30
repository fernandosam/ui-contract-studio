#!/usr/bin/env node
/** E10 offline metrics, emitted only to stdout; no paid Pi execution or automatic upload. */
import {readExecutionEvents,readPiEvaluationReport} from './lib/execution-report-input.mjs';
import {summarizeExecutionMetrics,summarizeEvaluationQuality} from './lib/execution-metrics.mjs';

const args=process.argv.slice(2);
const flag=name=>args.find(x=>x.startsWith('--'+name+'='))?.slice(name.length+3);
const file=flag('file')??'reports/pi-execution/events.jsonl';
const explicit=flag('file')!==undefined;
const filter=flag('execution-id');
const includeEvaluation=args.includes('--include-evaluation');
if(args.some(x=>!x.startsWith('--file=')&&!x.startsWith('--execution-id=')&&x!=='--include-evaluation')||
   !/^reports\/pi-execution\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}\.jsonl$/.test(file)||file.includes('..')){
  console.error('Usage: npm run pi:metrics -- [--file=reports/pi-execution/events.jsonl] [--execution-id=UUID] [--include-evaluation]');
  process.exit(2);
}
try {
  const events=readExecutionEvents({file,explicit});
  const metrics=summarizeExecutionMetrics(events,{executionId:filter});
  const quality=includeEvaluation
    ?summarizeEvaluationQuality(readPiEvaluationReport()):null;
  process.stdout.write(JSON.stringify({...metrics,collectionStatus:events.length?'observed':'no-events',
    evaluationQuality:quality},null,2)+'\n');
} catch {
  // Do not echo user-controlled paths, input snippets, or raw exceptions.
  console.error('E10 metrics unavailable: source invalid, incomplete or inaccessible.');
  process.exitCode=1;
}
