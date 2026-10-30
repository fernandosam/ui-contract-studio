/** E10 local JSONL policy. Never accepts arbitrary log payloads or sends data remotely. */
import {randomUUID} from 'node:crypto';
import {constants,closeSync,existsSync,lstatSync,openSync,readFileSync,readdirSync,
  realpathSync,renameSync,statSync,unlinkSync,writeFileSync,appendFileSync} from 'node:fs';
import {basename,dirname,join,resolve} from 'node:path';

export const EXECUTION_LOG_POLICY=Object.freeze({
  retentionDays:7,
  maxFiles:16,
  maxFileBytes:4*1024*1024,
  maxEventsPerFile:8192,
  maxExecutionIdsPerFile:512,
  maxOperationIdsPerFile:4096,
  maxEventsPerRecorder:1024,
});

const logName=/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}\.jsonl$/;
const cutoffFor=now=>now-EXECUTION_LOG_POLICY.retentionDays*86_400_000;

/** For other operational diagnostics: text is masked, never admitted to E10 event details. */
export function redactSensitiveText(input) {
  if(typeof input!=='string') return '[REDACTED]';
  return input
    .replace(/\b(?:Bearer|Basic)\s+[\w.+/~=-]+/gi,'[REDACTED_AUTH]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[REDACTED_EMAIL]')
    .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,'[REDACTED_CPF]')
    .replace(/(\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|passwd|secret|authorization|cookie)\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s&,;]+)/gi,'$1[REDACTED]')
    .replace(/([?&](?:token|key|password|secret)=)[^&#\s]+/gi,'$1[REDACTED]');
}

function regularFile(path) {
  if(!existsSync(path)) return false;
  const info=lstatSync(path);
  if(!info.isFile()||info.isSymbolicLink()||realpathSync(path)!==path)
    throw new Error('Unsafe E10 log file');
  return true;
}

function readBounded(file,validate) {
  if(!regularFile(file)) return [];
  if(statSync(file).size>EXECUTION_LOG_POLICY.maxFileBytes)
    throw new Error('E10 log size quota exceeded');
  const raw=readFileSync(file,'utf8');
  if(raw && !raw.endsWith('\n')) throw new Error('Incomplete E10 JSONL');
  const lines=raw?raw.trimEnd().split('\n'):[];
  if(lines.length>EXECUTION_LOG_POLICY.maxEventsPerFile) throw new Error('E10 log event quota exceeded');
  return lines.map(line=>{
    let value;
    try{value=JSON.parse(line);}catch{throw new Error('Invalid E10 JSONL');}
    if(!validate(value)) throw new Error('Invalid E10 event in existing log');
    return value;
  });
}

function ensureCardinality(events) {
  const executions=new Set(),operations=new Set();
  for(const event of events){
    executions.add(event.executionId);
    operations.add(event.executionId+':'+event.operationId);
    if(executions.size>EXECUTION_LOG_POLICY.maxExecutionIdsPerFile ||
      operations.size>EXECUTION_LOG_POLICY.maxOperationIdsPerFile)
      throw new Error('E10 log cardinality limit exceeded');
  }
}

function replaceAtomically(file,text) {
  const tmp=join(dirname(file),'.e10-'+randomUUID()+'.tmp');
  try{
    writeFileSync(tmp,text,{encoding:'utf8',flag:'wx',mode:0o600});
    renameSync(tmp,file);
  }finally{
    if(existsSync(tmp)) unlinkSync(tmp);
  }
}

/**
 * Enforce TTL and bounded local log storage on every opt-in append.
 * A per-directory exclusive lock prevents concurrent writer interleaving and lost compaction.
 * A left-over lock after an unclean shutdown intentionally fails closed; remove manually
 * only when no E10 writer is active.
 * The caller must verify the reports/pi-execution path before invoking this function.
 */
export function appendExecutionLogEvent(destination,event,{validate,now=Date.now()}={}) {
  if(typeof validate!=='function'||!validate(event)) throw new Error('Invalid E10 event metadata');
  const directory=dirname(destination);
  if(basename(directory)!=='pi-execution'||!logName.test(basename(destination))||
     !regularDirectory(directory)) throw new Error('Unsafe E10 log directory');
  const lock=join(directory,'.e10-writer.lock');
  let lockFd;
  for(let attempt=0;attempt<50;attempt++){
    try {
      lockFd=openSync(lock,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|(constants.O_NOFOLLOW??0),0o600);
      break;
    }catch(error){
      if(error?.code!=='EEXIST'||attempt===49) throw new Error('E10 log writer lock unavailable');
      // Bounded contention backoff; do not override a stale lock or corrupt another writer.
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,20);
    }
  }
  try {
    const cutoff=cutoffFor(now);
    const entries=readdirSync(directory).filter(name=>logName.test(name));
    const candidates=[];
    for(const name of entries) {
      const path=join(directory,name);
      if(!regularFile(path)) throw new Error('Unsafe E10 log file');
      const stats=statSync(path);
      if(path!==destination && stats.mtimeMs<cutoff) {
        unlinkSync(path);
      } else {
        candidates.push({path,modified:stats.mtimeMs,size:stats.size});
      }
    }
    const existing=readBounded(destination,validate);
    const retained=existing.filter(item=>Date.parse(item.timestamp)>=cutoff);
    // Bad clock skew must not enable unbounded retention.
    if(Date.parse(event.timestamp)<cutoff||Date.parse(event.timestamp)>now+300_000)
      throw new Error('E10 event timestamp outside retention window');
    const next=[...retained,event];
    if(next.length>EXECUTION_LOG_POLICY.maxEventsPerFile)
      throw new Error('E10 log event quota exceeded');
    ensureCardinality(next);
    const data=next.map(item=>JSON.stringify(item)).join('\n')+'\n';
    if(Buffer.byteLength(data)>EXECUTION_LOG_POLICY.maxFileBytes)
      throw new Error('E10 log size quota exceeded');
    const current=candidates.find(x=>x.path===destination);
    const other=candidates.filter(x=>x.path!==destination).sort((a,b)=>a.modified-b.modified);
    let count=other.length+1;
    let bytes=other.reduce((sum,x)=>sum+x.size,0)+Buffer.byteLength(data);
    const maxTotal=EXECUTION_LOG_POLICY.maxFiles*EXECUTION_LOG_POLICY.maxFileBytes;
    while((count>EXECUTION_LOG_POLICY.maxFiles||bytes>maxTotal)&&other.length){
      const oldest=other.shift();
      unlinkSync(oldest.path);
      count--;bytes-=oldest.size;
    }
    if(count>EXECUTION_LOG_POLICY.maxFiles||bytes>maxTotal)
      throw new Error('E10 log storage quota exceeded');
    if(!current||retained.length!==existing.length){
      replaceAtomically(destination,data);
    }else{
      // Do not rewrite on a normal append; use an O_NOFOLLOW descriptor for the final path.
      const fd=openSync(destination,constants.O_APPEND|constants.O_WRONLY|(constants.O_NOFOLLOW??0));
      try{appendFileSync(fd,JSON.stringify(event)+'\n','utf8');}finally{closeSync(fd);}
    }
  }finally{
    closeSync(lockFd);
    unlinkSync(lock);
  }
}

function regularDirectory(path){
  const info=lstatSync(path);
  return info.isDirectory()&&!info.isSymbolicLink()&&realpathSync(path)===resolve(path);
}


/**
 * Run manual maintenance even when no new events are written.
 * Without apply, calculate only; no file/directory creation or deletion.
 */
export function pruneExecutionLogs({root=process.cwd(),validate,apply=false,now=Date.now()}={}) {
  if(typeof validate!=='function') throw new Error('E10 log validation required');
  const base=realpathSync(root);
  const reports=resolve(base,'reports');
  const directory=join(reports,'pi-execution');
  if(!existsSync(reports)) return {scannedFiles:0,expiredEvents:0,removedFiles:0,retainedFiles:0,applied:apply};
  if(!regularDirectory(reports)) throw new Error('Unsafe E10 reports directory');
  if(!existsSync(directory)) return {scannedFiles:0,expiredEvents:0,removedFiles:0,retainedFiles:0,applied:apply};
  if(!regularDirectory(directory)) throw new Error('Unsafe E10 logs directory');
  const lock=join(directory,'.e10-writer.lock');
  let fd;
  if(apply){
    try{fd=openSync(lock,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|(constants.O_NOFOLLOW??0),0o600);}
    catch{throw new Error('E10 log writer lock unavailable');}
  }
  try {
    const cutoff=cutoffFor(now);
    const entries=readdirSync(directory).filter(name=>logName.test(name));
    const files=[];
    let expiredEvents=0;
    for(const name of entries){
      const path=join(directory,name);
      if(!regularFile(path)) throw new Error('Unsafe E10 log file');
      const records=readBounded(path,validate);
      const retained=records.filter(item=>Date.parse(item.timestamp)>=cutoff);
      expiredEvents+=records.length-retained.length;
      files.push({path,retained,original:records.length,mtime:statSync(path).mtimeMs});
    }
    files.sort((a,b)=>a.mtime-b.mtime);
    const removeCount=Math.max(0,files.filter(item=>item.retained.length).length-EXECUTION_LOG_POLICY.maxFiles);
    let extra=removeCount;
    let removedFiles=0,retainedFiles=0;
    for(const item of files){
      const remove=!item.retained.length||extra-->0;
      if(remove){
        removedFiles++;
        if(apply) unlinkSync(item.path);
      }else{
        retainedFiles++;
        if(apply && item.retained.length!==item.original)
          replaceAtomically(item.path,item.retained.map(value=>JSON.stringify(value)).join('\n')+'\n');
      }
    }
    return {scannedFiles:files.length,expiredEvents,removedFiles,retainedFiles,applied:apply};
  }finally{
    if(fd!==undefined){closeSync(fd);unlinkSync(lock);}
  }
}
