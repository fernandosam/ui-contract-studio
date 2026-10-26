#!/usr/bin/env node
import {mkdirSync,writeFileSync} from "node:fs";
import {dirname} from "node:path";
import {buildSemanticKnowledge} from "./lib/semantic-knowledge.mjs";

const args=process.argv.slice(2);
const component=args.find(x=>x.startsWith("--component="))?.slice("--component=".length);
const write=args.includes("--write");
const {report,errors}=buildSemanticKnowledge();
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
  console.log("  Documentary suggestions and unverified requirements are advisory only.");
}
if(write){
  const path="reports/composition-analysis/semantic-knowledge.json";
  mkdirSync(dirname(path),{recursive:true});
  writeFileSync(path,JSON.stringify(report,null,2)+"\n");
  console.log("✓ Wrote "+path);
}
