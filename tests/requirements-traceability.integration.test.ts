import test from "node:test";
import assert from "node:assert/strict";
import {resolveAnswers} from "../src/ui-requirements/engine";
import {generateRegistrationScreen} from "../src/ui-requirements/generator";
import {resolvePattern,generatePatternPreview,activePatternQuestions} from "../src/ui-requirements/patterns";
import {traceRegistration,tracePattern} from "../src/ui-requirements/traceability";

test("T34: cadastro rastreia cada campo, layout, confirmação e limites de execução",()=>{
 const input=resolveAnswers({
  persistence:"local-demo",fields:["name","email","company"],layout:"two-columns",
  confirmation:true,confirmationMessage:"Confirma?",validation:"native"
 });
 const report=traceRegistration(input,generateRegistrationScreen(input));
 assert.equal(report.structurallyValid,true,JSON.stringify(report.issues));
 assert.equal(report.runtimeTests,"not-executed");
 assert.equal(report.requirements.filter(x=>x.id.startsWith("field:")).length,3);
 assert.equal(report.requirements.find(x=>x.id==="field:email")?.origin,"explicit");
 assert.equal(report.requirements.find(x=>x.id==="layout")?.status,"covered-static");
 assert.equal(report.requirements.find(x=>x.id==="validation")?.status,"runtime-review-required");
 assert.equal(report.requirements.find(x=>x.id==="confirmation")?.status,"runtime-review-required");
 assert.equal(report.requirements.find(x=>x.id==="persistence")?.status,"covered-static");
 assert.ok(report.requirements.every(x=>x.evidence.every(e=>e!=="runtime-passed")));
});
test("T34: schema-valid drift is detected independently of the generator",()=>{
 const req=resolveAnswers({persistence:"local-demo"});
 const good=generateRegistrationScreen(req);
 const bad=structuredClone(good);
 bad.elements.field_1.props.label="Campo adulterado";
 const report=traceRegistration(req,bad);
 assert.equal(report.structurallyValid,false);
 assert.equal(report.requirements.find(x=>x.id==="field:email")?.status,"blocked");
 assert.ok(report.issues.some(x=>x.includes("field:email")));
 const blocked=traceRegistration(resolveAnswers({persistence:"backend"}),good);
 assert.equal(blocked.structurallyValid,false);
 assert.equal(blocked.requirements.find(x=>x.id==="persistence")?.status,"blocked");
 const invalid=structuredClone(good);
 invalid.elements.field_0.type="UnadmittedControl";
 assert.equal(traceRegistration(req,invalid).structurallyValid,false);
});
test("T34: login, busca, listagem e dashboard conservam vínculos verificáveis",()=>{
 const cases=[
  ["login",{identifier:"email"}],["login",{identifier:"username",remember:true}],
  ["search",{dateFilter:true,selection:true,pageSize:"10"}],
  ["search",{dateFilter:false,selection:false,pageSize:"5"}],
  ["list",{compact:false}],["list",{compact:true,title:"Clientes"}],
  ["dashboard",{view:"kpis",density:"2"}],
  ["dashboard",{view:"kpis",density:"4"}],
  ["dashboard",{view:"graphs"}],
 ] as const;
 for(const [flow,answer] of cases){
  const requirements=resolvePattern(flow,answer);
  const result=tracePattern(requirements,generatePatternPreview(requirements));
  assert.equal(result.structurallyValid,true,flow+" "+JSON.stringify(result.issues));
  assert.equal(result.runtimeTests,"not-executed");
  assert.ok(result.requirements.length>0);
  assert.ok(result.requirements.every(r=>r.status!=="blocked"));
 }
});
test("T34: visual density question applies to KPIs, not graphs",()=>{
 const graph=resolvePattern("dashboard",{view:"graphs"});
 assert.equal(activePatternQuestions("dashboard",graph.answers).some(x=>x.id==="density"),false);
 assert.equal(Object.hasOwn(graph.answers,"density"),false);
 const kpi=resolvePattern("dashboard",{view:"kpis",density:"2"});
 assert.equal(activePatternQuestions("dashboard",kpi.answers).some(x=>x.id==="density"),true);
});
test("T34: independent pattern assertions catch wrong contract properties",()=>{
 const req=resolvePattern("search",{selection:true,pageSize:"10"});
 const invalid=generatePatternPreview(req);
 invalid.elements.table.props.selectable=false;
 const trace=tracePattern(req,invalid);
 assert.equal(trace.structurallyValid,false);
 assert.equal(trace.requirements.find(x=>x.id==="selection")?.status,"blocked");
 const dash=resolvePattern("dashboard",{view:"kpis",density:"2"});
 const mutated=generatePatternPreview(dash);
 mutated.elements.stats.children=["m1-card","m2-card","m3-card"];
 assert.equal(tracePattern(dash,mutated).structurallyValid,false);
});
