/** E05: read-only Zod, contract and Admission Engine validation of advisory layouts. */
import {isDeepStrictEqual} from "node:util";
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {z} from "zod";
import {catalog,componentDefinitions} from "../src/ui-catalog/catalog";
import {evaluatePolicy} from "./lib/admission-policy.mjs";
import {readLayoutPatterns,buildLayoutReuse} from "./lib/layout-reuse.mjs";
import {compareLayoutReuseWithCatalog} from "./lib/layout-reuse-comparison.mjs";
import {buildLayoutCompositionProposals} from "./lib/layout-composition-proposals.mjs";

const strict = z.strictObject;
const reference = strict({layoutId:z.string().min(1),nodeId:z.string().min(1)});
const property = strict({
 name:z.string().min(1),types:z.array(z.string()),required:z.boolean(),
 schemaPointer:z.string().min(1),observedIn:z.array(reference),
 scope:z.literal("primitive-property-only-not-an-admitted-composite-property")
});
const dependency = strict({
 type:z.string().min(1),version:z.string(),stability:z.string(),
 fingerprint:z.string().regex(/^[a-f0-9]{64}$/),
 lockPath:z.literal("src/ui-catalog/contracts.lock.json"),
 propsSchemaPath:z.string().min(1)
});
const reused = strict({
 name:z.string(),templatePath:z.string(),structuralOccurrences:z.number().int().positive(),
 relationOnly:z.literal(true)
});
const structure = strict({
 parentType:z.string().min(1),childType:z.string().min(1),relation:z.string().min(1)
});
const slot = strict({
 name:z.enum(["content","nestedContent"]),proposedBinding:z.string(),
 acceptsExistingType:z.string().nullable(),
 observedChildren:strict({min:z.number().int().nonnegative(),max:z.number().int().nonnegative()}),
 scope:z.literal("proposed-composition-interface-not-an-admitted-slot")
});
const sourceRef = strict({
 layoutId:z.string(),originScreen:z.string(),path:z.string(),
 parentId:z.string(),childId:z.string(),relation:z.string(),index:z.number().int().nonnegative()
});
const proposalSchema = strict({
 id:z.string().regex(/^e05-/),name:z.string(),status:z.literal("advisory-not-admitted"),
 evidenceLevel:z.enum(["cross-origin-static-evidence","same-origin-candidate"]),
 strategy:z.enum(["review-existing-compositions-first","compose-admitted-primitives",
  "observe-until-independent-origins","manual-review-required"]),
 purpose:z.string().min(1),structure,
 properties:strict({parent:z.array(property),child:z.array(property)}),
 slots:z.array(slot).min(1),
 dependencies:strict({primitives:z.array(dependency).min(1),inspectExistingCompositions:z.array(reused)}),
 evidence:z.array(sourceRef).min(1),unresolved:z.array(z.string()).min(1),
 permissionImpact:z.literal("none")
});
export const e05AdvisorySchema = strict({
 schemaVersion:z.literal(1),status:z.literal("proposals-only-not-authorized"),
 sourcePaths:z.array(z.string()),limitation:z.string(),
 summary:strict({
  candidateCount:z.number().int().nonnegative(),
  independentOriginCount:z.number().int().nonnegative(),
  sameOriginCount:z.number().int().nonnegative(),
  existingCompositeReviewCount:z.number().int().nonnegative(),
  primitiveAssemblyCount:z.number().int().nonnegative()
 }),
 proposals:z.array(proposalSchema)
});

const read = (path) => JSON.parse(readFileSync(path,"utf8"));
const sort = (values) => values.sort((a,b)=>a.localeCompare(b,"en"));
const pointer = (s) => s.replaceAll("~","~0").replaceAll("/","~1");
const expectedId = (p) =>
 "e05-"+p.structure.relation.replaceAll(".","-")+"-"+
 p.structure.parentType.toLowerCase()+"-"+p.structure.childType.toLowerCase();
const errorText = (error) => error.issues
 .map(issue=>issue.path.join(".")+": "+issue.message).join("; ");


/** Passing means the advisory information is internally sound, NOT a new Pi contract. */
export function validateE05AdvisoryReport(raw,input){
 const parsed=e05AdvisorySchema.safeParse(raw);
 if(!parsed.success)throw Error("Invalid advisory Zod schema: "+errorText(parsed.error));
 const report=parsed.data;
 const {lock,pi,propsSchemas,policy,recipes,scenarios,sources,protocols,entries,manifest}=input;
 const problems=[];
 const fail=(message)=>{problems.push(message);};
 if(pi?.schemaVersion!==3||!Array.isArray(pi.components)||!Array.isArray(lock?.components)||
    propsSchemas?.schemaVersion!==3||!propsSchemas.types||
    !Array.isArray(entries?.entries)||!Array.isArray(manifest?.components)||!Array.isArray(recipes?.recipes)||
    !Array.isArray(scenarios?.scenarios)||!protocols?.candidates)
  throw Error("Invalid authoritative contract/admission input");
 const policyErrors=evaluatePolicy({policy,recipes,scenarios,lock,pi,sources,protocols});
 if(policyErrors.length)fail("Admission Engine policy failed: "+policyErrors.join("; "));
 const locked=new Map(lock.components.map((item)=>[item.name,item]));
 const official=new Map(pi.components.map((item)=>[item.type,item]));
 if(locked.size!==lock.components.length||official.size!==pi.components.length)
  fail("Duplicate official contract/manifest type");
 const ids=new Set();
 const restricted=new Set([
  ...(policy.allowedScenarios??[]),...(policy.e2eEligible??[]),
  ...Object.keys(policy.ciAutoAdmit??{}),
  ...recipes.recipes.map((x)=>x.id),
  ...entries.entries.map((x)=>x.id),
  ...Object.keys(protocols.candidates)
 ]);
 const declaredTypes=new Set([...official.keys()]);
 const evaluations=[];
 for(const proposal of report.proposals){
  const tag=proposal.id+": ";
  if(ids.has(proposal.id)||proposal.id!==expectedId(proposal))
   fail(tag+"duplicate or inconsistent proposal identity");
  ids.add(proposal.id);
  if(restricted.has(proposal.id)||restricted.has(proposal.name)||
     declaredTypes.has(proposal.id)||declaredTypes.has(proposal.name))
   fail(tag+"proposal collides with authoritative Admission Engine or Pi identifiers");
  if(proposal.slots[0]?.name!=="content"||
     new Set(proposal.slots.map(x=>x.name)).size!==proposal.slots.length)
   fail(tag+"duplicate/invalid proposed slot names");
  if(proposal.evidenceLevel==="same-origin-candidate" &&
     proposal.strategy!=="observe-until-independent-origins")
   fail(tag+"same-origin evidence cannot justify a reusable API");
  const roles = [["parent","parentType","parentId"],["child","childType","childId"]];
  const sourceSpecs=new Map();
  for(const ref of proposal.evidence){
   if(ref.path!=="src/ui-patterns/"+ref.layoutId+".json"||
      ref.relation!==proposal.structure.relation)
    {fail(tag+"untrusted source reference");continue;}
   const spec=input.read(ref.path);
   sourceSpecs.set(ref.path,spec);
   const valid=catalog.validate(spec);
   if(!valid.success)fail(tag+"source screen fails real Pi Zod: "+ref.path);
   const parent=spec?.elements?.[ref.parentId];
   const child=spec?.elements?.[ref.childId];
   const siblings=ref.relation==="children"?parent?.children:
    parent?.slots?.[ref.relation.slice(6)];
   if(!parent||!child||parent.type!==proposal.structure.parentType||
      child.type!==proposal.structure.childType||siblings?.[ref.index]!==ref.childId)
    fail(tag+"source edge changed: "+ref.path);
   for(const [role,typeKey,idKey] of roles){
    const type=proposal.structure[typeKey];
    const definition=componentDefinitions[type];
    const node=spec?.elements?.[ref[idKey]];
    if(!definition || !node || !definition.props.safeParse(node.props??{}).success)
     fail(tag+"actual primitive Zod rejected "+role+" properties in "+ref.path);
   }
  }
  for(const [role,typeKey,idKey] of roles){
   const type=proposal.structure[typeKey];
   const dep=proposal.dependencies.primitives.find(d=>d.type===type);
   const lockedType=locked.get(type);
   const officialType=official.get(type);
   const definition=componentDefinitions[type];
   const schema=propsSchemas.types[type];
   if(!dep||!lockedType||!officialType||!definition||
      lockedType.tier!=="base"||lockedType.status!=="approved"||
      officialType.tier!=="base"||officialType.lifecycle!=="stable"||
      dep.version!==lockedType.version||dep.version!==officialType.version||
      dep.fingerprint!==lockedType.semanticFingerprint||
      dep.fingerprint!==officialType.fingerprint||
      dep.stability!==lockedType.stability||
      dep.propsSchemaPath!=="pi-catalog/props-json-schema.json#/types/"+pointer(type))
    {fail(tag+"primitive not approved or pinned to official contract: "+type);continue;}
   const exported=z.toJSONSchema(definition.props,{
    target:"draft-2020-12",io:"input",unrepresentable:"any"
   });
   if(!isDeepStrictEqual(schema,exported))
    fail(tag+"exported schema differs from actual Zod: "+type);
   const actualProps=proposal.properties[role].map(p=>p.name);
   if(!isDeepStrictEqual(sort([...actualProps]),sort(Object.keys(schema?.properties??{}))))
    fail(tag+"property list differs from Zod: "+type);
   for(const field of proposal.properties[role]){
    const fieldSchema=schema?.properties?.[field.name];
    const expectedTypes=[...new Set([fieldSchema?.type,
      ...(fieldSchema?.anyOf??[]).map(option=>option.type)]
      .filter(x=>typeof x==="string"))].sort((a,b)=>a.localeCompare(b,"en"));
    if(!fieldSchema||!isDeepStrictEqual(field.types,expectedTypes))
     fail(tag+"property type differs from actual Zod: "+type+"."+field.name);
    const expectedObserved=proposal.evidence.filter(ref=>{
     const node=sourceSpecs.get(ref.path)?.elements?.[ref[idKey]];
     return Object.hasOwn(node?.props??{},field.name);
    }).map(ref=>({layoutId:ref.layoutId,nodeId:ref[idKey]}));
    if(field.schemaPointer!==dep.propsSchemaPath+"/properties/"+pointer(field.name)||
       field.required!==(schema.required??[]).includes(field.name)||
       !isDeepStrictEqual(field.observedIn,expectedObserved))
     fail(tag+"property provenance or schema pointer mismatch: "+type+"."+field.name);
   }
  }
  const names=sort(proposal.dependencies.primitives.map(x=>x.type));
  if(!isDeepStrictEqual(names,sort([...new Set([
   proposal.structure.parentType,proposal.structure.childType
  ])])))fail(tag+"unexpected primitive dependencies");
  for(const candidate of proposal.dependencies.inspectExistingCompositions){
   const manifestEntry=official.get(candidate.name);
   const lockEntry=locked.get(candidate.name);
   const manifestSource=manifest.components.find(x=>x.name===candidate.name &&
    candidate.templatePath==="src/ui-catalog/extensions/composites/templates/"+x.template);
   if(!manifestEntry||!lockEntry||lockEntry.status!=="approved"||
      manifestEntry.tier==="base"||manifestEntry.lifecycle!=="stable"||
      !manifestSource||!candidate.relationOnly){
    fail(tag+"unapproved existing-composition suggestion: "+candidate.name);
    continue;
   }
   const template=input.read(candidate.templatePath);
   const matches=Object.values(template?.elements??{}).reduce((total,node)=>{
    if(node?.type!==proposal.structure.parentType)return total;
    const children=proposal.structure.relation==="children"?node.children:
     node.slots?.[proposal.structure.relation.slice(6)];
    return total+(children??[]).filter(id=>
     template.elements[id]?.type===proposal.structure.childType).length;
   },0);
   if(matches!==candidate.structuralOccurrences)
    fail(tag+"stale existing-composition structure: "+candidate.name);
  }
  const hasNested=proposal.evidence.some(ref=>
   (sourceSpecs.get(ref.path)?.elements?.[ref.childId]?.children??[]).length>0);
  if(hasNested!==proposal.slots.some(s=>s.name==="nestedContent"))
   fail(tag+"missing or invented nested-content slot");
  const first=proposal.slots[0];
  if(first && (first.proposedBinding!==
     (proposal.structure.relation==="children"?"parent.children":"parent."+proposal.structure.relation)||
     first.acceptsExistingType!==proposal.structure.childType))
    fail(tag+"proposed content binding is not the observed tree relation");
  for(const slot of proposal.slots){
   const counts=proposal.evidence.map(ref=>{
    const spec=sourceSpecs.get(ref.path);
    const parent=spec?.elements?.[ref.parentId];
    const child=spec?.elements?.[ref.childId];
    const value=slot.name==="content"?
     (ref.relation==="children"?parent?.children:parent?.slots?.[ref.relation.slice(6)]):
     child?.children;
    return Array.isArray(value)?value.length:-1;
   });
   if(counts.some(n=>n<0)||slot.observedChildren.min!==Math.min(...counts)||
      slot.observedChildren.max!==Math.max(...counts)||
      (slot.name==="nestedContent" &&
       (slot.proposedBinding!=="child.children"||slot.acceptsExistingType!==null)))
    fail(tag+"proposed slot cardinality/binding differs from source");
  }
  evaluations.push({
   proposalId:proposal.id,zod:"passed",contracts:"existing-primitives-only",
   admission:"not-requested",runtime:"not-tested",
   canPublish:false,canExecuteAsComposite:false,canGrantPiPermissions:false
  });
 }
 if(report.summary.candidateCount!==report.proposals.length||
    report.summary.independentOriginCount!==report.proposals.filter(p=>p.evidenceLevel==="cross-origin-static-evidence").length||
    report.summary.sameOriginCount!==report.proposals.filter(p=>p.evidenceLevel==="same-origin-candidate").length||
    report.summary.existingCompositeReviewCount!==report.proposals.filter(p=>p.strategy==="review-existing-compositions-first").length||
    report.summary.primitiveAssemblyCount!==report.proposals.filter(p=>p.strategy==="compose-admitted-primitives").length)
  fail("E05 proposal summary inconsistent with candidates");
 if(problems.length)throw Error("E05 validation blocked: "+problems.join(" | "));
 return {
  schemaVersion:1,status:"validated-advisory-only",
  authority:"none",piPublication:"forbidden",e2eCertification:"not-performed",
  summary:{validated:report.proposals.length,blocked:0,
   sourceScreenCount:new Set(report.proposals.flatMap(p=>p.evidence.map(x=>x.path))).size},
  evaluations
 };
}

function run(){
 const flag=process.argv[2];
 if(process.argv.length!==3||!["--check","--report"].includes(flag))
  throw Error("Usage: tsx scripts/validate-layout-composition-proposals.ts --check|--report");
 const lock=read("src/ui-catalog/contracts.lock.json");
 const evidence=buildLayoutReuse(readLayoutPatterns(),lock.components.map((x)=>x.name));
 if(!isDeepStrictEqual(evidence,read("src/ui-requirements/layout-reuse-evidence.json")))
  throw Error("Stale E05 reviewed structural evidence");
 const comparison=compareLayoutReuseWithCatalog(evidence,lock,
  read("src/ui-catalog/extensions/composites/generated-manifest.json"),read);
 const propsSchemas=read("pi-catalog/props-json-schema.json");
 const proposals=buildLayoutCompositionProposals(comparison,evidence,lock,propsSchemas,read);
 const evaluation=validateE05AdvisoryReport(proposals,{
  read,lock,propsSchemas,pi:read("pi-catalog/contracts.json"),
  policy:read("src/ui-catalog/admission-engine/policy.json"),
  recipes:read("scripts/composition-codegen/recipes.json"),
  scenarios:read("src/ui-catalog/recommendations/scenarios.json"),
  sources:read("src/ui-catalog/sources.json"),
  protocols:read("src/ui-catalog/admission-engine/protocols.json"),
  entries:read("src/ui-catalog/admission-engine/entries.json"),
  manifest:read("src/ui-catalog/extensions/composites/generated-manifest.json")
 });
 if(flag==="--report"){
  const path="reports/layout-reuse/validation.json";
  mkdirSync(dirname(path),{recursive:true});
  writeFileSync(path,JSON.stringify(evaluation,null,2)+"\n");
  console.log("Wrote "+path);
 }
 console.log("✓ E05 Zod + contract + Admission Engine: "+
  evaluation.summary.validated+" advisory proposals; no Pi admission or new permissions.");
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{run();}catch(error){
  console.error("✗ E05 proposal validation: "+(error instanceof Error?error.message:String(error)));
  process.exitCode=1;
 }
}
