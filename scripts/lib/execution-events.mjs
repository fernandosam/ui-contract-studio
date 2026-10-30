/** E10: optional, privacy-minimized structured execution events (never Pi authority). */
import {randomUUID} from 'node:crypto';
import {existsSync, lstatSync, mkdirSync, realpathSync} from 'node:fs';
import {appendExecutionLogEvent,EXECUTION_LOG_POLICY} from './execution-log-policy.mjs';
import {resolve, sep} from 'node:path';

export const EXECUTION_EVENT_SCHEMA_VERSION = 1;
export const EXECUTION_PHASES = Object.freeze(['planning','selection','generation','validation']);
export const EXECUTION_STATUSES = Object.freeze(['started','completed','failed','blocked']);
const sources = new Set(['pi-select','pi-context','requirements-preview','pi-validate','pi-eval']);
const decisions = new Set(['recommended','ambiguous','no-match']);
const channels = new Set(['stable','experimental']);
const reasons = new Set(['input_invalid','catalog_unavailable','schema_missing','requirements_blocked','validation_failed','command_failed']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedKeys = new Set(['schemaVersion','eventId','executionId','operationId','sequence','timestamp','source','phase','type','status','durationMs','details']);
const safeCounts = new Set(['selectedCount','candidateCount','issueCount','blockerCount']);
const safeTokens = new Set(['inputTokens','outputTokens']);
const isTokenCount = x => Number.isSafeInteger(x) && x >= 0 && x <= 1_000_000_000;

const isRecord = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const isCount = x => Number.isSafeInteger(x) && x >= 0 && x <= 1_000_000;
const isDuration = x => Number.isSafeInteger(x) && x >= 0 && x <= 86_400_000;
export function validateExecutionEvent(event) {
  if (!isRecord(event) || Object.keys(event).some(key => !allowedKeys.has(key))) return false;
  if (event.schemaVersion !== EXECUTION_EVENT_SCHEMA_VERSION || !uuid.test(event.eventId) ||
      !uuid.test(event.executionId) || !uuid.test(event.operationId) ||
      !Number.isSafeInteger(event.sequence) || event.sequence < 1 ||
      !sources.has(event.source) || !EXECUTION_PHASES.includes(event.phase) ||
      !EXECUTION_STATUSES.includes(event.status) || event.type !== event.phase+'.'+event.status ||
      typeof event.timestamp !== 'string' || !Number.isFinite(Date.parse(event.timestamp)) ||
      new Date(event.timestamp).toISOString() !== event.timestamp) return false;
  if (event.status === 'started' ? event.durationMs !== undefined : !isDuration(event.durationMs)) return false;
  if (!isRecord(event.details)) return false;
  for (const [key,value] of Object.entries(event.details)) {
    if (safeCounts.has(key) && isCount(value)) continue;
    if (safeTokens.has(key) && isTokenCount(value)) continue;
    if (key === 'attempt' && Number.isSafeInteger(value) && value >= 1 && value <= 2) continue;
    if (key === 'channel' && channels.has(value)) continue;
    if (key === 'decision' && decisions.has(value)) continue;
    if (key === 'valid' && typeof value === 'boolean') continue;
    if (key === 'reasonCode' && reasons.has(value)) continue;
    return false;
  }
  if (['failed','blocked'].includes(event.status) !== ('reasonCode' in event.details)) return false;
  const generationAttempt = event.source === 'pi-eval' && event.phase === 'generation';
  if ('attempt' in event.details && !generationAttempt) return false;
  if (('inputTokens' in event.details || 'outputTokens' in event.details) &&
      (!generationAttempt || event.status === 'started')) return false;
  return true;
}

function eventPath(file, root) {
  if (file === undefined || file === '') return null;
  if (typeof file !== 'string' || !/^reports\/pi-execution\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}\.jsonl$/.test(file) || file.includes('..'))
    throw new Error('E10 events path must be reports/pi-execution/<name>.jsonl');
  const reports = resolve(root,'reports');
  const directory = resolve(reports,'pi-execution');
  // Check both parent segments BEFORE creating anything through a possible symlink.
  if (existsSync(reports) && !lstatSync(reports).isDirectory()) throw new Error('E10 reports directory must not be a symlink');
  mkdirSync(reports,{recursive:true});
  if (realpathSync(reports) !== resolve(realpathSync(root),'reports')) throw new Error('E10 reports directory must not be a symlink');
  if (existsSync(directory) && !lstatSync(directory).isDirectory()) throw new Error('E10 events directory cannot be a symlink');
  mkdirSync(directory,{recursive:true});
  // Prevent symlink redirection outside the project when the opt-in log is used.
  if (realpathSync(directory) !== resolve(realpathSync(root),'reports/pi-execution'))
    throw new Error('E10 events directory cannot be a symlink');
  const destination = resolve(root,file);
  if (!destination.startsWith(directory + sep) || (existsSync(destination) && !lstatSync(destination).isFile()))
    throw new Error('E10 events destination must be a local regular file');
  return destination;
}

/**
 * No I/O without UI_CONTRACT_EVENTS_FILE; preserve CLI stdout JSON.
 * Reuse UI_CONTRACT_EXECUTION_ID (UUID) to correlate multiple commands.
 * Only fixed, validated metadata is permitted: never prompts, specs, paths or errors.
 */
export function createExecutionRecorder({source, executionId=process.env.UI_CONTRACT_EXECUTION_ID,
  file=process.env.UI_CONTRACT_EVENTS_FILE, root=process.cwd()} = {}) {
  if (!sources.has(source)) throw new Error('Unknown E10 event source');
  if (executionId !== undefined && !uuid.test(executionId)) throw new Error('Invalid E10 executionId (UUID required)');
  const id = executionId ?? randomUUID();
  const destination = eventPath(file,root);
  let sequence = 0;
  const emit = (phase,status,operationId,startedAt,details={}) => {
    if(destination && sequence>=EXECUTION_LOG_POLICY.maxEventsPerRecorder) throw new Error('E10 recorder event limit exceeded');
    const event={schemaVersion:1,eventId:randomUUID(),executionId:id,operationId,
      sequence:++sequence,timestamp:new Date().toISOString(),source,phase,
      type:phase+'.'+status,status,
      ...(status==='started'?{}:{durationMs:Math.max(0,Math.round(performance.now()-startedAt))}),details};
    if (!validateExecutionEvent(event)) throw new Error('Invalid or sensitive E10 event metadata');
    if (destination) appendExecutionLogEvent(destination,event,{validate:validateExecutionEvent});
    return event;
  };
  return {
    executionId:id,
    start(phase,details={}) {
      if (!EXECUTION_PHASES.includes(phase)) throw new Error('Unknown E10 phase');
      const operationId=randomUUID();
      const startedAt=performance.now();
      emit(phase,'started',operationId,startedAt,details);
      let finished=false;
      const exitHandler=()=>{
        if (!finished) {
          // Never reflect untrusted exception messages, input or spec content.
          emit(phase,'failed',operationId,startedAt,{reasonCode:'command_failed'});
        }
      };
      process.on('exit',exitHandler);
      const finish=(status,data={})=>{
        if (finished) throw new Error('E10 phase already finalized');
        const event=emit(phase,status,operationId,startedAt,data);
        finished=true;
        process.off('exit',exitHandler);
        return event;
      };
      return {
        complete: details=>finish('completed',details),
        fail: (reasonCode,details={})=>finish('failed',{...details,reasonCode}),
        block: (reasonCode,details={})=>finish('blocked',{...details,reasonCode}),
      };
    },
  };
}
