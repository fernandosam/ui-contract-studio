#!/usr/bin/env node
/** E05 deterministic, read-only traceability and declarative regression audit. */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {dirname} from "node:path";
import {isDeepStrictEqual} from "node:util";
import {readLayoutPatterns,buildLayoutReuse} from "./lib/layout-reuse.mjs";
import {compareLayoutReuseWithCatalog} from "./lib/layout-reuse-comparison.mjs";
import {buildLayoutCompositionProposals} from "./lib/layout-composition-proposals.mjs";
import {auditE05Reuse} from "./lib/layout-reuse-verification.mjs";

const args=process.argv.slice(2);
if(args.length!==1||!["--check","--report"].includes(args[0])){
 console.error("Usage: node scripts/verify-layout-reuse.mjs --check|--report");
 process.exit(2);
}
try{
 const read=(path)=>JSON.parse(readFileSync(path,"utf8"));
 const lock=read("src/ui-catalog/contracts.lock.json");
 const evidence=buildLayoutReuse(readLayoutPatterns(),lock.components.map(x=>x.name));
 if(!isDeepStrictEqual(evidence,read("src/ui-requirements/layout-reuse-evidence.json")))
  throw Error("Stale E05 reviewed evidence; explicitly review before updating snapshot");
 const manifest=read("src/ui-catalog/extensions/composites/generated-manifest.json");
 const comparison=compareLayoutReuseWithCatalog(evidence,lock,manifest,read);
 const proposals=buildLayoutCompositionProposals(comparison,evidence,lock,
  read("pi-catalog/props-json-schema.json"),read);
 const result=auditE05Reuse({evidence,comparison,proposals,read,
  readRaw:path=>readFileSync(path,"utf8"),
  baseline:read("src/ui-requirements/layout-reuse-regression-baseline.json"),
  allowedTypes:lock.components.filter(x=>x.status==="approved").map(x=>x.name)});
 if(args[0]==="--report"){
  const output="reports/layout-reuse/traceability.json";
  mkdirSync(dirname(output),{recursive:true});
  writeFileSync(output,JSON.stringify(result,null,2)+"\n");
  console.log("Wrote "+output);
 }
 console.log("✓ E05 traceability: "+result.summary.candidateCount+" candidates; "+
  result.summary.traceableOccurrences+" occurrences; 0 runtime equivalences certified. "+
  "No contracts or Pi permissions changed.");
}catch(error){
 console.error("✗ E05 traceability/regression audit: "+error.message);
 process.exitCode=1;
}
