#!/usr/bin/env node
import {
  getCompositionRecommendation, recommendFromRequirement, recommendationScenarios,
  pilotFamilies,
} from "../src/ui-catalog/recommendations/engine";

const args=process.argv.slice(2);
const option=(name:string)=>args.find(x=>x.startsWith(name+"="))?.slice(name.length+1);
const id=option("--id"),text=option("--text"),family=option("--family");
if((id?1:0)+(text?1:0)!==1 || (family && !pilotFamilies.some(x=>x===family))){
  console.error("Usage: --id=alert-typed OR --text='copiar com feedback' [--family=Button]");
  console.error("Available IDs: "+recommendationScenarios.map(x=>x.id).join(", "));
  process.exit(2);
}
const recommendation=id?getCompositionRecommendation(id):null;
const found=text?recommendFromRequirement(text,
  family as (typeof pilotFamilies)[number]|undefined):null;
const selected=found?.status==="matched"?found.recommendation:recommendation;
if(!selected) {
  console.error(JSON.stringify(found??{status:"unrecognized",message:"Unknown reviewed scenario"},null,2));
  process.exit(2);
}
console.log(JSON.stringify(selected,null,2));
