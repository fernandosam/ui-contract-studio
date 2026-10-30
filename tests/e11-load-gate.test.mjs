import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateLoadReport,parseLoadArgs,PROFILES} from '../scripts/run-e11-load.mjs';

const sha='c'.repeat(40);
function sample(profileName='load') {
  const profile=PROFILES[profileName];
  return {
    schemaVersion:1,kind:'offline-cli-e11',status:'complete',
    environment:{node:'22.0.0',sourceRevision:sha},
    config:{iterations:profile.iterations,warmup:profile.warmup,timeoutMs:profile.timeoutMs,
      scenarios:profile.scenarios,concurrency:profile.concurrency},
    results:profile.scenarios.flatMap(scenario=>profile.concurrency.map(concurrency=>({
      scenario,concurrency,attempts:profile.iterations,succeeded:profile.iterations,
      failed:0,warmupFailures:0,errorRate:0,failures:{},elapsedMs:1000,
      throughputPerSecond:1,latencyMs:{p50:80,p95:100,p99:120}
    })))
  };
}
const copy=x=>structuredClone(x);

test('E11 profiles are finite, include real scenarios and cover concurrent stress',()=>{
  assert.deepEqual(Object.keys(PROFILES),['smoke','load','stress']);
  assert.deepEqual(PROFILES.load.concurrency,[1,2,4]);
  assert.deepEqual(PROFILES.stress.concurrency,[1,4,8]);
  assert.equal(PROFILES.load.scenarios.length,6);
  for(const profile of Object.values(PROFILES)){
    assert.ok(profile.iterations>=5&&profile.iterations<=200);
    assert.ok(profile.concurrency.every(c=>c>=1&&c<=8));
    assert.ok(profile.scenarios.length);
    assert.ok(profile.p95MaxMs<=profile.timeoutMs);
  }
});
test('E11 argument parser accepts only profile and approved relative baseline path',()=>{
  assert.deepEqual(parseLoadArgs([]),{profile:'load',compare:null,help:false});
  assert.deepEqual(parseLoadArgs(['--profile=stress','--compare=benchmarks/baselines/approved.json']),
    {profile:'stress',compare:'benchmarks/baselines/approved.json',help:false});
  for(const arg of [
    '--profile=unknown','--iterations=999','--compare=/tmp/ref.json',
    '--compare=benchmarks/baselines/../private.json','--compare=reports/performance/run.json',
    '--compare=benchmarks/baselines/unsafe;node.json','--arbitrary'
  ])assert.throws(()=>parseLoadArgs([arg]),arg);
  assert.throws(()=>parseLoadArgs(['--profile=load','--profile=stress']),/repeated/);
});
test('E11 gates pass only a complete deterministic scenario/concurrency matrix',()=>{
  for(const name of Object.keys(PROFILES)){
    const good=sample(name),answer=evaluateLoadReport(good,name);
    assert.equal(answer.passed,true,name);
    assert.equal(answer.compared,false);
    assert.equal(answer.limits.maxErrorRate,0);
    assert.equal(good.results.length,PROFILES[name].concurrency.length*PROFILES[name].scenarios.length);
    const missing=copy(good);
    missing.results.pop();
    assert.equal(evaluateLoadReport(missing,name).passed,false);
    const duplicated=copy(good);
    duplicated.results[1]=duplicated.results[0];
    assert.ok(evaluateLoadReport(duplicated,name).violations.some(v=>v.startsWith('unexpected_or_duplicate_row')));
  }
});
test('E11 fails closed on errors, missing samples, timeout, workload mismatch and absent provenance',()=>{
  for(const mutation of [
    r=>{r.status='incomplete';},
    r=>{r.results[0].failed=1;r.results[0].succeeded--;r.results[0].failures={timeout:1};},
    r=>{r.results[0].warmupFailures=1;},
    r=>{r.results[0].attempts--;},
    r=>{r.config.concurrency=[1,8];},
    r=>{r.environment.sourceRevision=null;},
    r=>{r.results[0].latencyMs=null;},
    r=>{r.results[0].throughputPerSecond=Number.NaN;},
    r=>{r.results[0].elapsedMs=0;}
  ]){
    const changed=sample();
    mutation(changed);
    assert.equal(evaluateLoadReport(changed).passed,false);
  }
});
test('E11 enforces numeric p95 and throughput floors at their exact boundaries',()=>{
  const good=sample();
  good.results[0].latencyMs={p50:1,p95:PROFILES.load.p95MaxMs,p99:PROFILES.load.p95MaxMs};
  good.results[0].throughputPerSecond=PROFILES.load.minThroughputPerSecond;
  assert.equal(evaluateLoadReport(good).passed,true);
  const slow=copy(good);
  slow.results[0].latencyMs.p95+=0.01;
  slow.results[0].latencyMs.p99+=0.01;
  assert.ok(evaluateLoadReport(slow).violations.includes('p95_budget_exceeded:select-narrow:1'));
  const weak=copy(good);
  weak.results[0].throughputPerSecond-=0.01;
  assert.ok(evaluateLoadReport(weak).violations.includes('throughput_floor_breached:select-narrow:1'));
});
test('E11 optional regression comparison is not fabricated or silently ignored',()=>{
  const plain=sample();
  assert.equal(evaluateLoadReport(plain).compared,false);
  const comparable=copy(plain);
  comparable.comparison={comparable:true,regressions:[]};
  assert.equal(evaluateLoadReport(comparable).passed,true);
  assert.equal(evaluateLoadReport(comparable).compared,true);
  const changed=copy(comparable);
  changed.comparison.regressions=[{scenario:'select-narrow',concurrency:1,metric:'p95'}];
  assert.ok(evaluateLoadReport(changed).violations.includes('baseline_regression'));
  changed.comparison={comparable:false,reasonCode:'reference_incompatible_or_unavailable'};
  assert.ok(evaluateLoadReport(changed).violations.includes('comparison_invalid'));
});
