#!/usr/bin/env node
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {graphErrors} from "./lib/spec-invariants.mjs";
import {signatures} from "./lib/contract-lock.mjs";
const read=p=>JSON.parse(readFileSync(p,"utf8"));
const audit=read("src/ui-catalog/block-source-inventory.json"), lock=read("src/ui-catalog/contracts.lock.json"), sources=read("src/ui-catalog/sources.json");
const gallery=["blocos-dashboard","blocos-login","blocos-signup","blocos-sidebar"].map(x=>read(`src/ui-screens/${x}.json`));
const allowed=lock.components.slice(0,44).map(x=>x.name).concat(["BlockSidebar"]);
const names=new Set(lock.components.map(x=>x.name));
const errors=[];let files=0;
if(audit.blocks.length!==27)errors.push("Esperados 27 blocos oficiais");
for(const block of audit.blocks){
 const source=sources.components.find(x=>x.name===block.id),contract=lock.components.find(x=>x.name===block.id);
 if(!contract||!source)errors.push(`${block.name}: contrato/origem ausente`);
 if(!block.sourceUrl.includes(block.name)||!block.previewUrl.endsWith(block.name))errors.push(`${block.name}: URLs divergentes`);
 if(block.sourceReview!=="read-source-structure")errors.push(`${block.name}: código não analisado`);
 if(!block.visualReview)errors.push(`${block.name}: status visual ausente`);
 files+=block.sourceFiles.length;
 for(const sourcePath of block.sourceFiles){if(!sourcePath.startsWith(`apps/v4/registry/bases/base/blocks/${block.name}/`))errors.push(`${block.name}: fonte não pertence ao bloco`);}
 if(!existsSync(block.templatePath)||!existsSync(block.componentPath)){errors.push(`${block.name}: arquivos locais ausentes`);continue;}
 const file=readFileSync(block.templatePath),spec=JSON.parse(file),hash=createHash("sha256").update(file).digest("hex");
 if(hash!==block.compositionHash||hash!==contract?.compositionHash)errors.push(`${block.name}: integridade violada`);
 const problems=graphErrors(spec,allowed,{allowedActions:["buttonClick","formSubmit","linkClick","setState","pushState","removeState"]});
 errors.push(...problems.map(e=>`${block.name}: ${e}`));
 if(Object.values(spec.elements).some(x=>!allowed.includes(x.type)))errors.push(`${block.name}: tipo não aprovado`);
 if(spec.elements[spec.root]?.type!=="Card")errors.push(`${block.name}: raiz não é Card`);
 const appearances=gallery.flatMap(g=>Object.values(g.elements)).filter(x=>x.type===block.id);
 const expectedAppearances=block.id==="Dashboard01"?0:1;
 if(appearances.length!==expectedAppearances)errors.push(`${block.name}: ocorrência esperada ${expectedAppearances}, encontrada ${appearances.length}`);
}
if(files!==103||audit.filesReviewed.length!==103)errors.push(`Inventário incompleto: ${files} arquivos (${audit.filesReviewed.length} linhas)`);
if(lock.components.length!==sources.components.length||names.size!==lock.components.length||signatures().length!==lock.components.length)errors.push("Total de contratos incompatível");
for(const c of signatures())if(lock.components.find(x=>x.name===c.name)?.fingerprint!==c.fingerprint)errors.push(`${c.name}: fingerprint inválido`);
if(process.argv.includes("--strict"))for(const block of audit.blocks){
 if(block.visualReview!=="screenshot-compared")errors.push(`${block.name}: captura de tela ainda não homologada`);
 const proof=block.visualEvidence;
 if(!proof || !proof.reviewer || !proof.date || !proof.official || !proof.local || !existsSync(proof.official) || !existsSync(proof.local))errors.push(`${block.name}: evidências reais e identificação do revisor obrigatórias`);
}
if(errors.length){errors.forEach(x=>console.error("✗ "+x));process.exit(1)}
console.log(`✓ ${audit.blocks.length} blocos novos, ${files} arquivos oficiais inspecionados e ${lock.components.length} contratos íntegros; screenshots ainda pendentes.`);
