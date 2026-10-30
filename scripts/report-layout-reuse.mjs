#!/usr/bin/env node
/** E05: deterministic, reviewable reuse evidence; read-only unless explicitly --write. */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {dirname} from "node:path";
import {readLayoutPatterns,buildLayoutReuse} from "./lib/layout-reuse.mjs";

const snapshot="src/ui-requirements/layout-reuse-evidence.json";
const artifact="reports/layout-reuse/evidence.json";
const flags=new Set(process.argv.slice(2));
if([...flags].some(flag=>!["--check","--write","--report"].includes(flag))||
 (flags.has("--write")&&(flags.has("--check")||flags.has("--report")))){
 console.error("Usage: node scripts/report-layout-reuse.mjs [--check|--write|--report]");
 process.exit(2);
}
try{
 const lock=JSON.parse(readFileSync("src/ui-catalog/contracts.lock.json","utf8"));
 const allowedTypes=lock.components.map(component=>component.name);
 const report=buildLayoutReuse(readLayoutPatterns(),allowedTypes);
 const serialized=JSON.stringify(report,null,2)+"\n";
 if(flags.has("--write")){
  mkdirSync(dirname(snapshot),{recursive:true});writeFileSync(snapshot,serialized);
  console.log("Updated reviewed snapshot: "+snapshot);
 }else{
  const current=readFileSync(snapshot,"utf8");
  if(current!==serialized)throw Error("Stale E05 reuse evidence: regenerate with npm run patterns:reuse:update and review the diff.");
 }
 if(flags.has("--report")){
  mkdirSync(dirname(artifact),{recursive:true});writeFileSync(artifact,serialized);
  console.log("Generated audit artifact: "+artifact);
 }
 console.log("✓ E05: "+report.summary.approvedLayoutCount+" approved patterns; "+
  report.summary.crossOriginStructureCount+" cross-origin structures; "+
  report.summary.sameOriginCandidateCount+" same-origin candidates.");
}catch(error){
 console.error("✗ E05 layout reuse: "+error.message);
 process.exitCode=1;
}
