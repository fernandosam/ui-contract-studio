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
for(const scenario of recommendationScenarios){
 const result=getCompositionRecommendation(scenario.id);
 if(!result || result.authorization!=="advisory-only" ||
    result.tests.length===0 || result.tests.some(x=>x.status!=="planned-not-executed")){
   console.error("✗ Recommendation evidence or plan invalid: "+scenario.id);
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
console.log("✓ "+recommendationScenarios.length+" deterministic recommendation scenarios validated; Pi admissions unchanged.");
