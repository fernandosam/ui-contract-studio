import {writeBrowserEvidenceSummary} from "./lib/requirements-browser-evidence";

const revision=process.env.GITHUB_SHA??"";
try{
 const report=writeBrowserEvidenceSummary(process.cwd(),revision);
 const covered=report.cases.reduce((sum,c)=>sum+c.requirements.filter(r=>r.status==="tested-render").length,0);
 console.log(JSON.stringify({
  sourceRevision:report.sourceRevision,executions:report.executions,
  variants:report.cases.length,assertedRequirementLinks:covered,
  scope:report.evidenceScope
 },null,2));
}catch(error){
 console.error(error instanceof Error?error.message:String(error));
 process.exitCode=1;
}
