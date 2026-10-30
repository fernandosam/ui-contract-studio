#!/usr/bin/env node
/** E11: opt-in reliability/load/concurrency gates over the existing offline benchmark. */
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {main as runBenchmark,SCENARIOS} from './benchmark-e11.mjs';

const scenarios=Object.keys(SCENARIOS);
export const PROFILES=Object.freeze({
  smoke:Object.freeze({
    iterations:5,warmup:0,concurrency:[1,4],
    scenarios:['select-narrow','validate-screen'],timeoutMs:30000,
    p95MaxMs:25000,minThroughputPerSecond:0.05
  }),
  load:Object.freeze({
    iterations:20,warmup:2,concurrency:[1,2,4],
    scenarios,timeoutMs:30000,
    p95MaxMs:25000,minThroughputPerSecond:0.10
  }),
  stress:Object.freeze({
    iterations:20,warmup:2,concurrency:[1,4,8],
    scenarios:['select-wide','context-real-schema','plan-rich'],timeoutMs:30000,
    p95MaxMs:30000,minThroughputPerSecond:0.10
  })
});
const referencePattern=/^benchmarks\/baselines\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}\.json$/;
export function parseLoadArgs(argv) {
  let profile='load',compare=null,help=false;
  const seen=new Set();
  for(const arg of argv) {
    if(arg==='--help'){help=true;continue;}
    const match=/^--(profile|compare)=(.+)$/.exec(arg);
    if(!match || seen.has(match[1]))throw Error('Unknown or repeated load argument');
    seen.add(match[1]);
    if(match[1]==='profile') {
      if(!Object.hasOwn(PROFILES,match[2]))throw Error('Unknown load profile');
      profile=match[2];
    }else{
      if(!referencePattern.test(match[2])||match[2].includes('..'))throw Error('Unsafe comparison path');
      compare=match[2];
    }
  }
  return {profile,compare,help};
}
const validPositive=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

/** Pure verifier: reject incomplete, spoofed or unmapped results before applying budgets. */
export function evaluateLoadReport(report,profileName='load') {
  if(!Object.hasOwn(PROFILES,profileName))throw Error('Unknown load profile');
  const profile=PROFILES[profileName],violations=[];
  if(!report||typeof report!=='object')return {passed:false,violations:['report_missing'],compared:false};
  if(report.schemaVersion!==1||report.kind!=='offline-cli-e11')
    violations.push('report_schema');
  if(report.status!=='complete')violations.push('report_incomplete');
  const cfg=report.config;
  if(!cfg||cfg.iterations!==profile.iterations||cfg.warmup!==profile.warmup||
     cfg.timeoutMs!==profile.timeoutMs||!same(cfg.concurrency,profile.concurrency)||
     !same(cfg.scenarios,profile.scenarios))violations.push('workload_mismatch');
  if(!report.environment||typeof report.environment.node!=='string'||
     !/^[a-f0-9]{40}$/.test(report.environment.sourceRevision??''))
    violations.push('revision_unavailable');
  const expected=new Set(profile.scenarios.flatMap(s=>profile.concurrency.map(c=>s+':'+c)));
  const rows=Array.isArray(report.results)?report.results:[];
  if(rows.length!==expected.size)violations.push('row_count');
  const seen=new Set();
  for(const row of rows) {
    if(!row||typeof row!=='object'){violations.push('invalid_row');continue;}
    const key=row.scenario+':'+row.concurrency;
    if(!expected.has(key)||seen.has(key)){violations.push('unexpected_or_duplicate_row:'+key);continue;}
    seen.add(key);
    if(row.attempts!==profile.iterations||row.succeeded!==profile.iterations||
       row.failed!==0||row.warmupFailures!==0||row.errorRate!==0||
       Object.values(row.failures??{}).some(n=>n!==0))
      violations.push('failure_or_missing_attempt:'+key);
    if(!validPositive(row.elapsedMs))violations.push('invalid_elapsed:'+key);
    const lat=row.latencyMs;
    if(!lat||!validPositive(lat.p95)||!validPositive(lat.p50)||
       !validPositive(lat.p99)||lat.p50>lat.p95||lat.p95>lat.p99)
      violations.push('invalid_latency:'+key);
    else if(lat.p95>profile.p95MaxMs)
      violations.push('p95_budget_exceeded:'+key);
    if(!validPositive(row.throughputPerSecond))
      violations.push('invalid_throughput:'+key);
    else if(row.throughputPerSecond<profile.minThroughputPerSecond)
      violations.push('throughput_floor_breached:'+key);
  }
  for(const key of expected)if(!seen.has(key))violations.push('missing_row:'+key);
  const comparison=report.comparison;
  if(comparison!==undefined){
    if(comparison?.comparable!==true||!Array.isArray(comparison.regressions))
      violations.push('comparison_invalid');
    else if(comparison.regressions.length)violations.push('baseline_regression');
  }
  return {passed:violations.length===0,violations,
    compared:comparison?.comparable===true,
    limits:{maxErrorRate:0,p95MaxMs:profile.p95MaxMs,
      minThroughputPerSecond:profile.minThroughputPerSecond,
      maxChildDurationMs:profile.timeoutMs}};
}
export async function main(argv=process.argv.slice(2)) {
  const {profile:profileName,compare,help}=parseLoadArgs(argv);
  if(help){
    console.log('E11: node scripts/run-e11-load.mjs [--profile=smoke|load|stress] [--compare=benchmarks/baselines/approved.json]');
    return;
  }
  const profile=PROFILES[profileName];
  const output='reports/performance/e11-'+profileName+'.json';
  const args=[
    '--iterations='+profile.iterations,
    '--warmup='+profile.warmup,
    '--concurrency='+profile.concurrency.join(','),
    '--scenarios='+profile.scenarios.join(','),
    '--timeout-ms='+profile.timeoutMs,
    '--out='+output
  ];
  if(compare)args.push('--compare='+compare);
  await runBenchmark(args);
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const report=JSON.parse(readFileSync(resolve(root,output),'utf8'));
  const assessment=evaluateLoadReport(report,profileName);
  console.log('E11 '+profileName+' gate: '+(assessment.passed?'PASS':'FAIL')+
    ' | compared with approved baseline: '+assessment.compared+
    ' | results: '+output);
  if(!assessment.passed){
    for(const reason of assessment.violations)console.error('E11 gate violation: '+reason);
    process.exitCode=1;
  }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(error=>{console.error('E11 load suite failed: '+(error instanceof Error?error.message:'unknown error'));process.exitCode=1;});
}
