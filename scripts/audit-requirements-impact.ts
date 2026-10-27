import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {assessChangeImpact,measureStaticCoverage} from "../src/ui-requirements/impact";
const provided=process.argv.find(x=>x.startsWith("--changed="));
const files=provided?provided.slice("--changed=".length).split(",").filter(Boolean):[];
const sha=execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim();
const fixture=JSON.parse(readFileSync("tests/fixtures/requirements-scenarios.json","utf8")) as {
 scenarios:{id:string;answers:Record<string,string|boolean|string[]>;blocked:boolean}[]
};
const impact=assessChangeImpact(files);
const metrics=measureStaticCoverage(fixture.scenarios);
console.log(JSON.stringify({
 revision:sha,source:"local Git checkout",schemaVersion:1,
 impact,metrics,
 evidence:{
  static:{sourceRevision:sha,kind:"catalog-and-requirement-assertions"},
  browser:{status:"not-imported",reason:"Browser evidence must come from a separate verified workflow/artifact tied to the same source revision."}
 }
},null,2));
if(metrics.firstPassValid!==metrics.eligible||metrics.unapprovedComponents!==0)process.exitCode=1;
