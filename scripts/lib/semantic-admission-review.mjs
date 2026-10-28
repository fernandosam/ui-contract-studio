/**
 * T24 — read-only bridge from the T22/T23 semantic audit to the Admission Engine.
 *
 * A semantic candidate is NEVER an admission request. Only the existing policy,
 * reviewed code recipes, registry entries, fingerprints and E2E protocols govern
 * the executable experimental catalog and stable promotion.
 */
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {buildSemanticKnowledge} from "./semantic-knowledge.mjs";
import {evaluatePolicy} from "./admission-policy.mjs";
import {buildSemanticCompositionProposals} from "../../src/ui-catalog/recommendations/semantic-gap-proposals.mjs";

const read=(root,path)=>JSON.parse(readFileSync(join(root,path),"utf8"));
const key=ref=>ref.component+"/"+ref.capability;
const decisions=[
  "existing-experimental-contract","existing-stable-contract",
  "not-allowlisted","blocked-proposal","blocked-policy","blocked-admission-integrity",
];

export function evaluateSemanticAdmissionReview({
  proposalReport, capabilityAudit, policy, recipes, scenarios, lock, pi,
  entries, protocols, sources, policyErrors,
}) {
  if(!Array.isArray(policyErrors))
    throw Error("T24 requires the authoritative Admission Engine policy decision");
  if(proposalReport?.schemaVersion!==1 || proposalReport.authority!=="advisory-only" ||
     !Array.isArray(proposalReport.proposals) || !Array.isArray(capabilityAudit?.gaps))
    throw Error("T24 requires a reviewed T23 advisory report and T22 audit");
  const scenarioById=new Map(scenarios.scenarios.map(x=>[x.id,x]));
  const recipeById=new Map(recipes.recipes.map(x=>[x.id,x]));
  const entryById=new Map(entries.entries.map(x=>[x.id,x]));
  const piByType=new Map(pi.components.map(x=>[x.type,x]));
  const auditedGaps=new Map(capabilityAudit.gaps.map(x=>[key(x),x]));
  const approved=new Set(lock.components.filter(x=>x.status==="approved").map(x=>x.name));
  const allowlisted=new Set(policy.allowedScenarios??[]);
  const seen=new Set();
  const rows=[];

  for(const proposal of proposalReport.proposals) {
    const scenario=scenarioById.get(proposal.scenarioId);
    const recipe=recipeById.get(proposal.scenarioId);
    const entry=entryById.get(proposal.scenarioId);
    const protocol=protocols.candidates?.[proposal.scenarioId];
    const official=piByType.get(proposal.target);
    const problems=[];
    if(seen.has(proposal.id))problems.push("duplicate-proposal-id");
    seen.add(proposal.id);
    if(!scenario || proposal.id!=="gap-"+proposal.scenarioId ||
       scenario.family!==proposal.family || scenario.strategy!==proposal.strategy ||
       scenario.target!==proposal.target)
      problems.push("scenario-identity-mismatch");
    if(proposal.approval!=="candidate-not-admitted" || proposal.canUseInPi!==false)
      problems.push("proposal-claims-admission");
    if(!Array.isArray(proposal.originGaps) || !proposal.originGaps.length ||
       proposal.originGaps.some(ref=>{
         const audit=auditedGaps.get(key(ref));
         return !audit || audit.availability!==ref.availability ||
           audit.state!==ref.state || audit.source!==ref.source;
       }))problems.push("missing-or-altered-audited-gap");
    if(!Array.isArray(proposal.requiredCapabilities) ||
       proposal.requiredCapabilities.length!==scenario?.requiredCapabilities?.length ||
       proposal.requiredCapabilities.some(ref=>
         !scenario?.requiredCapabilities.includes(ref.capability) ||
         ref.component!==scenario.family))
      problems.push("required-capabilities-mismatch");
    if(!Array.isArray(proposal.dependencies) ||
       proposal.dependencies.length!==scenario?.dependencies?.length ||
       proposal.dependencies.some((dep,i)=>dep.name!==scenario?.dependencies[i] ||
         dep.approvedPiType!==approved.has(dep.name)))
      problems.push("dependency-provenance-mismatch");

    let decision, blockers=[...problems];
    if(problems.length || proposal.status!=="candidate-review-only" ||
       proposal.strategy!=="react-candidate"){
      decision="blocked-proposal";
      if(proposal.status!=="candidate-review-only")blockers.push("semantic-status-"+proposal.status);
      if(proposal.strategy!=="react-candidate")blockers.push("not-a-react-candidate");
    }else if(!allowlisted.has(proposal.scenarioId)){
      decision="not-allowlisted";
      blockers.push("requires-independent-policy-opt-in");
    }else if(policyErrors.length){
      decision="blocked-policy";
      blockers.push("existing-admission-policy-invalid");
    }else if(!recipe || recipe.review!=="required" ||
       recipe.target!==proposal.target || !entry ||
       entry.type!==proposal.target || entry.recipeId!==proposal.scenarioId ||
       !protocol || protocol.target!==proposal.target ||
       entry.e2eProtocol!==protocol.protocol ||
       !scenario.dependencies.every(name=>approved.has(name)) ||
       !official || official.tier!=="composition" ||
       !["stable","experimental"].includes(official.lifecycle) ||
       official.sourceDigest!==entry.sourceDigest){
      decision="blocked-admission-integrity";
      blockers.push("official-recipe-registry-or-protocol-mismatch");
    }else{
      decision=official.lifecycle==="stable"
        ?"existing-stable-contract":"existing-experimental-contract";
    }
    rows.push({
      proposalId:proposal.id,scenarioId:proposal.scenarioId,
      target:proposal.target,sourceGaps:(proposal.originGaps??[]).map(key),
      documentation:"reviewed-guidance-only",
      recommendation:"advisory-only",
      proposal:{status:proposal.status,admission:"candidate-not-admitted"},
      decision,blockers,
      existingPi:{
        type:official?.type??null,lifecycle:official?.lifecycle??null,
        matchedOfficialRegistry:decision==="existing-stable-contract" ||
          decision==="existing-experimental-contract",
      },
      mayActivateFromSemantics:false,mayPublishNewPiType:false,
      mayCertifyE2e:false,
    });
  }
  rows.sort((a,b)=>a.proposalId.localeCompare(b.proposalId));
  return {
    schemaVersion:1,authority:"evaluation-only",activation:"none",
    disclaimer:"This review neither admits candidates nor changes the authoritative Pi catalog. Existing admission gates and manual, revision-bound E2E certification remain mandatory.",
    sources:[
      "src/ui-catalog/knowledge/","src/ui-catalog/recommendations/scenarios.json",
      "src/ui-catalog/admission-engine/policy.json",
      "src/ui-catalog/admission-engine/entries.json",
      "src/ui-catalog/admission-engine/protocols.json",
      "pi-catalog/contracts.json",
    ],
    summary:{
      proposals:rows.length,uncoveredGaps:proposalReport.uncoveredGaps?.length??0,
      allowlistedWithoutT23Proposal:(policy.allowedScenarios??[]).filter(id=>
        !rows.some(row=>row.scenarioId===id)),
      byDecision:Object.fromEntries(decisions.map(d=>[d,rows.filter(r=>r.decision===d).length])),
    },
    evaluations:rows,
  };
}

/**
 * Reconstruct source evidence on disk; never trust a stored advisory report as
 * an allowlist, registry declaration or certification. This remains read-only.
 */
export function reviewSemanticAdmissionsAtRoot(root) {
  const baseline=read(root,"src/ui-catalog/reui-primitive-source-baseline.json");
  const reuiExamples=baseline.entries.map(x=>({
    id:x.exampleId,family:x.family,sourcePath:x.sourcePath,decision:x.semanticDecision,
  }));
  const {report,errors}=buildSemanticKnowledge({root,reuiExamples});
  if(errors.length)throw Error("T24 semantic audit failed: "+errors.join("; "));
  const scenarios=read(root,"src/ui-catalog/recommendations/scenarios.json");
  const lock=read(root,"src/ui-catalog/contracts.lock.json");
  const proposals=buildSemanticCompositionProposals({
    capabilityAudit:report.capabilityAudit,scenarios:scenarios.scenarios,
    approvedPiTypes:lock.components.filter(x=>x.status==="approved").map(x=>x.name),
  });
  if(proposals.summary.coveredGaps+proposals.summary.uncoveredGaps!==
      proposals.summary.auditGaps)
    throw Error("T24 T22/T23 audit coverage mismatch");
  const policy=read(root,"src/ui-catalog/admission-engine/policy.json");
  const recipes=read(root,"scripts/composition-codegen/recipes.json");
  const pi=read(root,"pi-catalog/contracts.json");
  const sources=read(root,"src/ui-catalog/sources.json");
  const protocols=read(root,"src/ui-catalog/admission-engine/protocols.json");
  const policyErrors=evaluatePolicy({policy,recipes,scenarios,lock,pi,sources,protocols});
  return evaluateSemanticAdmissionReview({
    policyErrors,proposalReport:proposals,capabilityAudit:report.capabilityAudit,scenarios,lock,
    policy,recipes,pi,sources,
    entries:read(root,"src/ui-catalog/admission-engine/entries.json"),
    protocols,
  });
}
