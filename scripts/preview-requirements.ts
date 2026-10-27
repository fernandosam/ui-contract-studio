import {readFileSync} from "node:fs";
import {resolveAnswers} from "../src/ui-requirements/engine";
import {prepareInterface} from "../src/ui-requirements/verify";
import type {Answers} from "../src/ui-requirements/schema";
const argument=process.argv.find(x=>x.startsWith("--file="));
if(!argument){console.error("Uso: npm run requirements:preview -- --file=reports/requirements/answers.json");process.exit(2);}
const path=argument.slice(7);
if(!/^reports\/requirements\/[a-z0-9-]+\.json$/.test(path))throw Error("Arquivo deve ficar em reports/requirements/");
const data=JSON.parse(readFileSync(path,"utf8")) as {intent?:string;answers:Answers};
const requirements=resolveAnswers(data.answers,data.intent);
const result=prepareInterface(requirements);
console.log(JSON.stringify({requirements,...result},null,2));
if(result.plan.blockers.length||!result.compliance?.valid)process.exitCode=1;
