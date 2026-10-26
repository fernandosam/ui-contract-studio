#!/usr/bin/env node
import {readFileSync,existsSync,mkdirSync,writeFileSync} from "node:fs";

const read=path=>readFileSync(path,"utf8");
const json=path=>JSON.parse(read(path));
const policy=json("src/ui-catalog/composition-admission/typed-confirmation.json");
const lock=json("src/ui-catalog/contracts.lock.json");
const pi=json("pi-catalog/contracts.json");
const sources=json("src/ui-catalog/sources.json");
const compositions=json("src/ui-catalog/composition-policy.json");
const preview=policy.target,errors=[];
const assert=(condition,message)=>{if(!condition)errors.push(message);};
assert(policy.schemaVersion===1 && policy.stage==="preview-only" &&
  policy.piAdmission==="not-approved" && policy.scenarioId==="alert-typed" &&
  policy.target==="TypedConfirmationDialog","Pilot must remain an unapproved, preview-only candidate");
assert(policy.reviewer===null && policy.reviewReference===null,
  "Do not claim human review or set reviewer without a separate promotion PR");
for(const [actual,recipe] of [[policy.previewFile,policy.sourceRecipe],[policy.schemaFile,policy.schemaRecipe]]){
 assert(existsSync(actual)&&existsSync(recipe),actual+": missing original or preview copy");
 if(existsSync(actual)&&existsSync(recipe))
  assert(read(actual)===read(recipe),actual+": preview diverged from reviewed recipe");
}
assert(!lock.components.some(x=>x.name===preview),"Pilot is present in approved Pi lock");
assert(!pi.contracts.some(x=>x.type===preview),"Pilot is present in exported Pi contracts");
assert(!sources.components.some(x=>x.name===preview),"Pilot is present in approved provenance");
assert(!compositions.reactComposites.includes(preview)&&!compositions.primitiveExtensions.includes(preview),
  "Pilot was prematurely registered in composition policy");
for(const path of ["src/ui-catalog/registry.tsx","src/ui-catalog/extensions/registry.tsx",
 "src/ui-catalog/extensions/catalog.ts","src/ui-catalog/catalog.ts"]){
 assert(!read(path).includes(preview),path+": pilot may not be registered before approval");
}
assert(policy.gates.length>=7 && policy.gates.every(x=>
  ["required","pending"].includes(x.status)),"Admission gates cannot claim success without evidence");
for(const id of ["manual-screen-reader","security-review","independent-code-review","contract-version-and-lock"]){
 assert(policy.gates.some(x=>x.id===id&&x.status==="pending"),
   id+": human approval must remain pending");
}
if(errors.length){errors.forEach(x=>console.error("✗ "+x));process.exit(1)}
console.log("✓ TypedConfirmationDialog remains preview-only; checked source identity and closed Pi catalog.");
if(process.argv.includes("--prepare")){
 const dir="reports/composition-admission",path=dir+"/typed-confirmation-review.md";
 mkdirSync(dir,{recursive:true});
 const body=[
  "# Admissão candidata: TypedConfirmationDialog","",
  "**Status: NÃO APROVADO — promoção por PR separado.**","",
  "A prévia usa a fonte original da receita React+Zod. Nenhum tipo Pi é autorizado por esta evidência.","",
  "## Gate de revisão",
  ...policy.gates.map(x=>"- [ ] "+x.id+" ("+x.type+")"),
  "",
  "## Evidências requeridas",
  "- CI verde para check, lint, typecheck e teste dos schemas.",
  "- Testes Playwright em desktop/mobile com relatório e capturas.",
  "- Inspeção manual de leitor de telas, foco, comportamento real, contraste e responsividade.",
  "- Revisão de segurança independente confirmando ausência de efeitos destrutivos ou chamadas externas.",
  "- Aprovação explícita em PR independente com versionamento Zod e atualização consistente de registry, lock, schemas e fixtures.",
  "- Reexecutar verificações e E2E após a eventual integração; nunca inferir aprovação dos testes da prévia.",
  "",
  "## Origem",
  "- "+policy.sourceRecipe,
  "- "+policy.schemaRecipe,
  "- "+policy.previewFile,
  "- "+policy.schemaFile,
  "",
 ].join("\n");
 writeFileSync(path,body);
 console.log("✓ Dossiê preparado: "+path);
}
if(process.argv.slice(2).some(x=>!["--check","--prepare"].includes(x))){
 console.error("Use --check or --prepare. Automatic Pi promotion is deliberately unsupported.");
 process.exit(2);
}
