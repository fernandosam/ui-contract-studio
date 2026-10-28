import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, sep } from "node:path";

const stableSort = (a,b) => a.localeCompare(b);
const validEvidencePath = path => typeof path === "string" &&
  /^src\/[A-Za-z0-9_./-]+$/.test(path) && !path.includes("..");

/**
 * Git is a change detector, not proof that a capability still works. Read only
 * tracked history and local modifications; never update curated review dates.
 * Null means history is unavailable rather than "unchanged".
 */
export function getCodeRevision(root, path) {
  const options = {cwd:root, encoding:"utf8", maxBuffer:1024*1024};
  const history = spawnSync("git",["log","-1","--format=%cI","--",path],options);
  const worktree = spawnSync("git",["status","--porcelain","--untracked-files=all","--",path],options);
  if(history.error || worktree.error || history.status!==0 || worktree.status!==0) return null;
  const changedAt = history.stdout.trim() || null;
  const dirty = worktree.stdout.trim().length>0;
  if(!changedAt && !dirty) return null;
  return {changedAt,dirty};
}

const actions = {
  "review-required":"Revisar a capacidade e os trechos de implementação alterados; executar os testes derivados e só então atualizar a data de revisão.",
  "missing-evidence":"Corrigir caminho/trecho de evidência ou reclassificar a capacidade mediante revisão explícita; não inferir implementação.",
  "history-unavailable":"Disponibilizar histórico Git para conferir alterações desde a revisão; manter a verificação textual, sem atestar atualidade.",
};

/**
 * Diagnoses trace from knowledge overlay -> capability -> literal code evidence.
 * 'source.reviewedOn' is an upper-day-precision DOCUMENTATION review date,
 * conservatively used as a freshness baseline, not as runtime certification.
 * A code edit after that day needs manual review even when the needle remains.
 */
export function auditSemanticFreshness({
  root=process.cwd(), profiles=[], codeRevision=getCodeRevision,
}={}) {
  const diagnostics=[], components=[];
  const fileCache = new Map(), revisionCache = new Map();
  const readEvidence = path => {
    if(!fileCache.has(path)) {
      let content=null;
      if(validEvidencePath(path)) {
        const absolute=resolve(root,path);
        if(absolute.startsWith(resolve(root)+sep) && existsSync(absolute)){
          try {content=readFileSync(absolute,"utf8")} catch { /* missing/unreadable */ }
        }
      }
      fileCache.set(path,content);
    }
    return fileCache.get(path);
  };
  const lastRevision = path => {
    if(!revisionCache.has(path)){
      let value=null;
      try {value=codeRevision(root,path)} catch { /* no git history */ }
      revisionCache.set(path,value);
    }
    return revisionCache.get(path);
  };
  let checkedEvidence=0, current=0;
  for(const profile of [...profiles].filter(x=>x.curatedSource).sort((a,b)=>stableSort(a.component,b.component))) {
    const reviewedOn=profile.provenance?.reviewedOn ?? null;
    const start=diagnostics.length;
    let count=0;
    for(const cap of [...(profile.capabilities??[])].sort((a,b)=>stableSort(a.id,b.id))) {
      if(cap.state!=="implemented-static-evidence")continue;
      for(const source of [...(cap.evidence??[])].sort((a,b)=>stableSort(a.path,b.path)||stableSort(a.contains,b.contains))){
        checkedEvidence++;count++;
        const text=readEvidence(source.path);
        let status, reason, changedAt=null;
        if(text===null) {
          status="missing-evidence";reason="file-missing-or-unreadable";
        }else if(!text.includes(source.contains)) {
          status="missing-evidence";reason="literal-needle-not-found";
        }else {
          const revision=lastRevision(source.path);
          changedAt=revision?.changedAt??null;
          if(revision?.dirty) {
            status="review-required";reason="uncommitted-implementation-change";
          }else if(changedAt && reviewedOn && changedAt.slice(0,10)>reviewedOn) {
            status="review-required";reason="implementation-changed-after-review";
          }else if(!changedAt || !/^\d{4}-\d\d-\d\d$/.test(reviewedOn??"")){
            status="history-unavailable";reason="no-comparable-change-history";
          }else {
            status="current";reason="no-later-code-change-detected";current++;
          }
        }
        if(status!=="current")diagnostics.push({
          status,reason,component:profile.component,overlay:profile.curatedSource,
          capabilityId:cap.id,evidencePath:source.path,contains:source.contains,
          reviewedOn,changedAt,action:actions[status],
        });
      }
    }
    const statuses=diagnostics.slice(start).map(d=>d.status);
    const status=statuses.includes("missing-evidence")?"missing-evidence":
      statuses.includes("review-required")?"review-required":
      statuses.includes("history-unavailable")?"history-unavailable":"current";
    components.push({
      component:profile.component,overlay:profile.curatedSource,reviewedOn,
      checkedEvidence:count,status,diagnostics:diagnostics.length-start,
    });
  }
  const tally=status=>diagnostics.filter(d=>d.status===status).length;
  return {
    policy:"advisory-review-only; no mutation of capability state or Pi/admission authorization",
    method:"literal-evidence-plus-git-last-code-change-after-documentation-review-day",
    summary:{
      curatedComponents:components.length,checkedEvidence,current,
      reviewRequired:tally("review-required"),missingEvidence:tally("missing-evidence"),
      historyUnavailable:tally("history-unavailable"),
      affectedComponents:components.filter(c=>c.status!=="current").length,
    },
    components,diagnostics,
  };
}
