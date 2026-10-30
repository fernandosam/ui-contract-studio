#!/usr/bin/env node
/** E10 offline trends: JSON / CSV / standalone HTML, stdout only. */
import {readExecutionEvents,readPiEvaluationReport,validEventsFilename,DEFAULT_EVENTS_FILE} from './lib/execution-report-input.mjs';
import {summarizeExecutionTrends,executionTrendsCsv,TREND_PERIODS} from './lib/execution-trends.mjs';
import {summarizeEvaluationQuality} from './lib/execution-metrics.mjs';
import {renderExecutionTrendsHtml} from './lib/execution-dashboard.mjs';

const args=process.argv.slice(2);
const options=new Map();
let malformed=false;
for(const arg of args){
  if(arg==='--include-evaluation'){
    if(options.has('include-evaluation')) malformed=true;
    options.set('include-evaluation',true);
    continue;
  }
  const match=/^--(file|period|limit|format)=(.+)$/.exec(arg);
  if(!match||options.has(match[1])) {malformed=true;continue;}
  options.set(match[1],match[2]);
}
const file=options.get('file')??DEFAULT_EVENTS_FILE;
const period=options.get('period')??'day';
const limitText=options.get('limit')??'30';
const limit=/^[1-9][0-9]{0,2}$/.test(limitText)?Number(limitText):NaN;
const format=options.get('format')??'json';
if(malformed||!validEventsFilename(file)||!TREND_PERIODS.includes(period)||
    !Number.isSafeInteger(limit)||limit>365||!['json','csv','html'].includes(format)){
  console.error('Usage: npm run pi:trends -- [--file=reports/pi-execution/events.jsonl] [--period=day|week|month] [--limit=30] [--format=json|csv|html] [--include-evaluation]');
  process.exit(2);
}
try{
  const events=readExecutionEvents({file,explicit:options.has('file')});
  const report=summarizeExecutionTrends(events,{period,limit});
  const evaluationQuality=options.has('include-evaluation')
    ?summarizeEvaluationQuality(readPiEvaluationReport()):null;
  const output=format==='csv'?executionTrendsCsv(report)
    :format==='html'?renderExecutionTrendsHtml(report,{evaluationQuality})
    :JSON.stringify({...report,evaluationQuality},null,2)+'\n';
  process.stdout.write(output);
}catch{
  // Neither paths nor untrusted source content are reflected in errors.
  console.error('E10 trends unavailable: source invalid, incomplete or inaccessible.');
  process.exitCode=1;
}
