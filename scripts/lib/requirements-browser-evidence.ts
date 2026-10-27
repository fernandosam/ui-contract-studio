/**
 * T34 — Node-only attestation of browser results for exact, declared UI specs.
 * A JSON file alone never certifies a runtime behavior: only CI execution can
 * establish provenance. The verifier fails closed on missing/stale evidence.
 */
import {createHash} from "node:crypto";
import {readFileSync,existsSync,writeFileSync,mkdirSync} from "node:fs";
import {join} from "node:path";
import {resolvePattern,generatePatternPreview} from "../../src/ui-requirements/patterns";
import {tracePattern} from "../../src/ui-requirements/traceability";
const lock=JSON.parse(readFileSync(new URL("../../src/ui-catalog/contracts.lock.json",import.meta.url),"utf8")) as {schemaVersion:number};

export const patternEvidenceCases=[
 {id:"login-default",flow:"login",answers:{},checked:["identifier","remember","showHelp"]},
 {id:"login-user",flow:"login",answers:{identifier:"username",remember:true,showHelp:true},checked:["identifier","remember","showHelp"]},
 {id:"search-default",flow:"search",answers:{},checked:["dateFilter"]},
 {id:"search-dates",flow:"search",answers:{dateFilter:true},checked:["dateFilter"]},
 {id:"list-default",flow:"list",answers:{},checked:["title","compact","showSummary"]},
 {id:"list-compact",flow:"list",answers:{title:"Clientes",compact:true,showSummary:true},checked:["title","compact","showSummary"]},
 {id:"dashboard-kpis",flow:"dashboard",answers:{view:"kpis"},checked:["view","density","showFootnote"]},
 {id:"dashboard-graphs",flow:"dashboard",answers:{view:"graphs",showFootnote:true},checked:["view","showFootnote"]}
] as const;
export type PatternEvidenceCase=(typeof patternEvidenceCases)[number];
export const patternEvidenceRoot="reports/requirements-browser";
export const browserProjects=["desktop","mobile"] as const;
const hash=(data:Buffer|string)=>createHash("sha256").update(data).digest("hex");
const sha=/^[0-9a-f]{40}$/;
const pngSignature=Buffer.from([137,80,78,71,13,10,26,10]);
export function specFingerprint(item:PatternEvidenceCase){
 const screen=generatePatternPreview(resolvePattern(item.flow,item.answers));
 return hash(JSON.stringify({family:item.flow,screen,lock:lock.schemaVersion}));
}
function fail(reason:string):never{throw Error("Requirement browser evidence: "+reason);}
export function verifyPatternBrowserEvidence(root:string,revision:string){
 if(!sha.test(revision))fail("invalid source revision");
 const cases=[];
 for(const item of patternEvidenceCases){
  const spec=generatePatternPreview(resolvePattern(item.flow,item.answers));
  const trace=tracePattern(resolvePattern(item.flow,item.answers),spec);
  if(!trace.structurallyValid)fail(item.id+": static requirements blocked");
  const tracked=new Set(trace.requirements.map(t=>t.id));
  for(const id of item.checked)if(!tracked.has(id))fail(item.id+": undeclared requirement "+id);
  const fingerprint=specFingerprint(item);
  const projects=[];
  for(const project of browserProjects){
   const base=join(root,patternEvidenceRoot,project,item.id);
   if(!existsSync(base+".json")||!existsSync(base+".png"))
    fail(item.id+"/"+project+": missing browser artifacts");
   let report:Record<string,unknown>;
   try{report=JSON.parse(readFileSync(base+".json","utf8")) as Record<string,unknown>;}catch{fail(item.id+"/"+project+": invalid JSON");}
   const png=readFileSync(base+".png");
   if(png.length<=pngSignature.length||!png.subarray(0,8).equals(pngSignature))
    fail(item.id+"/"+project+": invalid PNG capture");
   if(report?.schemaVersion!==1||report?.caseId!==item.id||report?.flow!==item.flow||
      report?.project!==project||report?.sourceRevision!==revision||
      report?.specFingerprint!==fingerprint||report?.status!=="passed"||
      report?.expectedStatus!=="passed"||report?.screenshotStatus!=="captured"||
      report?.retry!==0||!Array.isArray(report?.errors)||(report.errors as unknown[]).length||
      JSON.stringify(report?.checkedRequirementIds)!==JSON.stringify(item.checked))
    fail(item.id+"/"+project+": failed or mismatched browser result");
   projects.push({project,report:join(patternEvidenceRoot,project,item.id+".json"),
    screenshot:join(patternEvidenceRoot,project,item.id+".png"),screenshotSha256:hash(png)});
  }
  const observed=trace.requirements.map(req=>({
   id:req.id,origin:req.origin,nodeIds:req.nodeIds,
   status:item.checked.some(x=>x===req.id)?"tested-render":req.status,
   evidence:item.checked.some(x=>x===req.id)?projects.map(p=>p.report):req.evidence
  }));
  cases.push({caseId:item.id,flow:item.flow,specFingerprint:fingerprint,
   requirements:observed,projects});
 }
 return {schemaVersion:1 as const,sourceRevision:revision,
  result:"passed" as const,executions:cases.length*browserProjects.length,
  evidenceScope:"CI browser render assertions, not backend behavior, functional certification, cross-browser testing or full accessibility audit",
  cases};
}
export function writeBrowserEvidenceSummary(root:string,revision:string){
 const summary=verifyPatternBrowserEvidence(root,revision);
 const file=join(root,patternEvidenceRoot,"summary.json");
 mkdirSync(join(root,patternEvidenceRoot),{recursive:true});
 writeFileSync(file,JSON.stringify(summary,null,2)+"\n");
 return summary;
}
