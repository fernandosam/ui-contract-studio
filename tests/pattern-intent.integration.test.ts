import test from "node:test";
import assert from "node:assert/strict";
import {resolvePattern,inferPattern,generatePatternPreview} from "../src/ui-requirements/patterns";
import {validateFlow} from "../src/ui-requirements/schema";
import {tracePattern} from "../src/ui-requirements/traceability";
test("T33: prompt-derived answers reduce duplicate questions without overriding explicit choices",()=>{
 const inferred=resolvePattern("dashboard",{},"Quero dashboard com gráficos");
 assert.equal(inferred.answers.view,"graphs");
 assert.equal(inferred.provenance.view,"inferred");
 assert.equal(Object.hasOwn(inferred.answers,"density"),false);
 const given=resolvePattern("dashboard",{view:"kpis",density:"2"},"dashboard com gráficos");
 assert.equal(given.answers.view,"kpis");
 assert.equal(given.provenance.view,"explicit");
 assert.equal(tracePattern(given,generatePatternPreview(given)).structurallyValid,true);
 assert.equal(resolvePattern("login",{},"Login por usuário").answers.identifier,"username");
 assert.equal(resolvePattern("search",{},"Busca com filtro de datas e 10 registros").answers.pageSize,"10");
 assert.equal(resolvePattern("list",{},"Lista compacta").answers.compact,true);
});
test("T33: ambiguity does not silently choose a pattern",()=>{
 assert.equal(inferPattern("dashboard e busca"),null);
 const inferred=resolvePattern("dashboard",{},"Dashboard com gráficos e KPIs");
 assert.equal(inferred.provenance.view,"default");
});
test("T33: flows reject duplicate questions and invalid forward conditions",()=>{
 const question={id:"q1",label:"Pergunta",type:"boolean",required:true,default:false};
 assert.throws(()=>validateFlow({schemaVersion:1,id:"sample",title:"Exemplo",intentKeywords:["teste"],questions:[question,question]}),/duplicada/);
 assert.throws(()=>validateFlow({schemaVersion:1,id:"sample",title:"Exemplo",intentKeywords:["teste"],questions:[{...question,visibleWhen:{question:"other",equals:true}}]}),/Condição/);
});
