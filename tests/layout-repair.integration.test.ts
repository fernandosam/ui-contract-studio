import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {catalog} from "../src/ui-catalog/catalog";
import {resolveAnswers} from "../src/ui-requirements/engine";
import {generateRegistrationScreen} from "../src/ui-requirements/generator";
import {resolvePattern,generatePatternPreview} from "../src/ui-requirements/patterns";
import {improveLayoutQuality} from "../src/ui-requirements/layout-repair";
import {traceRegistration,tracePattern} from "../src/ui-requirements/traceability";
import {evaluateLayoutQuality} from "../src/ui-requirements/layout-quality";

test("repair uses existing schemas and semantic plans for all supported flows",()=>{
 const registration=resolveAnswers({persistence:"local-demo",fields:["name","email","company","phone","password"],layout:"two-columns"});
 const reg=generateRegistrationScreen(registration);
 reg.elements.root.children.reverse();
 reg.elements.form_fields.children.reverse();
 reg.elements.group_identity_fields.children.reverse();
 reg.elements.group_identity_fields.props.columns=1;
 reg.elements.root.props.centered=false;
 const cases=[
  {id:"registration",requirements:registration,screen:reg,trace:traceRegistration},
  ...([
   ["login",{remember:true,showHelp:true},(s:ReturnType<typeof generatePatternPreview>)=>{
    s.elements.root.children=["fields","action","help","notice"];s.elements.fields.children.reverse();
    s.elements.root.props.centered=false;
   }],
   ["search",{dateFilter:true},(s:ReturnType<typeof generatePatternPreview>)=>{
    s.elements.root.children.reverse();s.elements.filters.children.reverse();
    s.elements.root.props.gap="sm";
   }],
   ["dashboard",{view:"kpis",density:"2",showFootnote:true},(s:ReturnType<typeof generatePatternPreview>)=>{
    s.elements.dashboard.children.reverse();s.elements.stats.props.columns=4;
    s.elements.stats.props.gap="lg";
   }],
   ["dashboard",{view:"graphs",showFootnote:true},(s:ReturnType<typeof generatePatternPreview>)=>{
    s.elements.graphs.children.reverse();s.elements.graph_grid.children.reverse();
    s.elements.graph_grid.props.columns=4;
   }]
  ] as const).map(([flow,answers,change])=>{
   const requirements=resolvePattern(flow,answers),screen=generatePatternPreview(requirements);
   change(screen);
   return {id:flow+":"+JSON.stringify(answers),requirements,screen,trace:tracePattern};
  })
 ];
 for(const item of cases){
  assert.equal(catalog.validate(item.screen).success,true,item.id+": mutation must be schema-valid");
  const baseline=JSON.stringify(item.screen);
  const score=evaluateLayoutQuality(item.requirements,item.screen);
  assert.ok(score&&score.score<100,item.id);
  const repair=improveLayoutQuality(item.requirements,item.screen);
  assert.equal(repair.status,"improved",item.id+": "+repair.reason);
  assert.ok(repair.before&&repair.after&&repair.after.score>repair.before.score,item.id);
  assert.ok(repair.after.score<=100);
  assert.equal(repair.after.score,100,item.id+": "+JSON.stringify(repair.after.findings));
  assert.ok(repair.edits.length>0&&repair.edits.length<=12);
  assert.equal(catalog.validate(repair.screen).success,true,item.id);
  const trace=item.requirements.flow==="registration"?
   traceRegistration(item.requirements as typeof registration,repair.screen):
   tracePattern(item.requirements as ReturnType<typeof resolvePattern>,repair.screen);
  assert.equal(trace.structurallyValid,true,item.id+": "+JSON.stringify(trace.issues));
  assert.equal(JSON.stringify(item.screen),baseline,"input is immutable");
  assert.equal(repair.policy,"advisory-only");
  assert.equal(repair.runtimeEvidence,"not-executed");
  for(const edit of repair.edits){
   assert.match(edit.path,/^elements\.[\w-]+\.(children|props\.(direction|gap|columns|maxWidth|centered))$/);
   assert.notDeepEqual(edit.before,edit.after);
  }
  const second=improveLayoutQuality(item.requirements,repair.screen);
  assert.equal(second.status,"unchanged",item.id);
  assert.equal(second.edits.length,0);
 }
});

test("unapproved graph and incompatible content never get a repaired output",()=>{
 const spec=resolveAnswers({persistence:"local-demo",fields:["name","email","company"],layout:"two-columns"});
 const source=generateRegistrationScreen(spec);
 const scenarios=[
  {id:"invalid-prop",change:(s:typeof source)=>{s.elements.root.props.className="arbitrary override";}},
  {id:"absent-field",change:(s:typeof source)=>{s.elements.group_identity_fields.children.pop();}},
  {id:"incorrect-heading",change:(s:typeof source)=>{
   s.elements.group_identity_fields.props.columns=1;
   s.elements.heading_identity.props.text="Título que não corresponde ao contrato";
  }},
  {id:"foreign-action",change:(s:typeof source)=>{
   (s.elements.root as unknown as Record<string,unknown>).on={click:{action:"danger"}};
  }},
  {id:"orphan-node",change:(s:typeof source)=>{
   s.elements.orphan={type:"Text",props:{text:"solto",variant:"muted"},children:[]};
  }}
 ];
 for(const {id,change} of scenarios){
  const edited=structuredClone(source);
  change(edited);
  const baseline=JSON.stringify(edited);
  const repair=improveLayoutQuality(spec,edited);
  assert.notEqual(repair.status,"improved",id);
  assert.equal(repair.screen,edited,id+": unsafe candidate must not replace source");
  assert.deepEqual(repair.edits,[],id);
  assert.equal(JSON.stringify(edited),baseline,id);
 }
 const unknown=resolvePattern("list");
 const generated=generatePatternPreview(unknown);
 const result=improveLayoutQuality(unknown,generated);
 assert.equal(result.status,"not-applicable");
 assert.equal(result.before,null);
 assert.equal(result.screen,generated);
});

test("repair is transparent and never introduces new authorization or approval conditions",()=>{
 const spec=resolvePattern("login",{remember:true});
 const base=generatePatternPreview(spec);
 const unchanged=improveLayoutQuality(spec,base);
 assert.equal(unchanged.status,"unchanged");
 assert.equal(unchanged.screen,base);
 assert.equal(unchanged.before?.score,100);
 base.elements.root.children.reverse();
 const edited=improveLayoutQuality(spec,base);
 assert.equal(edited.status,"improved");
 const result=edited.screen as typeof base;
 for(const [id,node] of Object.entries(result.elements)){
  assert.equal(node.type,base.elements[id]?.type);
  assert.deepEqual(Object.keys(node.props).sort(),Object.keys(base.elements[id].props).sort());
  assert.deepEqual(Object.keys(node).sort(),Object.keys(base.elements[id]).sort());
 }
 const docs=readFileSync("docs/layout-quality.pt-BR.md","utf8");
 assert.match(docs,/sem nova aprovação|não cria.*aprovação|não adiciona.*aprovação/i);
 const audit=readFileSync("scripts/audit-pattern-requirements.ts","utf8");
 assert.match(audit,/if\(mismatches\)process.exitCode=1/);
 assert.doesNotMatch(audit,/if\(.*layoutQuality.*\)process.exitCode/);
});
