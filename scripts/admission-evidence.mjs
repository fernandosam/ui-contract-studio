#!/usr/bin/env node
/** Browser evidence verifier for non-legacy Admission Engine candidates. No synthetic pass states. */
import {existsSync,mkdirSync,rmSync,readFileSync,writeFileSync,statSync} from "node:fs";
import {join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";

const rootDefault=resolve(fileURLToPath(new URL("..",import.meta.url)));
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
const fail=text=>{throw new Error("Admission evidence: "+text);};
const load=(root,path)=>JSON.parse(readFileSync(join(root,path),"utf8"));
const safeId=id=>/^[a-z]+(?:-[a-z]+)*$/.test(id);
const candidateIds=["alert-checkbox","accordion-members","button-copy"];
const pngSignature=Buffer.from([137,80,78,71,13,10,26,10]);

export function inspectEvidence(root,id,entry,protocol,revision=null){
 if(!safeId(id) || !candidateIds.includes(id) || !protocol ||
   entry?.id!==id || entry?.type!==protocol.target || !entry?.sourceDigest ||
   !Array.isArray(protocol.cases) || !protocol.cases.length ||
   new Set(protocol.cases).size!==protocol.cases.length ||
   !/^reports\/composition-validation\/admission\/[a-z-]+$/.test(protocol.evidenceRoot))
   fail(id+": invalid or missing protocol");
 const projects=["desktop","mobile"],screenshots=[];
 for(const project of projects)for(const caseId of protocol.cases){
  if(!/^[a-z]+(?:-[a-z]+)*$/.test(caseId))fail(id+": unsafe browser case name");
  const prefix=join(root,protocol.evidenceRoot,project,caseId);
  if(!existsSync(prefix+".json")||!existsSync(prefix+".png"))fail(id+"/"+project+"/"+caseId+": missing evidence");
  const record=JSON.parse(readFileSync(prefix+".json","utf8"));
  const png=readFileSync(prefix+".png");
  if(record.schemaVersion!==1||record.scenarioId!==id||record.target!==entry.type||
     record.sourceDigest!==entry.sourceDigest||record.protocol!==protocol.protocol||
     record.project!==project||record.caseId!==caseId||record.status!=="passed"||
     record.expectedStatus!=="passed"||record.screenshotStatus!=="captured"||
     !Number.isInteger(record.retry)||record.retry<0||record.retry>1||
     !Array.isArray(record.errors)||record.errors.length>0||
     png.length<=pngSignature.length || !png.subarray(0,8).equals(pngSignature))
   fail(id+"/"+project+"/"+caseId+": failed/incompatible browser result");
  screenshots.push({project,caseId,sha256:hash(png)});
 }
 const summaryPath=join(root,protocol.evidenceRoot,"summary.json");
 if(revision!==null){
  if(!existsSync(summaryPath))fail(id+": missing final browser summary");
  const summary=JSON.parse(readFileSync(summaryPath,"utf8"));
  if(summary.schemaVersion!==1||summary.scenarioId!==id||
    summary.target!==entry.type||summary.protocol!==protocol.protocol||
    summary.sourceDigest!==entry.sourceDigest||summary.sourceRevision!==revision||
    summary.browserChecks?.status!=="passed"||
    summary.browserChecks?.executions!==screenshots.length||
    JSON.stringify(summary.browserChecks.projects)!==JSON.stringify(projects)||
    JSON.stringify(summary.browserChecks.cases)!==JSON.stringify(protocol.cases)||
    JSON.stringify(summary.screenshots)!==JSON.stringify(screenshots))
   fail(id+": stale, incomplete or mismatched summary");
 }
 return {screenshots,executions:screenshots.length};
}

function main(){
 const mode=process.argv[2];
 if(!["--reset","--report"].includes(mode)||process.argv.length!==3)fail("Use --reset or --report");
 const root=rootDefault;
 const protocols=load(root,"src/ui-catalog/admission-engine/protocols.json").candidates;
 if(mode==="--reset"){
  for(const id of candidateIds){
   const dir=join(root,protocols[id].evidenceRoot);
   rmSync(dir,{recursive:true,force:true});
   mkdirSync(dir,{recursive:true});
  }
  console.log("✓ Candidate evidence reset; no prior run can be reused");
  return;
 }
 const entries=load(root,"src/ui-catalog/admission-engine/entries.json").entries;
 const revision=process.env.GITHUB_SHA??null;
 const summaries=[];
 for(const id of candidateIds){
  const entry=entries.find(x=>x.id===id),protocol=protocols[id];
  const evidence=inspectEvidence(root,id,entry,protocol);
  const summary={
   schemaVersion:1,scenarioId:id,target:entry.type,sourceDigest:entry.sourceDigest,
   sourceRevision:revision,protocol:protocol.protocol,
   browserChecks:{status:"passed",executions:evidence.executions,
    projects:["desktop","mobile"],cases:protocol.cases},
   screenshots:evidence.screenshots,
   manualChecks:{screenReader:"pending",securityReview:"pending",crossBrowser:"pending"}
  };
  const file=join(root,protocol.evidenceRoot,"summary.json");
  writeFileSync(file,JSON.stringify(summary,null,2)+"\n");
  inspectEvidence(root,id,entry,protocol,revision);
  summaries.push({id,executions:evidence.executions,sourceDigest:entry.sourceDigest});
 }
 console.log("✓ "+summaries.length+" independent browser protocols: "+
  summaries.map(x=>x.id+"="+x.executions).join(", "));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main()}catch(error){console.error("✗ "+error.message);process.exit(1)}
}
