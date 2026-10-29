#!/usr/bin/env node
/**
 * Narrow, auditable eligibility decision for native GitHub auto-merge.
 * The privileged CI job runs THIS FILE FROM THE PR BASE, not from the PR head.
 * All files/renames are read from the paginated GitHub pull-files API.
 *
 * This does not decide that tests passed: the protected main ruleset does.
 */
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

const sensitive=[
  /^\.github\//,
  /^(?:package(?:-lock)?\.json|pnpm-lock\.yaml|yarn\.lock)$/,
  /^scripts\/(?:ci-|check-contract-|verify-semantic-audit-policy|run-checks|build-pi-api|admission-engine|admission-evidence|sync-admission-catalog|lib\/admission-)/,
  /^src\/ui-catalog\/admission-engine\//,
  /^src\/ui-catalog\/(?:contracts\.lock\.json|catalog\.ts|registry\.tsx)$/,
  /^src\/ui-catalog\/extensions\/catalog\.ts$/,
  /^src\/ui-requirements\/submission-/,
  /^src\/ui-runtime\/spec-screen\.tsx$/,
  /^scripts\/lib\/spec-invariants\.mjs$/,
  /^\.pi\/extensions\//,
  /^pi-catalog\/(?:contracts\.json|.*\.schema\.(?:json|ts))$/,
  /^(?:server|backend|api)\//,
];

export function autoMergeEligibility(pages){
  if(!Array.isArray(pages)||pages.length===0)
    return {eligible:false,reason:"Missing paginated PR changes"};
  const rows=pages.flatMap(page=>Array.isArray(page)?page:[null]);
  if(!rows.length)return {eligible:false,reason:"Empty PR diff"};
  // GitHub caps the PR-files API at 3,000 paths. Do not trust a truncated audit.
  if(rows.length>=3000)return {eligible:false,reason:"PR diff may exceed GitHub file-list limit"};
  const files=[];
  for(const row of rows){
    if(!row||typeof row.filename!=="string"||
       !row.filename||/[\r\n\0]/.test(row.filename)||
       row.filename.startsWith("/")||row.filename.split("/").includes(".."))
      return {eligible:false,reason:"Invalid PR file metadata"};
    files.push(row.filename);
    if(row.status==="renamed"){
      if(typeof row.previous_filename!=="string"||!row.previous_filename)
        return {eligible:false,reason:"Missing rename origin"};
      files.push(row.previous_filename);
    }
  }
  for(const path of files){
    if(sensitive.some(pattern=>pattern.test(path)))
      return {eligible:false,reason:"Sensitive change requires ordinary review: "+path};
  }
  return {eligible:true,reason:files.length+" safe paths; required branch checks still apply"};
}

function main(){
  const file=process.argv[2];
  if(!file||process.argv.length!==3)throw Error("Usage: node scripts/ci-auto-merge-policy.mjs <gh-api-files.json>");
  const decision=autoMergeEligibility(JSON.parse(readFileSync(file,"utf8")));
  console.error("Auto-merge: "+decision.reason);
  console.log(decision.eligible?"eligible":"review-required");
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{main()}catch(error){console.error("Auto-merge: "+error.message);process.exitCode=1}
}
