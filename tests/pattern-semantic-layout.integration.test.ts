import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {catalog} from "../src/ui-catalog/catalog";
import {resolvePattern,generatePatternPreview} from "../src/ui-requirements/patterns";
import {planPatternLayout} from "../src/ui-requirements/pattern-layout";
import {tracePattern} from "../src/ui-requirements/traceability";
import {assessChangeImpact} from "../src/ui-requirements/impact";

const policy=JSON.parse(readFileSync("src/ui-requirements/pattern-layouts.json","utf8"));
const gen=(flow:string,answers:Record<string,string|boolean>={})=>{
 const spec=resolvePattern(flow,answers);
 const screen=generatePatternPreview(spec);
 const trace=tracePattern(spec,screen);
 assert.equal(catalog.validate(screen).success,true,flow+": catalog Zod");
 assert.equal(trace.structurallyValid,true,flow+": "+JSON.stringify(trace.issues));
 assert.equal(trace.runtimeTests,"not-executed");
 assert.equal(trace.requirements.find(x=>x.id==="layout")?.status,"covered-static");
 return {spec,screen};
};

test("semantic layouts are versioned, evidence-based and non-authorizing",()=>{
 assert.equal(policy.schemaVersion,1);
 assert.equal(policy.status,"semantic-guidance");
 assert.equal(policy.admission,"does-not-authorize-pi-contracts-actions-or-permissions");
 assert.deepEqual(Object.keys(policy.flows),["login","search","dashboard"]);
 assert.deepEqual(policy.responsive,{mobileColumns:1,maxGridColumns:4,compactMaxGridColumns:2,preserveDomReadingOrder:true});
 for(const ev of policy.evidence as {path:string;contains:string}[])
  assert.ok(readFileSync(ev.path,"utf8").includes(ev.contains),ev.path);
 const manifest=JSON.parse(readFileSync("pi-catalog/contracts.json","utf8"));
 assert.ok(!manifest.actions.includes("authenticate")&&!manifest.actions.includes("submitRemote"));
});

test("login composes an approved narrow card, credentials, optional help, then action and notice",()=>{
 const simple=gen("login").screen;
 assert.deepEqual(simple.elements.root.children,["fields","action","notice"]);
 assert.deepEqual(simple.elements.fields.children,["identifier","password"]);
 assert.equal(simple.elements.root.props.maxWidth,"md");
 assert.equal(simple.elements.root.props.centered,true);
 const advanced=gen("login",{identifier:"username",remember:true,showHelp:true}).screen;
 assert.deepEqual(advanced.elements.root.children,["fields","help","action","notice"]);
 assert.deepEqual(advanced.elements.fields.children,["identifier","password","remember"]);
 assert.equal(advanced.elements.identifier.props.type,"text");
 assert.equal(advanced.elements.help.type,"Text");
 const plan=planPatternLayout(resolvePattern("login",{showHelp:true}));
 assert.deepEqual(plan?.regions,["fields","help","action","notice"]);
});

test("search filters always precede table; options and page size remain intact",()=>{
 const basic=gen("search").screen;
 assert.deepEqual(basic.elements.root.children,["header","table"]);
 assert.equal(basic.elements.filters,undefined);
 assert.equal(basic.elements.dates,undefined);
 const filtered=gen("search",{dateFilter:true,selection:true,pageSize:"10"}).screen;
 assert.deepEqual(filtered.elements.root.children,["header","filters","table"]);
 assert.deepEqual(filtered.elements.filters.children,["dates","required-date"]);
 assert.equal(filtered.elements.filters.type,"Stack");
 assert.equal(filtered.elements.dates.type,"DatePicker");
 assert.equal(filtered.elements.table.props.selectable,true);
 assert.equal(filtered.elements.table.props.pageSize,10);
 assert.deepEqual(planPatternLayout(resolvePattern("search",{dateFilter:true}))?.regions,
  ["header","filters","table"]);
});

test("dashboard KPI hierarchy respects density and notes remain after grid",()=>{
 for(const density of ["2","4"]){
  const {screen}=gen("dashboard",{view:"kpis",density,showFootnote:true});
  assert.equal(screen.root,"dashboard");
  assert.deepEqual(screen.elements.dashboard.children,["overview-title","stats","footnote"]);
  assert.equal(screen.elements["overview-title"].props.level,"h2");
  assert.equal(screen.elements.stats.props.columns,Number(density));
  assert.equal(screen.elements.stats.children.length,Number(density));
  assert.equal(screen.elements["m1-card"].children.includes("footnote"),false);
  assert.equal(planPatternLayout(resolvePattern("dashboard",{view:"kpis",density}))?.gridColumns,Number(density));
 }
 const compact=gen("dashboard",{view:"kpis",density:"2"}).screen;
 assert.deepEqual(compact.elements.dashboard.children,["overview-title","stats"]);
 assert.equal(compact.elements.footnote,undefined);
});

test("dashboard graphs preserve admitted chart types and put optional note after charts",()=>{
 const graphs=gen("dashboard",{view:"graphs",showFootnote:true}).screen;
 assert.deepEqual(graphs.elements.graphs.children,["graph_grid","footnote"]);
 assert.deepEqual(graphs.elements.graph_grid.children,["graph_bar","graph_line"]);
 assert.equal(graphs.elements.graph_grid.props.columns,2);
 assert.equal(graphs.elements.graph_bar.type,"BarGraph");
 assert.equal(graphs.elements.graph_line.type,"LineGraph");
 const plain=gen("dashboard",{view:"graphs"}).screen;
 assert.deepEqual(plain.elements.graphs.children,["graph_grid"]);
 assert.equal(plain.elements.footnote,undefined);
});

test("independent trace rejects schema-valid changes to semantic hierarchy",()=>{
 const cases=[
  {flow:"login",answers:{showHelp:true},change:(s:ReturnType<typeof generatePatternPreview>)=>{s.elements.root.children=["fields","action","help","notice"];}},
  {flow:"login",answers:{remember:true},change:(s:ReturnType<typeof generatePatternPreview>)=>{s.elements.fields.children.reverse();}},
  {flow:"search",answers:{dateFilter:true},change:(s:ReturnType<typeof generatePatternPreview>)=>{s.elements.root.children=["header","table","filters"];}},
  {flow:"search",answers:{dateFilter:true},change:(s:ReturnType<typeof generatePatternPreview>)=>{s.elements.filters.children.reverse();}},
  {flow:"dashboard",answers:{view:"kpis",density:"2"},change:(s:ReturnType<typeof generatePatternPreview>)=>{s.elements.dashboard.children.reverse();}},
  {flow:"dashboard",answers:{view:"kpis",density:"2"},change:(s:ReturnType<typeof generatePatternPreview>)=>{s.elements.stats.props.columns=4;}},
  {flow:"dashboard",answers:{view:"graphs",showFootnote:true},change:(s:ReturnType<typeof generatePatternPreview>)=>{s.elements.graphs.children.reverse();}}
 ];
 for(const item of cases){
  const requirements=resolvePattern(item.flow,item.answers);
  const changed=structuredClone(generatePatternPreview(requirements));
  item.change(changed);
  assert.equal(catalog.validate(changed).success,true,"Mutation must still pass schema");
  const report=tracePattern(requirements,changed);
  assert.equal(report.structurallyValid,false,item.flow+" expected semantic rejection");
  assert.equal(report.requirements.find(x=>x.id==="layout")?.status,"blocked");
 }
});

test("pattern semantic layout edits map to exactly three families in impact review",()=>{
 for(const path of ["src/ui-requirements/pattern-layouts.json","src/ui-requirements/pattern-layout.ts"]){
  const impact=assessChangeImpact([path]);
  assert.deepEqual(impact.impacts.map(x=>x.family),["login","search","dashboard"]);
  assert.deepEqual(impact.unmapped,[]);
  assert.ok(impact.impacts.every(x=>x.requiredChecks.includes("browser-review")));
 }
 assert.equal(planPatternLayout(resolvePattern("list")),null);
});

test("layouts do not create remote actions, handlers or broaden Pi contracts",()=>{
 const flows=[
  ["login",{remember:true,showHelp:true}],
  ["search",{dateFilter:true,selection:true}],
  ["dashboard",{view:"graphs",showFootnote:true}],
  ["dashboard",{view:"kpis",density:"4",showFootnote:true}],
 ] as const;
 for(const [flow,answers] of flows){
  const {screen}=gen(flow,answers);
  assert.ok(Object.values(screen.elements).every(n=>!("on" in n)&&!("actions" in n)&&
   !("endpoint" in n.props)&&!("onSubmit" in n.props)&&!("className" in n.props)));
 }
});
