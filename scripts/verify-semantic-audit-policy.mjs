#!/usr/bin/env node
/**
 * T33: repository-local invariant against accidentally bypassing semantic
 * conformance checks. GitHub branch rules must separately require the job.
 * No executable contract, schema or admission state is modified here.
 */
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {browserRequired,isDocumentationOnly} from "./ci-change-impact.mjs";

const read=path=>readFileSync(path,"utf8");
export function semanticAuditEnforcementViolations({
  workflow=read(".github/workflows/quality.yml"),
  scripts=JSON.parse(read("package.json")).scripts,
  analyzer=read("scripts/lib/semantic-knowledge.mjs"),
  runner=read("scripts/run-checks.mjs"),
}={}) {
  const errors=[];
  const trigger=(workflow.split(/^permissions:/m)[0]??"");
  if(!/^on:\s*$/m.test(trigger) || !/^ {2}pull_request:\s*$/m.test(trigger) ||
    !/^ {2}push:\s*$/m.test(trigger) ||
    (trigger.match(/branches: \[main\]/g)??[]).length<2)
    errors.push("Quality must run for PRs and main pushes.");
  if(/^\s*(?:paths|paths-ignore):/m.test(trigger))
    errors.push("Path-filtered quality workflow can skip semantic knowledge changes.");
  const job=workflow.split(/^ {2}offline-policy:\s*$/m)[1]?.split(/^ {2}[a-z][a-z-]+:\s*$/m)[0]??"";
  if(!job || /^ {4}if:/m.test(job))
    errors.push("offline-policy must be unconditional.");
  if(!/npm run semantic:check 2>&1 \| tee reports\/composition-analysis\/semantic-check\.log/.test(job) ||
    !/id: semantic-check/.test(job))
    errors.push("Blocking semantic:check/log step is missing.");
  if(/continue-on-error:\s*true|\|\|\s*true|set \+e/.test(job))
    errors.push("Semantic audit failures must never be suppressed.");
  if(!/npm run semantic:report 2>&1 \| tee reports\/composition-analysis\/semantic-report\.log/.test(job) ||
    !/semantic-knowledge\.json/.test(job) ||
    !/actions\/upload-artifact@v(?:4|7)/.test(job))
    errors.push("Semantic report and diagnostics must remain accessible.");
  if(!/npm run semantic:enforcement/.test(job))
    errors.push("The independent audit-policy guard must run in the offline job.");
  if(scripts["semantic:check"]!=="node scripts/analyze-semantic-knowledge.mjs --check" ||
    scripts["semantic:report"]!=="node scripts/analyze-semantic-knowledge.mjs --write")
    errors.push("Semantic CLI must invoke the existing authoritative analyzer.");
  if(scripts["semantic:enforcement"]!=="node scripts/verify-semantic-audit-policy.mjs")
    errors.push("Audit-policy guard must be registered in npm scripts.");
  if(!runner.includes("analyze-semantic-knowledge.mjs --check") ||
    !analyzer.includes("auditSemanticContractConformance({root,profiles:records,capabilityAudit})") ||
    !analyzer.includes("errors.push(...semanticConformance.errors)"))
    errors.push("Full checks and semantic analyzer must enforce contract conformance.");
  // The existing required integration check must execute derived browser
  // recipes, since the separate focused browser job is not a ruleset gate.
  const integration=workflow.split(/^ {2}integration:\s*$/m)[1]
    ?.split(/^ {2}[a-z][a-z-]+:\s*$/m)[0]??"";
  if(!integration || /^ {4}if:/m.test(integration) ||
     !/tests\/e2e\/declarative-form-certification\.spec\.ts/.test(integration) ||
     !/tests\/e2e\/semantic-derived\.spec\.ts/.test(integration) ||
     !integration.includes("--project=desktop --project=mobile") ||
     /continue-on-error:\s*true|\|\|\s*true|set \+e/.test(integration))
    errors.push("Required integration job must execute semantic-derived browser tests on desktop/mobile without bypass.");
  const changedKnowledge=["src/ui-catalog/knowledge/alert-dialog.json"];
  if(isDocumentationOnly(changedKnowledge) || !browserRequired(changedKnowledge))
    errors.push("Knowledge edits must never be classified as prose-only changes.");
  return errors;
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const errors=semanticAuditEnforcementViolations();
  for(const error of errors)console.error("✗ "+error);
  if(errors.length)process.exitCode=1;
  else console.log("✓ Mandatory semantic audit policy: PR/main triggers, blocking checks, reports, Pi conformance and knowledge impact");
}
