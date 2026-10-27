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
import {patternEvidenceCases,patternEvidenceRoot,browserProjects,type PatternEvidenceCase} from "./pattern-evidence-cases";
export {patternEvidenceCases,patternEvidenceRoot,browserProjects,type PatternEvidenceCase} from "./pattern-evidence-cases";
const lock=JSON.parse(readFileSync(new URL("../../src/ui-catalog/contracts.lock.json",import.meta.url),"utf8")) as {schemaVersion:number};

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
 const manifestPath=join(root,patternEvidenceRoot,"expected.json");
 if(!existsSync(manifestPath))fail("missing source-bound preflight manifest");
 let manifest:Record<string,unknown>;
 try{manifest=JSON.parse(readFileSync(manifestPath,"utf8")) as Record<string,unknown>;}catch{fail("invalid preflight manifest");}
 if(manifest.schemaVersion!==1||manifest.sourceRevision!==revision||!Array.isArray(manifest.cases)||manifest.cases.length!==patternEvidenceCases.length)
  fail("stale or incomplete preflight manifest");
 const cases=[];
 for(const item of patternEvidenceCases){
  const spec=generatePatternPreview(resolvePattern(item.flow,item.answers));
  const trace=tracePattern(resolvePattern(item.flow,item.answers),spec);
  if(!trace.structurallyValid)fail(item.id+": static requirements blocked");
  const tracked=new Set(trace.requirements.map(t=>t.id));
  for(const id of item.checked)if(!tracked.has(id))fail(item.id+": undeclared requirement "+id);
  const fingerprint=specFingerprint(item);
  const expected=(manifest.cases as Array<Record<string,unknown>>).find(c=>c.caseId===item.id);
  if(!expected||expected.flow!==item.flow||expected.specFingerprint!==fingerprint||
    JSON.stringify(expected.checkedRequirementIds)!==JSON.stringify(item.checked))
   fail(item.id+": preflight fingerprint mismatch");
  const projects:{project:string;report:string;screenshot:string;screenshotSha256:string}[]=[];
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
