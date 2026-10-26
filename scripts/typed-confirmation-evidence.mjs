#!/usr/bin/env node
import {existsSync,readdirSync,readFileSync,writeFileSync,mkdirSync,rmSync} from "node:fs";
import {join,resolve} from "node:path";

const root=resolve("reports/composition-validation/typed-confirmation");
const projects=["desktop","mobile"];
const cases=["invalid-and-exact-match","cancel-and-reopen","keyboard-focus","responsive-layout","schema-and-no-network"];
const only=process.argv.slice(2);
if(only.length!==1||!["--reset","--report"].includes(only[0])){
 console.error("Use --reset before focused Playwright or --report after successful desktop/mobile runs.");
 process.exit(2);
}
if(only[0]==="--reset"){
 rmSync(root,{recursive:true,force:true});
 mkdirSync(root,{recursive:true});
 console.log("✓ Reset only the typed confirmation pilot evidence directory.");
 process.exit(0);
}
const errors=[],records=[];
for(const project of projects){
 for(const caseId of cases){
  const file=join(root,project,caseId+".json");
  const png=join(root,project,caseId+".png");
  if(!existsSync(file)||!existsSync(png)){
   errors.push(project+"/"+caseId+": missing browser result or screenshot");continue;
  }
  let result;
  try{result=JSON.parse(readFileSync(file,"utf8"));}catch{errors.push(project+"/"+caseId+": malformed result");continue}
  if(result.schemaVersion!==1||result.scenarioId!=="alert-typed"||result.caseId!==caseId||
     result.project!==project||result.status!=="passed"||result.screenshotStatus!=="captured"||
     result.retry>1 || result.errors?.length)
   errors.push(project+"/"+caseId+": not a clean passing Playwright result");
  records.push(result);
 }
 const dir=join(root,project);
 if(existsSync(dir)){
  const unexpected=readdirSync(dir).filter(x=>!cases.some(id=>x===id+".json"||x===id+".png"||
    x==="dialog-open-valid.png"||x==="dialog-responsive.png"));
  if(unexpected.length)errors.push(project+": unexpected evidence "+unexpected.join(", "));
 }
}
if(errors.length){
 errors.forEach(x=>console.error("✗ "+x));process.exit(1);
}
const summary={
 schemaVersion:1,target:"TypedConfirmationDialog",scope:"isolated-runtime-proposal",
 admission:"not-approved",piExposure:false,
 browserChecks:{status:"passed",projects,caseCount:cases.length,executions:records.length,
  cases:cases.map(id=>({id,status:"passed",platforms:projects}))},
 manualChecks:{screenReader:"pending",crossBrowser:"pending",securityReview:"pending",
  independentCodeReview:"pending",piAdmission:"pending"},
 caveats:[
  "Playwright checks reflect this source revision only and do not imply Pi approval.",
  "Browser checks do not certify WCAG/assistive-technology quality or destructive backend actions.",
  "Manual review and a separately approved versioned contract PR are required."
 ],
};
const output=join(root,"summary.json");
writeFileSync(output,JSON.stringify(summary,null,2)+"\n");
const md=[
 "# Evidências: TypedConfirmationDialog","",
 "Resultado automatizado: 10/10 cenários desktop/mobile aprovados.","",
 "| Cenário | Desktop | Mobile |","|---|---|---|",
 ...cases.map(id=>"| "+id+" | passou | passou |"),
 "","Evidências completas: reports/composition-validation/typed-confirmation/{desktop,mobile}/",
 "","## Validações pendentes",
 "- Leitor de telas e inspeção manual de acessibilidade",
 "- Compatibilidade com navegadores adicionais",
 "- Revisão independente de segurança",
 "- Revisão humana e aprovação de PR de admissão",
 "- Registro versionado do contrato no Pi",
 "","Contrato não publicado.",
].join("\n")+"\n";
writeFileSync(join(root,"summary.md"),md);
console.log("✓ Browser evidence: "+records.length+"/"+(projects.length*cases.length)+
 " passed. Manual review pending; Pi remains closed.");
