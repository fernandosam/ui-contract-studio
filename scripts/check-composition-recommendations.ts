import {existsSync,readFileSync} from "node:fs";
import {recommendationScenarios,validateRecommendationPolicy,getCompositionRecommendation,recommendFromRequirement} from "../src/ui-catalog/recommendations/engine";

const errors=validateRecommendationPolicy();
if(errors.length){
  errors.forEach(error=>console.error("✗ "+error));
  process.exit(1);
}
const ids=new Set(recommendationScenarios.map(x=>x.id));
if(ids.size!==recommendationScenarios.length){
 console.error("✗ Duplicate scenario IDs");
 process.exit(1);
}
const selectedKinds=new Set<string>();
for(const scenario of recommendationScenarios){
 const result=getCompositionRecommendation(scenario.id);
 if(!result || result.authorization!=="advisory-only" ||
    result.tests.length===0 || result.tests.some(x=>x.status!=="planned-not-executed")){
   console.error("✗ Recommendation evidence or plan invalid: "+scenario.id);
   process.exit(1);
 }
 for(const capability of result.evidence){
   if(capability.availability!=="verified-static")continue;
   if(!capability.codeEvidence.length || capability.codeEvidence.some(source=>
     !source.path.startsWith("src/") || source.path.includes("..") ||
     !existsSync(source.path) || !readFileSync(source.path,"utf8").includes(source.contains))){
     console.error("✗ Static evidence missing or stale: "+scenario.id+" / "+capability.capability);
     process.exit(1);
   }
 }
 selectedKinds.add(result.selection.kind);
 for(const criterion of result.selection.criteria){
   if(!criterion.rule.trim() || !criterion.reference.trim() ||
      criterion.reference.includes("..") || !existsSync(criterion.reference)){
     console.error("✗ Unsupported decision criterion/reference: "+scenario.id+" / "+criterion.reference);
     process.exit(1);
   }
 }
 if(result.selection.status==="available-approved-contract" &&
    (result.decision!=="reuse-contract" || !result.targetApproved || !result.target)){
   console.error("✗ Reuse selection must resolve a previously approved Pi type: "+scenario.id);
   process.exit(1);
 }
 if(result.selection.kind==="declarative-composition" &&
    (result.decision!=="declarative-composition" || result.target!==null ||
      result.targetApproved || !result.dependencies.every(d=>d.piApproved) ||
      result.evidence.length===0 || result.evidence.some(e=>e.availability!=="verified-static"))){
   console.error("✗ Declarative path bypasses Pi/semantic evidence: "+scenario.id);
   process.exit(1);
 }
 if(result.selection.status==="candidate-needs-admission" &&
     (result.decision!=="react-candidate" || result.targetApproved)){
   console.error("✗ React candidate bypasses admission: "+scenario.id);
   process.exit(1);
 }
 if(result.selection.kind==="authorization-review" && result.targetApproved){
   console.error("✗ Authorization review cannot approve contracts: "+scenario.id);
   process.exit(1);
 }
 if(result.decision!=="reuse-contract" && result.targetApproved){
   console.error("✗ Candidate cannot become approved automatically: "+scenario.id);
   process.exit(1);
 }
 const matched=recommendFromRequirement(scenario.keywords[0],scenario.family);
 if(matched.status==="matched" && matched.recommendation.scenario.id!==scenario.id){
   console.error("✗ Scenario phrase maps to another scenario: "+scenario.id);
   process.exit(1);
 }
}
for(const kind of ["primitive","declarative-composition","react-composition","authorization-review"]){
 if(!selectedKinds.has(kind)){
   console.error("✗ Missing recommendation approach: "+kind);
   process.exit(1);
 }
}
console.log("✓ "+recommendationScenarios.length+" deterministic scenarios; primitive/declarative/React/review verified; Pi admissions unchanged.");
