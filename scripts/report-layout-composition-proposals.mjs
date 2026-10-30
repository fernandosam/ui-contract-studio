#!/usr/bin/env node
/** E05: deterministic advisory proposals; report is a CI artifact, never admission input. */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {dirname} from "node:path";
import {readLayoutPatterns,buildLayoutReuse} from "./lib/layout-reuse.mjs";
import {compareLayoutReuseWithCatalog} from "./lib/layout-reuse-comparison.mjs";
import {buildLayoutCompositionProposals} from "./lib/layout-composition-proposals.mjs";

const flags=process.argv.slice(2);
if(flags.length!==1||!["--check","--report"].includes(flags[0])){
 console.error("Usage: node scripts/report-layout-composition-proposals.mjs --check|--report");
 process.exit(2);
}
try{
 const read=path=>JSON.parse(readFileSync(path,"utf8"));
 const lock=read("src/ui-catalog/contracts.lock.json");
 const evidence=buildLayoutReuse(readLayoutPatterns(),lock.components.map(x=>x.name));
 if(JSON.stringify(evidence)!==JSON.stringify(read("src/ui-requirements/layout-reuse-evidence.json")))
  throw Error("Stale E05 source evidence: review npm run patterns:reuse:update before proposing");
 const comparison=compareLayoutReuseWithCatalog(evidence,lock,
  read("src/ui-catalog/extensions/composites/generated-manifest.json"),read);
 const proposals=buildLayoutCompositionProposals(comparison,evidence,lock,
  read("pi-catalog/props-json-schema.json"),read);
 if(flags[0]==="--report"){
  const dest="reports/layout-reuse/proposals.json";
  mkdirSync(dirname(dest),{recursive:true});
  writeFileSync(dest,JSON.stringify(proposals,null,2)+"\n");
  console.log("Wrote "+dest);
 }
 console.log("✓ E05 proposed interfaces: "+proposals.summary.candidateCount+
  " candidates ("+proposals.summary.independentOriginCount+" independent origins, "+
  proposals.summary.sameOriginCount+" same-origin observations); "+
  proposals.summary.existingCompositeReviewCount+" reuse reviews, "+
  proposals.summary.primitiveAssemblyCount+" primitive assemblies. No admission.");
}catch(error){
 console.error("✗ E05 composition proposal check: "+error.message);
 process.exitCode=1;
}
