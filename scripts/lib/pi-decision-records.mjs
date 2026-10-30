/** E10: optional, reproducible Pi selection decisions. Never a grant of authority. */
import {createHash, randomUUID} from 'node:crypto';
import {appendFileSync, existsSync, lstatSync, mkdirSync, realpathSync} from 'node:fs';
import {resolve, sep} from 'node:path';
import {PI_SELECTION_POLICY} from './pi-semantic-selection.mjs';

export const PI_DECISION_SCHEMA_VERSION = 1;
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hashPattern = /^[a-f0-9]{64}$/;
const typePattern = /^[A-Z][A-Za-z0-9]{0,79}$/;
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[a-zA-Z0-9.-]+)?$/;
const sources = new Set(['pi-select','pi-context']);
const outcomes = new Set(['recommended','ambiguous','no-match']);
const dispositions = new Set(['candidate','avoid','unavailable','no-positive-evidence']);
const evidenceFields = new Set(['type','purpose','whenUse','whenNotUse']);
const own = (obj,key) => Object.prototype.hasOwnProperty.call(obj,key);
const record = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const keys = (x,required,optional=[]) => record(x) &&
  required.every(k=>own(x,k)) && Object.keys(x).every(k=>required.includes(k)||optional.includes(k));
const count = x => Number.isSafeInteger(x) && x>=0 && x<=1_000_000;
const score = x => Number.isFinite(x) && x>=0 && x<=1_000_000;
const coverage = x => Number.isFinite(x) && x>=0 && x<=1;
const refOK = x => keys(x,['type','version','fingerprint']) &&
  typePattern.test(x.type) && versionPattern.test(x.version) && hashPattern.test(x.fingerprint);
const profileHash = profile => createHash('sha256').update(JSON.stringify({
  component:profile?.component??null,purpose:profile?.purpose??null,
  whenUse:profile?.whenUse??[],whenNotUse:profile?.whenNotUse??[],
})).digest('hex');

export function validatePiDecisionRecord(entry) {
  if (!keys(entry,['schemaVersion','decisionId','executionId','timestamp','source','phase',
    'authority','policy','outcome','selectedContract','evaluation','candidates']) ||
    entry.schemaVersion!==PI_DECISION_SCHEMA_VERSION ||
    !idPattern.test(entry.decisionId) || !idPattern.test(entry.executionId) ||
    !sources.has(entry.source) || entry.phase!=='selection' || entry.authority!=='advisory-only' ||
    !outcomes.has(entry.outcome) || typeof entry.timestamp!=='string' ||
    !Number.isFinite(Date.parse(entry.timestamp)) ||
    new Date(entry.timestamp).toISOString()!==entry.timestamp) return false;
  const p=entry.policy,e=entry.evaluation;
  if (!keys(p,['id','version','stableOnly','minCoverage','minScoreLead']) ||
    p.id!==PI_SELECTION_POLICY.id || p.version!==PI_SELECTION_POLICY.version ||
    p.stableOnly!==PI_SELECTION_POLICY.stableOnly ||
    p.minCoverage!==PI_SELECTION_POLICY.minCoverage || p.minScoreLead!==PI_SELECTION_POLICY.minScoreLead) return false;
  if (!keys(e,['evaluatedCount','loggedCount','termCount','leadingCoverage','scoreLead','coverageNotWorse']) ||
    !count(e.evaluatedCount) || !count(e.loggedCount) || !count(e.termCount) ||
    (e.leadingCoverage!==null&&!coverage(e.leadingCoverage)) ||
    (e.scoreLead!==null&&(!Number.isFinite(e.scoreLead)||Math.abs(e.scoreLead)>1_000_000)) ||
    (e.coverageNotWorse!==null&&typeof e.coverageNotWorse!=='boolean')) return false;
  if (!Array.isArray(entry.candidates) || entry.candidates.length>25 ||
    entry.candidates.length!==e.loggedCount || e.loggedCount>e.evaluatedCount ||
    (entry.selectedContract!==null&&!refOK(entry.selectedContract))) return false;
  if (entry.outcome==='recommended' !== (entry.selectedContract!==null)) return false;
  const seen=new Set();
  for (const c of entry.candidates) {
    if (!keys(c,['contract','disposition','score','coverage','criteria','profileDigest','evidence']) ||
      !refOK(c.contract) || seen.has(c.contract.type) || !dispositions.has(c.disposition) ||
      !score(c.score) || !coverage(c.coverage) || (c.profileDigest!==null&&!hashPattern.test(c.profileDigest)) ||
      !keys(c.criteria,['stableEligible','hasPositiveEvidence','negativeVeto']) ||
      Object.values(c.criteria).some(x=>typeof x!=='boolean') ||
      c.criteria.hasPositiveEvidence!==(c.score>0) ||
      (c.disposition==='unavailable')===c.criteria.stableEligible ||
      !Array.isArray(c.evidence) || c.evidence.length>8) return false;
    seen.add(c.contract.type);
    for (const ref of c.evidence) {
      if (!keys(ref,['field','index','matchedCount']) || !evidenceFields.has(ref.field) ||
        !count(ref.index) || !count(ref.matchedCount) ||
        (ref.field==='type'&&ref.index!==0) ||
        (ref.field!=='type'&&c.profileDigest===null)) return false;
    }
  }
  if (entry.selectedContract && !entry.candidates.some(c=>JSON.stringify(c.contract)===JSON.stringify(entry.selectedContract) &&
    c.disposition==='candidate')) return false;
  return true;
}

function destinationFor(file,root) {
  if (file===undefined || file==='') return null;
  if (typeof file!=='string' ||
    !/^reports\/pi-execution\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}\.jsonl$/.test(file) ||
    file.includes('..')) throw new Error('E10 decisions path must be reports/pi-execution/<name>.jsonl');
  const base=resolve(root),reports=resolve(base,'reports'),directory=resolve(reports,'pi-execution');
  if (existsSync(reports) && !lstatSync(reports).isDirectory())
    throw new Error('E10 decisions reports directory cannot be a symlink');
  mkdirSync(reports,{recursive:true});
  if (realpathSync(reports)!==resolve(realpathSync(base),'reports'))
    throw new Error('E10 decisions reports directory cannot be a symlink');
  if (existsSync(directory) && !lstatSync(directory).isDirectory())
    throw new Error('E10 decisions directory cannot be a symlink');
  mkdirSync(directory,{recursive:true});
  if (realpathSync(directory)!==resolve(realpathSync(base),'reports/pi-execution'))
    throw new Error('E10 decisions directory cannot be a symlink');
  const dest=resolve(base,file);
  if (!dest.startsWith(directory+sep) || (existsSync(dest)&&!lstatSync(dest).isFile()))
    throw new Error('E10 decisions destination must be a regular local file');
  return dest;
}

function evidenceRef(item,profile) {
  if (!record(item) || !evidenceFields.has(item.field) ||
    !Array.isArray(item.matchedTerms) || !item.matchedTerms.length) throw new Error('Invalid decision evidence');
  const values=item.field==='type'?[profile?.component]:item.field==='purpose'?[profile?.purpose]:profile?.[item.field];
  const index=values?.indexOf(item.excerpt)??-1;
  if (index<0 || index>1_000_000) throw new Error('Decision evidence not backed by profile');
  return {field:item.field,index,matchedCount:item.matchedTerms.length};
}

/**
 * Build a closed, safe record solely from the EXISTING selector result, manifest
 * and semantic profiles. No requirement, excerpts, matched words, paths, or specs.
 * Profile digest anchors each ordinal to versioned knowledge in Git history.
 */
export function buildPiDecisionRecord({source,executionId,result,contracts,profiles}) {
  if (!sources.has(source) || !idPattern.test(executionId) || !record(result) ||
      !outcomes.has(result.status) || !Array.isArray(result.candidates) ||
      !Array.isArray(contracts) || !Array.isArray(profiles)) throw new Error('Invalid Pi decision inputs');
  const byContract=new Map(contracts.map(x=>[x.type,x]));
  const byProfile=new Map(profiles.map(x=>[x.component,x]));
  const candidates=result.candidates.map(item=>{
    const c=byContract.get(item.type), profile=byProfile.get(item.type);
    if (!c || !typePattern.test(item.type) || !dispositions.has(item.decision) ||
        !score(item.score) || !coverage(item.coverage) ||
        typeof item.piAvailable!=='boolean' ||
        !Array.isArray(item.evidence) || !Array.isArray(item.contraindications))
      throw new Error('Decision candidate is not present in the reviewed projection');
    const contract={type:c.type,version:c.version,fingerprint:c.fingerprint};
    if (!refOK(contract) || c.version!==item.version || c.fingerprint!==contract.fingerprint ||
        c.stability!==item.stability) throw new Error('Decision contract reference mismatch');
    const items=[...item.evidence,...item.contraindications];
    if (items.length>8 || (items.length && !profile && items.some(x=>x.field!=='type')))
      throw new Error('Decision evidence has no profile');
    const evidence=items.map(x=>evidenceRef(x,profile??{component:item.type}));
    return {
      contract,disposition:item.decision,score:item.score,coverage:item.coverage,
      criteria:{stableEligible:item.piAvailable,hasPositiveEvidence:item.score>0,
        negativeVeto:item.contraindications.length>0},
      profileDigest:profile?profileHash(profile):null,evidence,
    };
  });
  const positive=result.candidates.filter(x=>x.decision==='candidate');
  const first=positive[0]??null,second=positive[1]??null;
  const selected=result.selectedType===null?null:candidates.find(x=>x.contract.type===result.selectedType)?.contract;
  const entry={
    schemaVersion:1,decisionId:randomUUID(),executionId,timestamp:new Date().toISOString(),
    source,phase:'selection',authority:'advisory-only',
    policy:{...PI_SELECTION_POLICY},
    outcome:result.status,selectedContract:selected??null,
    evaluation:{evaluatedCount:result.evaluated,loggedCount:candidates.length,
      termCount:result.terms?.length,
      leadingCoverage:first?.coverage??null,
      scoreLead:second?first.score-second.score:null,
      coverageNotWorse:second?first.coverage>=second.coverage:null},
    candidates,
  };
  if (!validatePiDecisionRecord(entry)) throw new Error('Invalid or sensitive Pi decision record');
  return entry;
}

/** Independent opt-in JSONL artifact correlated to execution-events by executionId. */
export function recordPiDecision({file=process.env.UI_CONTRACT_DECISIONS_FILE,root=process.cwd(),...input}) {
  const entry=buildPiDecisionRecord(input);
  if (file && file===process.env.UI_CONTRACT_EVENTS_FILE)
    throw new Error('E10 decision records must use a separate JSONL file from execution events');
  const dest=destinationFor(file,root);
  if (dest) appendFileSync(dest,JSON.stringify(entry)+'\n',{encoding:'utf8',flag:'a',mode:0o600});
  return entry;
}
