import {readFileSync} from "node:fs";
import {resolveAnswers} from "../src/ui-requirements/engine";
import {planInterface} from "../src/ui-requirements/planner";
import {generateRegistrationScreen} from "../src/ui-requirements/generator";
import {verifyInterface} from "../src/ui-requirements/verify";
type Scenario={id:string;intent:string;answers:Record<string,string|boolean|string[]>;blocked:boolean};
const scenarios=(JSON.parse(readFileSync("tests/fixtures/requirements-scenarios.json","utf8")) as {scenarios:Scenario[]}).scenarios;
let generated=0,blocked=0,mismatches=0;const details=[];
for(const scenario of scenarios){
 const requirements=resolveAnswers(scenario.answers,scenario.intent),plan=planInterface(requirements);
 const isBlocked=plan.blockers.length>0;
 if(isBlocked)blocked++;else generated++;
 const conformity=isBlocked?null:verifyInterface(requirements,generateRegistrationScreen(requirements));
 const correct=isBlocked===scenario.blocked && (isBlocked || conformity?.valid===true);
 if(!correct)mismatches++;
 details.push({id:scenario.id,result:isBlocked?"blocked":"statically-valid",expected:scenario.blocked?"blocked":"statically-valid",correct,blockers:plan.blockers,coverage:plan.coverage});
}
console.log(JSON.stringify({schemaVersion:1,total:scenarios.length,generated,blocked,mismatches,scope:"static only; no E2E or visual certification",details},null,2));
if(mismatches)process.exitCode=1;
