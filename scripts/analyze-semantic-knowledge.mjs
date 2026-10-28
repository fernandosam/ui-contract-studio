#!/usr/bin/env node
import {mkdirSync,writeFileSync,readFileSync} from "node:fs";
import {dirname} from "node:path";
import {buildSemanticKnowledge} from "./lib/semantic-knowledge.mjs";
import {buildSemanticCompositionProposals} from "../src/ui-catalog/recommendations/semantic-gap-proposals.mjs";

const args=process.argv.slice(2);
const component=args.find(x=>x.startsWith("--component="))?.slice("--component=".length);
const write=args.includes("--write");
// The same versioned baseline used by the ReUI audit gives the CLI report its
// real example coverage; guidance remains advisory and never admits a Pi type.
const baseline=JSON.parse(readFileSync(new URL("../src/ui-catalog/reui-primitive-source-baseline.json",import.meta.url),"utf8"));
const reuiExamples=baseline.entries.map(x=>({
  id:x.exampleId,family:x.family,sourcePath:x.sourcePath,decision:x.semanticDecision,
}));
const {report,errors}=buildSemanticKnowledge({reuiExamples});
const scenarios=JSON.parse(readFileSync(new URL("../src/ui-catalog/recommendations/scenarios.json",import.meta.url),"utf8")).scenarios;
const approved=JSON.parse(readFileSync(new URL("../src/ui-catalog/contracts.lock.json",import.meta.url),"utf8"))
  .components.filter(x=>x.status==="approved").map(x=>x.name);
const compositionProposals=buildSemanticCompositionProposals({
  capabilityAudit:report.capabilityAudit,scenarios,approvedPiTypes:approved,
});
// Unmapped gaps remain diagnostic; they are not synthetic admitted types.
if(compositionProposals.summary.coveredGaps+compositionProposals.summary.uncoveredGaps!==
   compositionProposals.summary.auditGaps ||
   compositionProposals.proposals.some(x=>x.canUseInPi!==false ||
     x.approval!=="candidate-not-admitted" || !x.originGaps.length))
  errors.push("T23 semantic composition proposal traceability failed");
if(errors.length){
  errors.forEach(message=>console.error("✗ "+message));
  process.exit(1);
}
if(component){
  const profile=report.profiles.find(x=>x.component===component);
  if(!profile){console.error("Unknown semantic profile: "+component);process.exit(2)}
  console.log(JSON.stringify(profile,null,2));
}else{
  console.log("✓ Semantic guidance validated: "+JSON.stringify(report.coverage));
  console.log("  Capability audit: "+JSON.stringify(report.capabilityAudit.summary));
  console.log("  T23 composition proposals: "+JSON.stringify(compositionProposals.summary));
  const coverage=report.semanticCoverage.totals;
  console.log("  ReUI families with curated overlays: "+coverage.curatedFamilies+"/"+coverage.inventoryFamilies);
  console.log("  Components with curated overlays: "+coverage.curatedComponents+"/"+coverage.indexedComponents);
  console.log("  Capabilities (static code evidence / not implemented / runtime review): "+
    coverage.capabilities.implementedStaticEvidence+" / "+
    coverage.capabilities.documentedNotImplemented+" / "+
    coverage.capabilities.runtimeReviewRequired);
  console.log("  Evidence insufficient (runtime): "+coverage.insufficientRuntimeEvidence+
    "; documentary gaps (families/components): "+
    coverage.familiesWithDocumentationGaps+"/"+coverage.componentsWithDocumentationGaps);
  console.log("  Documentary suggestions and unverified requirements are advisory only.");
}
if(write){
  const path="reports/composition-analysis/semantic-knowledge.json";
  mkdirSync(dirname(path),{recursive:true});
  writeFileSync(path,JSON.stringify(report,null,2)+"\n");
  console.log("✓ Wrote "+path);
  const auditPath="reports/composition-analysis/semantic-capability-gaps.json";
  writeFileSync(auditPath,JSON.stringify(report.capabilityAudit,null,2)+"\n");
  console.log("✓ Wrote "+auditPath);
  const proposalPath="reports/composition-analysis/semantic-composition-proposals.json";
  writeFileSync(proposalPath,JSON.stringify(compositionProposals,null,2)+"\n");
  console.log("✓ Wrote "+proposalPath);
}
