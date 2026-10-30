#!/usr/bin/env node
/** E10 privacy retention maintenance; dry run by default. */
import {pruneExecutionLogs} from './lib/execution-log-policy.mjs';
import {validateExecutionEvent} from './lib/execution-events.mjs';

const args=process.argv.slice(2);
if(args.some(arg=>arg!=='--apply')||args.filter(arg=>arg==='--apply').length>1){
  console.error('Usage: npm run pi:logs:prune -- [--apply]');
  process.exit(2);
}
try{
  const summary=pruneExecutionLogs({validate:validateExecutionEvent,apply:args.includes('--apply')});
  process.stdout.write(JSON.stringify(summary,null,2)+'\n');
}catch{
  console.error('E10 retention unavailable: unsafe, invalid or inaccessible local logs.');
  process.exitCode=1;
}
