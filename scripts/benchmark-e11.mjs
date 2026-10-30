#!/usr/bin/env node
/** E11: reproducible, opt-in offline CLI baselines; does not evaluate a live agent. */
import {spawn,execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {existsSync,lstatSync,mkdirSync,realpathSync,readFileSync,renameSync,unlinkSync,writeFileSync} from 'node:fs';
import {cpus,platform,arch,totalmem} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';

export const SCENARIOS=Object.freeze({
  'select-narrow':{phase:'selection',command:'node',args:['scripts/select-pi-candidates.mjs','--requirement=Botão para confirmar uma ação','--types=Button,AlertDialog','--limit=2']},
  'select-wide':{phase:'selection',command:'node',args:['scripts/select-pi-candidates.mjs','--requirement=Formulário de cadastro com campos e seleção','--limit=10']},
  'context-real-schema':{phase:'selection',command:'node',args:['scripts/select-pi-context.mjs','--types=Button,Card,Input,AlertDialog','--stdout']},
  'plan-simple':{phase:'planning-generation-validation',command:'tsx',args:['scripts/preview-requirements.ts'],fixture:'simple'},
  'plan-rich':{phase:'planning-generation-validation',command:'tsx',args:['scripts/preview-requirements.ts'],fixture:'rich'},
  'validate-screen':{phase:'validation',command:'tsx',args:['scripts/validate-pi-spec.ts','--file=src/ui-screens/blocos-login.json','--stdout']},
});
const defaults={iterations:20,warmup:2,concurrency:[1,4],timeoutMs:30000,
  scenarios:Object.keys(SCENARIOS),out:'reports/performance/e11-latest.json',compare:null};
const outputPattern=/^reports\/performance\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}\.json$/;
const baselinePattern=/^benchmarks\/baselines\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}\.json$/;
const integer=(value,min,max,name)=>{
  if(!/^[0-9]+$/.test(value))throw Error('Invalid '+name);
  const result=Number(value);
  if(!Number.isSafeInteger(result)||result<min||result>max)throw Error('Out of range: '+name);
  return result;
};
export function parseOptions(argv) {
  const config={...defaults,concurrency:[...defaults.concurrency],scenarios:[...defaults.scenarios]};
  for(const arg of argv) {
    if(arg==='--help'){config.help=true;continue;}
    const match=/^--([a-z-]+)=(.*)$/.exec(arg);
    if(!match)throw Error('Unknown E11 argument');
    const [,key,value]=match;
    if(key==='iterations')config.iterations=integer(value,5,200,key);
    else if(key==='warmup')config.warmup=integer(value,0,10,key);
    else if(key==='timeout-ms')config.timeoutMs=integer(value,100,120000,key);
    else if(key==='concurrency'){
      const values=value.split(',').map(x=>integer(x,1,8,key));
      if(!values.length||new Set(values).size!==values.length)throw Error('Duplicate or missing concurrency');
      config.concurrency=values;
    }else if(key==='scenarios'){
      const values=value.split(',');
      if(!values.length||values.some(x=>!Object.hasOwn(SCENARIOS,x))||new Set(values).size!==values.length)
        throw Error('Unknown or repeated scenario');
      config.scenarios=values;
    }else if(key==='out'){
      if(!outputPattern.test(value)||value.includes('..'))throw Error('Invalid E11 output path');
      config.out=value;
    }else if(key==='compare'){
      if(!baselinePattern.test(value)||value.includes('..'))throw Error('Invalid E11 baseline path');
      config.compare=value;
    }else throw Error('Unknown E11 argument: '+key);
  }
  return config;
}
export function percentile(numbers,p) {
  if(!numbers.length)return null;
  if(!Number.isFinite(p)||p<0||p>100)throw Error('Invalid percentile');
  const sorted=[...numbers].sort((a,b)=>a-b);
  return sorted[Math.max(0,Math.ceil(p*sorted.length/100)-1)];
}
const round=n=>Math.round(n*100)/100;
export function summarize(scenario,concurrency,observations,wallMs,warmupFailures=0) {
  const good=observations.filter(x=>x.reason===null).map(x=>x.ms);
  const failures={};
  for(const x of observations)if(x.reason)failures[x.reason]=(failures[x.reason]??0)+1;
  if(warmupFailures)failures.warmup_failed=warmupFailures;
  const sorted=[...good].sort((a,b)=>a-b);
  return {scenario,concurrency,attempts:observations.length,succeeded:good.length,
    failed:observations.length-good.length,warmupFailures,
    errorRate:observations.length?round((observations.length-good.length)/observations.length):null,
    elapsedMs:round(wallMs),
    throughputPerSecond:wallMs>0?round(good.length*1000/wallMs):null,
    latencyMs:good.length?{
      min:round(sorted[0]),mean:round(good.reduce((a,c)=>a+c,0)/good.length),
      p50:round(percentile(good,50)),p90:round(percentile(good,90)),
      p95:round(percentile(good,95)),p99:round(percentile(good,99)),max:round(sorted.at(-1))
    }:null,failures};
}

/** No stdout/stderr content is retained in reports; timings include Node/tsx CLI startup. */
export function runCommand(args,{cwd=process.cwd(),timeoutMs=30000,maxOutputBytes=4_000_000,env=process.env}={}) {
  return new Promise(resolveResult=>{
    const start=performance.now();
    let child,reason=null,bytes=0,completed=false;
    const finish=(result)=>{
      if(completed)return;
      completed=true;
      clearTimeout(timer);
      resolveResult({ms:performance.now()-start,reason:result});
    };
    try{
      child=spawn(process.execPath,args,{cwd,env,stdio:['ignore','pipe','pipe'],windowsHide:true});
    }catch {return resolveResult({ms:performance.now()-start,reason:'spawn_failed'});}
    const limit=chunk=>{
      bytes+=chunk.length;
      if(bytes>maxOutputBytes&&reason===null){reason='output_limit';child.kill('SIGKILL');}
    };
    child.stdout.on('data',limit);child.stderr.on('data',limit);
    child.on('error',()=>{reason=reason??'spawn_failed';});
    child.on('close',(code,signal)=>finish(reason??(signal?'signaled':code===0?null:'nonzero_exit')));
    const timer=setTimeout(()=>{reason=reason??'timeout';child.kill('SIGKILL');},timeoutMs);
  });
}

function checkedDirectory(root,relativePath) {
  let current=root;
  for(const part of relativePath.split('/')){
    current=join(current,part);
    if(existsSync(current)){
      if(!lstatSync(current).isDirectory())throw Error('Unsafe E11 directory');
    }else mkdirSync(current,{mode:0o700});
    if(realpathSync(current)!==current)throw Error('Unsafe E11 directory symlink');
  }
  return current;
}
function writeReport(root,destination,report) {
  const dir=checkedDirectory(root,'reports/performance');
  const target=join(root,destination);
  if(dirname(target)!==dir||existsSync(target)&&!lstatSync(target).isFile())
    throw Error('Unsafe E11 output path');
  const temp=join(dir,'.e11-'+randomUUID()+'.json');
  try{
    writeFileSync(temp,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
    renameSync(temp,target);
  }finally{if(existsSync(temp))unlinkSync(temp);}
}
function fixtureData(name,root) {
  const cases=JSON.parse(readFileSync(join(root,'tests/fixtures/requirements-scenarios.json'),'utf8')).scenarios;
  const selected=cases.find(item=>item.id===(name==='simple'?'simple':'corporate') && item.blocked===false);
  if(!selected)throw Error('E11 scenario fixture missing or blocked');
  return {intent:selected.intent,answers:selected.answers};
}
function prepareFixtures(root,names) {
  const used=names.filter(x=>SCENARIOS[x].fixture);
  if(!used.length)return {paths:{},cleanup:()=>{}};
  const dir=checkedDirectory(root,'reports/requirements');
  const paths={},created=[];
  try{
    for(const scenario of used){
      const path='reports/requirements/e11-'+randomUUID()+'.json';
      writeFileSync(join(root,path),JSON.stringify(fixtureData(SCENARIOS[scenario].fixture,root)),{flag:'wx',mode:0o600});
      paths[scenario]=path;created.push(join(root,path));
    }
    return {paths,cleanup:()=>created.forEach(p=>unlinkSync(p))};
  }catch(error){for(const file of created)unlinkSync(file);throw error;}
}
function argsFor(scenario,fixturePaths) {
  const selected=SCENARIOS[scenario];
  const args=selected.command==='tsx'?['--import=tsx',...selected.args]:[...selected.args];
  if(selected.fixture)args.push('--file='+fixturePaths[scenario]);
  return args;
}
async function measure(args,concurrency,iterations,timeoutMs,env) {
  const results=new Array(iterations);
  let next=0;
  const start=performance.now();
  await Promise.all(Array.from({length:Math.min(concurrency,iterations)},async()=>{
    while(next<iterations){
      const index=next++;
      results[index]=await runCommand(args,{timeoutMs,env});
    }
  }));
  return {observations:results,wallMs:performance.now()-start};
}
function revision(root){
  try {
    const value=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',timeout:2000,stdio:['ignore','pipe','ignore']}).trim();
    return /^[a-f0-9]{40}$/.test(value)?value:null;
  }catch {return null;}
}
function environment(root) {
  return {node:process.versions.node,platform:platform(),architecture:arch(),
    cpuModel:cpus()[0]?.model??'unknown',cpuCount:cpus().length,
    memoryGiB:round(totalmem()/2**30),sourceRevision:revision(root)};
}
export function compareReports(current,baseline) {
  if(current.schemaVersion!==1||baseline.schemaVersion!==1)throw Error('Incompatible baseline schema');
  for(const key of ['node','platform','architecture','cpuModel','cpuCount']){
    if(current.environment[key]!==baseline.environment[key])throw Error('Baseline environment mismatch: '+key);
  }
  for(const key of ['iterations','warmup','timeoutMs']){
    if(current.config[key]!==baseline.config[key])throw Error('Baseline configuration mismatch: '+key);
  }
  if(current.status!=='complete'||baseline.status!=='complete')throw Error('Incomplete baseline cannot be compared');
  const previous=new Map(baseline.results.map(item=>[item.scenario+':'+item.concurrency,item]));
  if(previous.size!==current.results.length)throw Error('Baseline scenario set mismatch');
  const regressions=[];
  for(const row of current.results){
    const old=previous.get(row.scenario+':'+row.concurrency);
    if(!old||old.failed||!old.latencyMs||!old.throughputPerSecond||!row.latencyMs)
      throw Error('Baseline scenario missing or invalid');
    if(row.latencyMs.p95>old.latencyMs.p95*1.20)
      regressions.push({scenario:row.scenario,concurrency:row.concurrency,metric:'p95',baseline:old.latencyMs.p95,current:row.latencyMs.p95});
    if(row.throughputPerSecond<old.throughputPerSecond*0.85)
      regressions.push({scenario:row.scenario,concurrency:row.concurrency,metric:'throughput',baseline:old.throughputPerSecond,current:row.throughputPerSecond});
  }
  return {comparable:true,policy:{p95IncreaseMax:0.20,throughputDecreaseMax:0.15},regressions};
}
export async function main(argv=process.argv.slice(2)) {
  const config=parseOptions(argv);
  if(config.help){
    console.log('E11 offline CLI performance baselines: node scripts/benchmark-e11.mjs [--iterations=20] [--warmup=2] [--concurrency=1,4] [--scenarios=select-narrow,select-wide,context-real-schema,plan-simple,plan-rich,validate-screen] [--timeout-ms=30000] [--out=reports/performance/e11-latest.json] [--compare=benchmarks/baselines/approved.json]');
    return;
  }
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const safeEnv={...process.env};
  delete safeEnv.UI_CONTRACT_EVENTS_FILE;
  delete safeEnv.UI_CONTRACT_EXECUTION_ID;
  const report={schemaVersion:1,kind:'offline-cli-e11',generatedAt:new Date().toISOString(),
    environment:environment(root),config:{iterations:config.iterations,warmup:config.warmup,
      concurrency:config.concurrency,scenarios:config.scenarios,timeoutMs:config.timeoutMs},
    status:'complete',results:[]};
  const fixtures=prepareFixtures(root,config.scenarios);
  try{
    for(const scenario of config.scenarios){
      const args=argsFor(scenario,fixtures.paths);
      for(const concurrency of config.concurrency){
        let warmupFailures=0;
        for(let i=0;i<config.warmup;i++){
          const value=await runCommand(args,{cwd:root,timeoutMs:config.timeoutMs,env:safeEnv});
          if(value.reason)warmupFailures++;
        }
        const measured=warmupFailures?{observations:[],wallMs:0}:
          await measure(args,concurrency,config.iterations,config.timeoutMs,safeEnv);
        const row=summarize(scenario,concurrency,measured.observations,measured.wallMs,warmupFailures);
        if(row.failed||row.warmupFailures)report.status='incomplete';
        report.results.push(row);
        console.log(scenario+' concurrency='+concurrency+' success='+row.succeeded+'/'+row.attempts+
          ' p95='+String(row.latencyMs?.p95??'n/a')+'ms throughput='+String(row.throughputPerSecond??'n/a')+'/s');
      }
    }
  } finally {fixtures.cleanup();}
  if(config.compare){
    try{
      const file=join(root,config.compare);
      if(!existsSync(file)||!lstatSync(file).isFile())throw Error('Missing or unsafe approved baseline');
      report.comparison=compareReports(report,JSON.parse(readFileSync(file,'utf8')));
    }catch{
      report.comparison={comparable:false,reasonCode:'reference_incompatible_or_unavailable'};
      console.error('E11 comparison rejected: reference missing, incompatible or incomplete');
    }
  }
  writeReport(root,config.out,report);
  console.log('E11 report: '+config.out+' ('+report.status+')');
  if(report.status!=='complete'||report.comparison?.comparable===false||
     report.comparison?.regressions?.length)process.exitCode=1;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(error=>{console.error('E11 benchmark failed: '+(error instanceof Error?error.message:'unknown error'));process.exitCode=1;});
}
