import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { auditSemanticFreshness, getCodeRevision } from "../scripts/lib/semantic-freshness.mjs";
import { buildSemanticKnowledge } from "../scripts/lib/semantic-knowledge.mjs";

const codePath="src/ui-catalog/extensions/components/demo.tsx";
const needle="export function Demo";
const profile=()=>({
  component:"Demo",curatedSource:"src/ui-catalog/knowledge/demo.json",
  provenance:{reviewedOn:"2026-10-20"},approvedPiType:false,
  capabilities:[
    {id:"render",state:"implemented-static-evidence",
      evidence:[{path:codePath,contains:needle}]},
    {id:"future",state:"documented-not-implemented",evidence:[]},
    {id:"keyboard",state:"runtime-review-required",evidence:[]},
  ],
});
const fixture=fn=>{
  const root=mkdtempSync(join(tmpdir(),"ui-semantic-t27-"));
  const full=join(root,codePath);
  mkdirSync(dirname(full),{recursive:true});
  writeFileSync(full,needle+"() { return true; }\n");
  try {return fn({root,full})} finally {rmSync(root,{recursive:true,force:true})}
};
const revision=(changedAt,dirty=false)=>()=>({changedAt,dirty});
const git=(root,args,date)=> {
  const out=spawnSync("git",args,{
    cwd:root,encoding:"utf8",
    env:{...process.env,...(date?{GIT_AUTHOR_DATE:date,GIT_COMMITTER_DATE:date}:{})},
  });
  assert.equal(out.status,0,out.stderr||out.stdout);
};
const commit=(root,date,message)=>{
  git(root,["add",codePath]);
  git(root,["-c","user.email=test@example.org","-c","user.name=T27",
    "commit","-q","-m",message],date);
};

test("T27: unchanged implementation with evidence and review date is current",()=>fixture(({root})=>{
  const input=profile();
  const original=JSON.stringify(input);
  const result=auditSemanticFreshness({root,profiles:[input],
    codeRevision:revision("2026-10-19T16:00:00Z")});
  assert.deepEqual(result.diagnostics,[]);
  assert.deepEqual(result.summary,{
    curatedComponents:1,checkedEvidence:1,current:1,reviewRequired:0,
    missingEvidence:0,historyUnavailable:0,affectedComponents:0,
  });
  assert.equal(result.components[0].status,"current");
  assert.equal(JSON.stringify(input),original);
}));

test("T27: changed implementation with still-present needle needs explicit review",()=>fixture(({root,full})=>{
  git(root,["init","-q"]);
  commit(root,"2026-10-19T12:00:00Z","first evidence");
  assert.equal(auditSemanticFreshness({root,profiles:[profile()]}).summary.current,1);
  writeFileSync(full,needle+"() { return false; }\n");
  commit(root,"2026-10-22T12:00:00Z","implementation changed");
  const result=auditSemanticFreshness({root,profiles:[profile()]});
  assert.equal(result.summary.reviewRequired,1);
  const diagnostic=result.diagnostics[0];
  assert.equal(diagnostic.status,"review-required");
  assert.equal(diagnostic.reason,"implementation-changed-after-review");
  assert.equal(diagnostic.component,"Demo");
  assert.equal(diagnostic.capabilityId,"render");
  assert.equal(diagnostic.evidencePath,codePath);
  assert.equal(diagnostic.reviewedOn,"2026-10-20");
  assert.match(diagnostic.changedAt,/^2026-10-22/);
  assert.match(diagnostic.action,/Revisar/);
  assert.equal(result.components[0].status,"review-required");
}));

test("T27: removed file and vanished literal are missing evidence, not a code-change warning",()=>fixture(({root,full})=>{
  const unchanged=revision("2026-10-25T12:00:00Z");
  writeFileSync(full,"export function Other() {}\n");
  let result=auditSemanticFreshness({root,profiles:[profile()],codeRevision:unchanged});
  assert.equal(result.diagnostics[0].status,"missing-evidence");
  assert.equal(result.diagnostics[0].reason,"literal-needle-not-found");
  assert.equal(result.summary.reviewRequired,0);
  unlinkSync(full);
  result=auditSemanticFreshness({root,profiles:[profile()],codeRevision:unchanged});
  assert.equal(result.diagnostics[0].reason,"file-missing-or-unreadable");
  assert.equal(result.summary.missingEvidence,1);
  assert.equal(result.components[0].status,"missing-evidence");
}));

test("T27: uncommitted implementation edits and unavailable Git history stay distinguishable",()=>fixture(({root})=>{
  let result=auditSemanticFreshness({root,profiles:[profile()],
    codeRevision:revision("2026-10-19T12:00:00Z",true)});
  assert.equal(result.diagnostics[0].reason,"uncommitted-implementation-change");
  result=auditSemanticFreshness({root,profiles:[profile()],codeRevision:()=>null});
  assert.equal(result.diagnostics[0].status,"history-unavailable");
  assert.equal(result.summary.current,0);
  assert.equal(result.summary.historyUnavailable,1);
  assert.equal(getCodeRevision(root,codePath),null);
}));

test("T27: deterministic component ordering, no promotion from documentary guidance",()=>fixture(({root})=>{
  const second={...profile(),component:"Other",
    curatedSource:"src/ui-catalog/knowledge/other.json",
    capabilities:[{id:"future",state:"documented-not-implemented",evidence:[]}]};
  const first=profile();
  const options={root,profiles:[second,first],codeRevision:revision("2026-10-19T12:00:00Z")};
  const left=auditSemanticFreshness(options);
  const right=auditSemanticFreshness({...options,profiles:[first,second]});
  assert.deepEqual(left,right);
  assert.deepEqual(left.components.map(x=>x.component),["Demo","Other"]);
  assert.equal(left.components[1].checkedEvidence,0);
  assert.equal(left.policy.includes("no mutation"),true);
  assert.equal(first.approvedPiType,false);
}));

test("T27: existing semantic report embeds audit without changing admission or contracts",()=>{
  const {report,errors}=buildSemanticKnowledge();
  assert.deepEqual(errors,[]);
  const freshness=report.semanticFreshness;
  assert.ok(freshness.summary.curatedComponents>0);
  assert.equal(freshness.summary.checkedEvidence,
    freshness.summary.current+freshness.summary.reviewRequired+
    freshness.summary.missingEvidence+freshness.summary.historyUnavailable);
  assert.equal(freshness.summary.missingEvidence,0);
  assert.ok(freshness.diagnostics.every(d=>
    d.overlay.startsWith("src/ui-catalog/knowledge/")&&
    d.evidencePath.startsWith("src/")&&
    typeof d.action==="string"));
  assert.match(report.disclaimer,/do not authorize/);
  assert.equal(report.profiles.find(x=>x.component==="AlertDialog").capabilities
    .find(x=>x.id==="confirm-signal").state,"implemented-static-evidence");
});
