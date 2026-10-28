import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveAnswers} from "../src/ui-requirements/engine";
import {planRegistrationLayout} from "../src/ui-requirements/registration-layout";
import {planInterface} from "../src/ui-requirements/planner";
import {generateRegistrationScreen} from "../src/ui-requirements/generator";
import {traceRegistration} from "../src/ui-requirements/traceability";
import {verifyInterface} from "../src/ui-requirements/verify";
import {assessChangeImpact} from "../src/ui-requirements/impact";
import {catalog} from "../src/ui-catalog/catalog";

const profile=JSON.parse(readFileSync("src/ui-requirements/registration-layout.json","utf8"));

test("registration semantic layout has explicit roles, evidence, ordering and no admission authority",()=>{
 assert.equal(profile.schemaVersion,1);
 assert.equal(profile.id,"registration");
 assert.equal(profile.status,"semantic-guidance");
 assert.equal(profile.admission,"does-not-authorize-pi-contracts-actions-or-permissions");
 assert.deepEqual(profile.hierarchy,[
  "card-title-and-description","identity","contact","credentials","additional","confirmation-or-local-notice"
 ]);
 assert.deepEqual(profile.groups.map((g:{id:string})=>g.id),["identity","contact","credentials","additional"]);
 assert.equal(profile.responsive.mobileColumns,1);
 assert.equal(profile.responsive.desktopMaxColumns,2);
 assert.equal(profile.responsive.preserveDomReadingOrder,true);
 for(const evidence of profile.evidence as {path:string;contains:string}[]){
  assert.ok(readFileSync(evidence.path,"utf8").includes(evidence.contains),evidence.path);
 }
});

test("registration semantic plan groups fields consistently and avoids empty sections",()=>{
 const spec=resolveAnswers({persistence:"local-demo",fields:["name","email","phone","password","company"],
  layout:"two-columns",extraFields:"Departamento\nObservação"});
 const layout=planRegistrationLayout(spec.fields,spec.answers.layout);
 assert.deepEqual(layout.groups.map(g=>g.id),["identity","contact","credentials","additional"]);
 assert.deepEqual(layout.groups.map(g=>g.fieldIndexes),[[0,4],[1,2],[3],[5,6]]);
 assert.deepEqual(layout.groups.map(g=>g.columns),[2,2,1,2]);
 assert.deepEqual(planRegistrationLayout(spec.fields,"single").groups.map(g=>g.columns),[1,1,1,1]);
 assert.throws(()=>planRegistrationLayout(spec.fields,"three-columns"),/Invalid/);
 assert.deepEqual(planRegistrationLayout([spec.fields[1]],"two-columns").groups.map(g=>g.id),["contact"]);
 assert.equal(planRegistrationLayout([spec.fields[1]],"two-columns").groups[0].columns,1);
});

test("generated registration uses approved Pi primitives, explicit hierarchy and no hidden permissions",()=>{
 const req=resolveAnswers({persistence:"local-demo",layout:"two-columns",
  fields:["name","email","phone","company","password"],confirmation:true});
 const plan=planInterface(req);
 assert.equal(plan.blockers.length,0);
 assert.ok(plan.components.includes("Heading"));
 assert.ok(plan.components.includes("Grid"));
 const screen=generateRegistrationScreen(req);
 assert.equal(catalog.validate(screen).success,true);
 assert.deepEqual(screen.elements.root.children,["form_fields","confirmation"]);
 assert.equal(screen.elements.root.props.maxWidth,"md");
 assert.equal(screen.elements.root.props.centered,true);
 assert.deepEqual(screen.elements.form_fields.children,["group_identity","group_contact","group_credentials"]);
 assert.equal(screen.elements.heading_identity.props.text,"Dados de identificação");
 assert.deepEqual(screen.elements.group_identity_fields.children,["field_0","field_3"]);
 assert.equal(screen.elements.group_identity_fields.type,"Grid");
 assert.equal(screen.elements.group_identity_fields.props.columns,2);
 assert.deepEqual(screen.elements.group_contact_fields.children,["field_1","field_2"]);
 assert.equal(screen.elements.group_credentials_fields.type,"Stack");
 assert.deepEqual(screen.elements.group_credentials_fields.children,["field_4"]);
 assert.ok(Object.values(screen.elements).every(node=>
  !Object.hasOwn(node.props,"endpoint")&&!Object.hasOwn(node.props,"onSubmit")&&
  !Object.hasOwn(node.props,"href")&&!Object.hasOwn(node.props,"className")&&
  !Object.hasOwn(node.props,"actions")));
 assert.equal(traceRegistration(req,screen).structurallyValid,true);
 assert.equal(verifyInterface(req,screen).valid,true);
});

test("trace blocks semantic layout drift even if individual node props remain valid",()=>{
 const req=resolveAnswers({persistence:"local-demo",layout:"two-columns",
  fields:["name","email","company","password"]});
 const source=generateRegistrationScreen(req);
 const mutants=[
  (x:typeof source)=>{x.elements.heading_identity.props.text="Dados inventados";},
  (x:typeof source)=>{x.elements.group_identity_fields.children.reverse();},
  (x:typeof source)=>{x.elements.group_identity_fields.props.columns=1;},
  (x:typeof source)=>{x.elements.form_fields.children.reverse();},
  (x:typeof source)=>{x.elements.root.props.centered=false;},
  (x:typeof source)=>{x.elements.group_contact_fields.children=[];}
 ];
 for(const mutate of mutants){
  const spec=structuredClone(source);
  mutate(spec);
  assert.equal(traceRegistration(req,spec).structurallyValid,false,JSON.stringify(spec.elements.form_fields));
  assert.equal(verifyInterface(req,spec).valid,false);
 }
});

test("mobile fallback is real CSS; semantic layout changes are recorded by existing impact audit",()=>{
 const styles=readFileSync("src/index.css","utf8");
 assert.match(styles,/@media \(max-width: 639px\) \{\s*\.pg-grid \{ grid-template-columns: minmax\(0, 1fr\); \}/);
 const impact=assessChangeImpact(["src/ui-requirements/registration-layout.json","src/ui-requirements/registration-layout.ts"]);
 assert.deepEqual(impact.impacts.map(x=>x.family),["registration"]);
 assert.deepEqual(impact.unmapped,[]);
 assert.ok(impact.impacts[0].requiredChecks.includes("browser-review"));
});

test("semantic layout never enables remote persistence or unapproved business rules",()=>{
 for(const answers of [{persistence:"backend"},{persistence:"local-demo",validation:"business"}]){
  const spec=resolveAnswers(answers);
  assert.ok(planInterface(spec).blockers.length>0);
  assert.throws(()=>generateRegistrationScreen(spec),/Geração bloqueada/);
 }
 const accepted=generateRegistrationScreen(resolveAnswers({persistence:"local-demo"}));
 const pi=JSON.parse(readFileSync("pi-catalog/contracts.json","utf8"));
 assert.equal(pi.actions.includes("submitRemote"),false);
 assert.equal(Object.values(accepted.elements).some(node=>"on" in node||"actions" in node),false);
});
