import test from 'node:test';
import assert from 'node:assert/strict';
import {compareReports,parseOptions,percentile,runCommand,SCENARIOS,summarize} from '../scripts/benchmark-e11.mjs';

test('E11 scenarios are fixed, representative and offline',()=>{
  assert.deepEqual(Object.keys(SCENARIOS),[
    'select-narrow','select-wide','context-real-schema','plan-simple','plan-rich','validate-screen'
  ]);
  for(const item of Object.values(SCENARIOS)){
    assert.ok(['node','tsx'].includes(item.command));
    assert.ok(!item.args.some(x=>/eval:pi:run|https?:|--apply|--publish/.test(x)));
  }
});

test('E11 parser bounds workload and rejects arbitrary files or commands',()=>{
  const parsed=parseOptions(['--iterations=30','--concurrency=1,4','--scenarios=select-narrow,validate-screen',
    '--out=reports/performance/staging.json','--compare=benchmarks/baselines/reference.json']);
  assert.equal(parsed.iterations,30);
  assert.deepEqual(parsed.concurrency,[1,4]);
  assert.deepEqual(parsed.scenarios,['select-narrow','validate-screen']);
  for(const arg of [
    '--iterations=0','--iterations=201','--concurrency=0','--concurrency=9',
    '--concurrency=2,2','--scenarios=made-up','--scenarios=plan-rich,plan-rich',
    '--out=../private.json','--out=reports/performance/../other.json',
    '--compare=reports/private.json','--timeout-ms=0','--unknown=1'
  ])assert.throws(()=>parseOptions([arg]),arg);
});

test('E11 nearest-rank percentiles and summaries keep failed samples visible',()=>{
  assert.equal(percentile([],95),null);
  assert.equal(percentile([4,1,2,3,5],50),3);
  assert.equal(percentile([4,1,2,3,5],95),5);
  assert.throws(()=>percentile([1],101));
  const row=summarize('select-narrow',2,[
    {ms:10,reason:null},{ms:30,reason:'timeout'},{ms:20,reason:null}
  ],100,0);
  assert.deepEqual({attempts:row.attempts,succeeded:row.succeeded,failed:row.failed},
    {attempts:3,succeeded:2,failed:1});
  assert.equal(row.errorRate,0.33);
  assert.equal(row.latencyMs.p50,10);
  assert.equal(row.latencyMs.p95,20);
  assert.equal(row.throughputPerSecond,20);
  assert.equal(row.failures.timeout,1);
  const warmup=summarize('plan-simple',1,[],0,1);
  assert.equal(warmup.latencyMs,null);
  assert.equal(warmup.failures.warmup_failed,1);
});

test('E11 runner observes exit, timeout and output budget without retaining output',async()=>{
  const good=await runCommand(['-e','console.log("sensitive-value")'],{timeoutMs:2000});
  assert.equal(good.reason,null);
  assert.ok(good.ms>=0);
  assert.equal(Object.hasOwn(good,'stdout'),false);
  const bad=await runCommand(['-e','process.exit(3)'],{timeoutMs:2000});
  assert.equal(bad.reason,'nonzero_exit');
  const overflow=await runCommand(['-e','process.stdout.write("x".repeat(5000))'],
    {timeoutMs:2000,maxOutputBytes:100});
  assert.equal(overflow.reason,'output_limit');
  const timeout=await runCommand(['-e','setInterval(()=>{},1000)'],{timeoutMs:100});
  assert.equal(timeout.reason,'timeout');
});

const environment={node:'22.0.0',platform:'linux',architecture:'x64',
  cpuModel:'sample-cpu',cpuCount:4,memoryGiB:8,sourceRevision:null};
const config={iterations:20,warmup:2,concurrency:[1],scenarios:['select-narrow'],timeoutMs:30000};
const report=(p95,throughput)=>({
  schemaVersion:1,status:'complete',environment,config,
  results:[{scenario:'select-narrow',concurrency:1,attempts:20,failed:0,
    latencyMs:{p95},throughputPerSecond:throughput}]
});

test('E11 comparison detects regressions and fails closed on incompatible environments',()=>{
  assert.deepEqual(compareReports(report(120,9),report(100,10)).regressions,[]);
  const regression=compareReports(report(130,8),report(100,10));
  assert.deepEqual(regression.regressions.map(x=>x.metric),['p95','throughput']);
  assert.throws(()=>compareReports({...report(120,9),status:'incomplete'},report(100,10)),/Incomplete/);
  assert.throws(()=>compareReports({...report(120,9),environment:{...environment,node:'24.0.0'}},report(100,10)),/mismatch/);
  assert.throws(()=>compareReports({...report(120,9),results:[]},report(100,10)),/scenario set/);
});
