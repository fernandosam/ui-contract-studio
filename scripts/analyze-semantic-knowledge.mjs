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
const freshness=report.semanticFreshness;
// Review warnings never approve or change a capability. Missing evidence still
// fails through validateSemanticOverlay and cannot be published as a valid report.
for(const d of freshness.diagnostics) {
  const prefix=d.status==="missing-evidence"?"✗":d.status==="review-required"?"!":"?";
  console.error(prefix+" ["+d.status+"] "+d.overlay+"#"+d.capabilityId+
    " -> "+d.evidencePath+" (reviewed "+d.reviewedOn+
    (d.changedAt?", code "+d.changedAt:"")+") "+d.reason+"; "+d.action);
}
if(errors.length) {
  errors.forEach(message=>console.error("✗ "+message));
} else if(component) {
  const profile=report.profiles.find(x=>x.component===component);
  if(!profile){console.error("Unknown semantic profile: "+component);process.exit(2)}
  console.log(JSON.stringify({
    ...profile,
    codeFreshness:freshness.components.find(x=>x.component===component)??null,
    codeFreshnessDiagnostics:freshness.diagnostics.filter(x=>x.component===component),
    testAutomation:report.semanticTestAutomation.entries.filter(x=>x.component===component),
    contractConformance:report.semanticConformance.components.find(x=>x.component===component)??null,
    contractConformanceCapabilities:report.semanticConformance.entries.filter(x=>x.component===component),
  },null,2));
} else {
  console.log("✓ Semantic guidance validated: "+JSON.stringify(report.coverage));
  console.log("  Capability audit: "+JSON.stringify(report.capabilityAudit.summary));
  console.log("  Contract conformance (mandatory): "+JSON.stringify(report.semanticConformance.summary));
  console.log("  T23 composition proposals: "+JSON.stringify(compositionProposals.summary));
  console.log("  Derived test automation (registered / partial / pending / blocked / invalid): "+
    JSON.stringify(report.semanticTestAutomation.summary));
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
  console.log("  Evidence freshness (current / review required / missing / history unavailable): "+
    freshness.summary.current+" / "+freshness.summary.reviewRequired+" / "+
    freshness.summary.missingEvidence+" / "+freshness.summary.historyUnavailable);
  console.log("  Documentary suggestions and unverified requirements are advisory only.");
}
if(write) {
  const path="reports/composition-analysis/semantic-knowledge.json";
  // Keep the T26 report path and the T27 checks. Failed validation is still
  // exit code 1, but the diagnostic artifact remains inspectable in CI.
  // Consumers MUST reject reports explicitly marked as failed.
  const output=errors.length ? {
    ...report,validation:{status:"failed",errors},
  } : report;
  mkdirSync(dirname(path),{recursive:true});
  writeFileSync(path,JSON.stringify(output,null,2)+"\n");
  console.log((errors.length?"✗ Wrote INVALID diagnostic report: ":"✓ Wrote ")+path);
  const auditPath="reports/composition-analysis/semantic-capability-gaps.json";
  writeFileSync(auditPath,JSON.stringify(report.capabilityAudit,null,2)+"\n");
  console.log("✓ Wrote "+auditPath);
  const proposalPath="reports/composition-analysis/semantic-composition-proposals.json";
  writeFileSync(proposalPath,JSON.stringify(compositionProposals,null,2)+"\n");
  console.log("✓ Wrote "+proposalPath);
}
if(errors.length)process.exitCode=1;
