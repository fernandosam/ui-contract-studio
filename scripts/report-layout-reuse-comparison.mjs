#!/usr/bin/env node
/** E05: read-only catalog comparison; --report creates a non-authoritative CI artifact. */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {dirname} from "node:path";
import {buildLayoutReuse,readLayoutPatterns} from "./lib/layout-reuse.mjs";
import {compareLayoutReuseWithCatalog} from "./lib/layout-reuse-comparison.mjs";
const flags=process.argv.slice(2);
if(flags.length>1||flags.some(x=>!["--check","--report"].includes(x))){
 console.error("Usage: node scripts/report-layout-reuse-comparison.mjs [--check|--report]");
 process.exit(2);
}
try{
 const read=p=>JSON.parse(readFileSync(p,"utf8"));
 const lock=read("src/ui-catalog/contracts.lock.json");
 const evidence=buildLayoutReuse(readLayoutPatterns(),lock.components.map(x=>x.name));
 const reviewed=read("src/ui-requirements/layout-reuse-evidence.json");
 if(JSON.stringify(evidence)!==JSON.stringify(reviewed))
  throw Error("Stale E05 evidence; run npm run patterns:reuse:check and review the snapshot before comparing");
 const result=compareLayoutReuseWithCatalog(evidence,lock,
  read("src/ui-catalog/extensions/composites/generated-manifest.json"),read);
 const serialized=JSON.stringify(result,null,2)+"\n";
 if(flags.includes("--report")){
  const dest="reports/layout-reuse/comparison.json";
  mkdirSync(dirname(dest),{recursive:true});
  writeFileSync(dest,serialized);
  console.log("Wrote "+dest);
 }
 console.log("✓ E05 comparison: "+result.summary.candidateCount+" relations, "+
  result.summary.matchedCandidateCount+" found in approved JSON composites, "+
  result.summary.primitiveOnlyCount+" covered by primitives alone; "+
  result.summary.reviewedCompositeCount+" composites inspected.");
}catch(error){
 console.error("✗ E05 catalog comparison: "+error.message);
 process.exitCode=1;
}
