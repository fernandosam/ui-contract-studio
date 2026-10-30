/** Safe, read-only E10 report inputs shared by offline metrics and trends. */
import {existsSync,lstatSync,readFileSync,realpathSync,statSync} from 'node:fs';
import {resolve,sep} from 'node:path';

export const DEFAULT_EVENTS_FILE='reports/pi-execution/events.jsonl';
const FILE_PATTERN=/^reports\/pi-execution\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}\.jsonl$/;

export function validEventsFilename(file) {
  return typeof file==='string' && FILE_PATTERN.test(file) && !file.includes('..');
}

function safeEntry(path,kind) {
  if (!existsSync(path)) return false;
  const info=lstatSync(path);
  if(info.isSymbolicLink() || (kind==='directory'?!info.isDirectory():!info.isFile()) ||
      realpathSync(path)!==path) throw new Error('Unsafe local E10 report path');
  return true;
}

export function readExecutionEvents({file=DEFAULT_EVENTS_FILE,explicit=false,root=process.cwd()}={}) {
  if(!validEventsFilename(file)) throw new Error('Invalid E10 report filename');
  const base=realpathSync(root);
  const reports=resolve(base,'reports');
  const directory=resolve(reports,'pi-execution');
  const target=resolve(base,file);
  if(!target.startsWith(directory+sep)) throw new Error('Invalid E10 report location');
  const parentExists=safeEntry(reports,'directory');
  const directoryExists=parentExists && safeEntry(directory,'directory');
  if (!directoryExists || !safeEntry(target,'file')) {
    if(explicit) throw new Error('Requested E10 report is missing');
    return [];
  }
  if(statSync(target).size>16*1024*1024) throw new Error('Oversized E10 event file');
  const lines=readFileSync(target,'utf8').split('\n').filter(line=>line.trim());
  if(lines.length>100_000) throw new Error('Too many E10 events');
  return lines.map(line=>JSON.parse(line));
}

export function readPiEvaluationReport({root=process.cwd()}={}) {
  const base=realpathSync(root);
  const reports=resolve(base,'reports');
  const target=resolve(reports,'pi-evaluation.json');
  if(!safeEntry(reports,'directory')||!safeEntry(target,'file')||
     statSync(target).size>2*1024*1024)
    throw new Error('Unavailable or unsafe Pi evaluation evidence');
  return JSON.parse(readFileSync(target,'utf8'));
}
