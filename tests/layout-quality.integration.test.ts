import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveAnswers} from "../src/ui-requirements/engine";
import {generateRegistrationScreen} from "../src/ui-requirements/generator";
import {resolvePattern,generatePatternPreview} from "../src/ui-requirements/patterns";
import {evaluateLayoutQuality} from "../src/ui-requirements/layout-quality";
import {traceRegistration,tracePattern} from "../src/ui-requirements/traceability";
import {catalog} from "../src/ui-catalog/catalog";

test("advisory scores all four layout dimensions on accepted generated variants",()=>{
 const cases=[
  {requirements:resolveAnswers({persistence:"local-demo",layout:"single"}),generate:generateRegistrationScreen},
  {requirements:resolveAnswers({persistence:"local-demo",fields:["name","email","company","phone","password"],layout:"two-columns",confirmation:true}),generate:generateRegistrationScreen}
 ];
 for(const {requirements,generate} of cases){
  const screen=generate(requirements);
  const report=evaluateLayoutQuality(requirements,screen);
  assert.ok(report);
  assert.equal(report.score,100,JSON.stringify(report.findings));
  assert.deepEqual(Object.values(report.scores),[25,25,25,25]);
  assert.deepEqual(report.findings,[]);
  assert.equal(report.policy,"advisory-only");
  assert.equal(report.basis,"static-declarative");
  assert.equal(report.runtimeEvidence,"not-executed");
  assert.equal(traceRegistration(requirements,screen).structurallyValid,true);
 }
 const variants=[
  ["login",{}],["login",{remember:true,showHelp:true}],
  ["search",{}],["search",{dateFilter:true,selection:true,pageSize:"10"}],
  ["dashboard",{view:"kpis",density:"2",showFootnote:true}],
  ["dashboard",{view:"kpis",density:"4"}],
  ["dashboard",{view:"graphs",showFootnote:true}]
 ] as const;
 for(const [flow,answers] of variants){
  const requirements=resolvePattern(flow,answers),screen=generatePatternPreview(requirements);
  const report=evaluateLayoutQuality(requirements,screen);
  assert.ok(report,flow);
  assert.equal(report.score,100,flow+": "+JSON.stringify(report.findings));
  assert.equal(tracePattern(requirements,screen).structurallyValid,true);
 }
 assert.equal(evaluateLayoutQuality(resolvePattern("list"),generatePatternPreview(resolvePattern("list"))),null,
  "Listagem não tem um contrato semântico de layout específico; não inventar uma nota");
});

test("changes with valid Pi schemas reduce the relevant quality axis and offer actionable findings",()=>{
 const registration=resolveAnswers({persistence:"local-demo",fields:["name","email","company","phone"],layout:"two-columns"});
 const registrationBase=generateRegistrationScreen(registration);
 const regCases=[
  {axis:"hierarchy",code:"registration-first",edit:(s:typeof registrationBase)=>{s.elements.root.children.reverse();}},
  {axis:"grouping",code:"registration-order",edit:(s:typeof registrationBase)=>{s.elements.form_fields.children.reverse();}},
  {axis:"density",code:"registration-columns",edit:(s:typeof registrationBase)=>{s.elements.group_identity_fields.props.columns=1;}},
  {axis:"responsiveness",code:"registration-centered",edit:(s:typeof registrationBase)=>{s.elements.root.props.centered=false;}}
 ] as const;
 for(const {axis,code,edit} of regCases){
  const modified=structuredClone(registrationBase);
  edit(modified);
  assert.equal(catalog.validate(modified).success,true,"mutation should remain schema valid");
  const score=evaluateLayoutQuality(registration,modified);
  assert.ok(score);
  assert.ok(score.scores[axis]<25,code+": "+JSON.stringify(score));
  assert.ok(score.findings.some(x=>x.code===code&&x.suggestion.length>0&&x.nodeIds.length>0));
  assert.equal(score.policy,"advisory-only");
 }
 const login=resolvePattern("login",{showHelp:true});
 const loginScreen=generatePatternPreview(login);
 const broken=structuredClone(loginScreen);
 broken.elements.root.children=["fields","action","help","notice"];
 const degraded=evaluateLayoutQuality(login,broken);
 assert.ok(degraded&&degraded.scores.hierarchy<25);
 assert.ok(degraded.findings.some(x=>x.code==="pattern-order"));
 const search=resolvePattern("search",{dateFilter:true});
 const searchScreen=generatePatternPreview(search);
 searchScreen.elements.filters.children.reverse();
 const searchReport=evaluateLayoutQuality(search,searchScreen);
 assert.ok(searchReport&&searchReport.scores.grouping<25);
 const dashboard=resolvePattern("dashboard",{view:"kpis",density:"2"});
 const dashboardScreen=generatePatternPreview(dashboard);
 dashboardScreen.elements.stats.props.columns=4;
 const dashboardReport=evaluateLayoutQuality(dashboard,dashboardScreen);
 assert.ok(dashboardReport&&dashboardReport.scores.density<25&&dashboardReport.scores.responsiveness<25);
});

test("incomplete graphs produce a zero score without throwing or authorizing anything",()=>{
 const requirements=resolvePattern("login");
 const malformed=[
  null,{}, {root:"root",elements:{}},
  {root:"root",elements:{root:{type:"Card",props:{},children:[42]}}}
 ];
 for(const item of malformed){
  const report=evaluateLayoutQuality(requirements,item);
  assert.equal(report?.score,0);
  assert.equal(report?.findings.length,4);
  assert.equal(report?.runtimeEvidence,"not-executed");
 }
 const disconnected=structuredClone(generatePatternPreview(requirements));
 disconnected.elements.orphan={type:"Text",props:{text:"texto",variant:"muted"},children:[]};
 const report=evaluateLayoutQuality(requirements,disconnected);
 assert.ok(report&&report.scores.grouping<25);
 assert.ok(report.findings.some(x=>x.code==="pattern-references"));
});

test("quality is consultative, does not mutate the screen, Pi contracts or approval policy",()=>{
 const requirements=resolvePattern("dashboard",{view:"kpis",density:"4"});
 const generated=generatePatternPreview(requirements);
 const before=JSON.stringify(generated);
 const scored=evaluateLayoutQuality(requirements,generated);
 assert.ok(scored&&scored.score>=0&&scored.score<=100);
 assert.equal(JSON.stringify(generated),before);
 assert.ok(!Object.values(generated.elements).some(n=>Object.hasOwn(n.props,"className")||Object.hasOwn(n.props,"style")));
 const policy=readFileSync("AGENTS.md","utf8");
 assert.match(policy,/independent review/);
 const audit=readFileSync("scripts/audit-pattern-requirements.ts","utf8");
 assert.match(audit,/layoutQuality:evaluateLayoutQuality/);
 assert.match(audit,/if\(mismatches\)process.exitCode=1/);
 assert.doesNotMatch(audit,/if\(.*layoutQuality.*\)process.exitCode/);
});
