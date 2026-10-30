import {readFileSync} from "node:fs";
import {resolveAnswers} from "../src/ui-requirements/engine";
import {verifyInterface} from "../src/ui-requirements/verify";
import {planInterface} from "../src/ui-requirements/planner";
import {generateRegistrationScreen} from "../src/ui-requirements/generator";
import {createExecutionRecorder} from "./lib/execution-events.mjs";
import type {Answers} from "../src/ui-requirements/schema";
const events=createExecutionRecorder({source:"requirements-preview"});
const planning=events.start("planning");
const argument=process.argv.find(x=>x.startsWith("--file="));
if(!argument){console.error("Uso: npm run requirements:preview -- --file=reports/requirements/answers.json");process.exit(2);}
const path=argument.slice(7);
if(!/^reports\/requirements\/[a-z0-9-]+\.json$/.test(path))throw Error("Arquivo deve ficar em reports/requirements/");
const data=JSON.parse(readFileSync(path,"utf8")) as {intent?:string;answers:Answers};
const requirements=resolveAnswers(data.answers,data.intent);
const plan=planInterface(requirements);
planning.complete({selectedCount:plan.components.length,blockerCount:plan.blockers.length});
const generation=events.start("generation");
let screen:ReturnType<typeof generateRegistrationScreen>|null=null;
let compliance:ReturnType<typeof verifyInterface>|null=null;
if(plan.blockers.length){
  generation.block("requirements_blocked",{blockerCount:plan.blockers.length});
}else{
  screen=generateRegistrationScreen(requirements);
  generation.complete({selectedCount:Object.keys(screen.elements).length});
  const validation=events.start("validation");
  compliance=verifyInterface(requirements,screen);
  if(compliance.valid)validation.complete({valid:true,issueCount:0});
  else validation.fail("validation_failed",{valid:false,issueCount:compliance.issues.length});
}
console.log(JSON.stringify({requirements,plan,screen,compliance},null,2));
if(plan.blockers.length||!compliance?.valid)process.exitCode=1;
