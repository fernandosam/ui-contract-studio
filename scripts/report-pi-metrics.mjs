#!/usr/bin/env node
/** E10 offline metrics, emitted only to stdout; no paid Pi execution or automatic upload. */
import {existsSync,lstatSync,readFileSync,realpathSync,statSync} from 'node:fs';
import {resolve,sep} from 'node:path';
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
  const root=realpathSync(process.cwd());
  const reports=resolve(root,'reports');
  const directory=resolve(reports,'pi-execution');
  const target=resolve(root,file);
  if(existsSync(target)){
    for(const path of [reports,directory,target]){
      if(lstatSync(path).isSymbolicLink()) throw new Error('Symlinked metrics source rejected');
    }
    if(realpathSync(target)!==target||!target.startsWith(directory+sep)||!statSync(target).isFile()||
       statSync(target).size>16*1024*1024) throw new Error('Invalid or oversized E10 source');
  } else if(explicit) {
    throw new Error('Requested E10 source missing');
  }
  const lines=existsSync(target)?readFileSync(target,'utf8').split('\n').filter(line=>line.trim()):[];
  const events=lines.map(line=>JSON.parse(line));
  const metrics=summarizeExecutionMetrics(events,{executionId:filter});
  const qualityPath=resolve(root,'reports/pi-evaluation.json');
  if(includeEvaluation){
    if(!existsSync(qualityPath)||lstatSync(reports).isSymbolicLink()||lstatSync(qualityPath).isSymbolicLink()||
       realpathSync(qualityPath)!==qualityPath||statSync(qualityPath).size>2*1024*1024)
      throw new Error('Missing or unsafe Pi evaluation evidence');
  }
  const quality=includeEvaluation?summarizeEvaluationQuality(JSON.parse(readFileSync(qualityPath,'utf8'))):null;
  process.stdout.write(JSON.stringify({...metrics,collectionStatus:lines.length?'observed':'no-events',
    evaluationQuality:quality},null,2)+'\n');
} catch {
  // Do not echo user-controlled paths, input snippets, or raw exceptions.
  console.error('E10 metrics unavailable: source invalid, incomplete or inaccessible.');
  process.exitCode=1;
}
