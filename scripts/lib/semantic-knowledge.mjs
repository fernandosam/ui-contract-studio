import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, sep } from "node:path";
import {buildCapabilityGapAudit} from "./semantic-capability-audit.mjs";
import {buildSemanticTestAutomation} from "./semantic-test-automation.mjs";
import { buildSemanticCoverage } from "./semantic-coverage.mjs";
import { auditSemanticFreshness } from "./semantic-freshness.mjs";
import { rankSemanticEnrichment } from "./semantic-priority.mjs";
import {auditSemanticContractConformance,validateSemanticContractDecision} from "./semantic-contract-conformance.mjs";

const readJson = file => JSON.parse(readFileSync(file, "utf8"));
const uniq = values => [...new Set(values)].sort((a,b) => a.localeCompare(b));
const hasContent = value => typeof value === "string" && value.trim().length > 0;
const safeName = value => typeof value === "string" && /^[A-Z][A-Za-z0-9]+$/.test(value);
const flags = new Set(["implemented-static-evidence","documented-not-implemented","runtime-review-required"]);
const testKinds = new Set(["integration","manual-a11y","visual","candidate-not-executable"]);
const slugify = name => name.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();
const knowledgeRoot = "src/ui-catalog/knowledge/";

function readOptional(root,path,fallback) {
  return existsSync(resolve(root,path)) ? readJson(resolve(root,path)) : fallback;
}

export function validateSemanticOverlay(record, root = process.cwd()) {
  const errors = [], component=record.component ?? "<unknown>";
  const err = msg => errors.push(component + ": " + msg);
  if(record.schemaVersion!==1 || !safeName(record.component))err("schemaVersion or component invalid");
  if(record.language!=="pt-BR" || !["reviewed-documentation","draft"].includes(record.status))
    err("localized review status is mandatory; documentation never approves Pi capabilities");
  if(record.admission!==undefined && record.admission!=="candidate-not-admitted")
    err("invalid documentation-only admission marker");
  const reuiUrl="https://reui.io/components/"+slugify(component);
  const shadcnPrefix="https://ui.shadcn.com/docs/components/";
  if(!record.source ||
    !(record.source.provider==="ReUI" && record.source.url===reuiUrl ||
      record.source.provider==="shadcn" && record.source.url?.startsWith(shadcnPrefix)) ||
    !/^\d{4}-\d\d-\d\d$/.test(record.source.reviewedOn??"") ||
    !Array.isArray(record.source.sections) || record.source.sections.length===0 ||
    record.source.sections.some(x=>!hasContent(x)))
    err("invalid curated official source or section provenance");
  for(const key of ["purpose"])if(!hasContent(record[key]))err(key+" must be nonempty");
  for(const key of ["rationale","whenUse","whenNotUse","agentNotes"]) {
    if(!Array.isArray(record[key]) || !record[key].length || record[key].some(x=>!hasContent(x)))
      err(key+" must contain nonempty guidance");
  }
  if(!Array.isArray(record.capabilities)||!record.capabilities.length)
    err("curated capability records required");
  const capIds=new Set();
  for(const cap of record.capabilities??[]){
    if(!hasContent(cap.id)||capIds.has(cap.id))err("capability ID duplicate or missing");
    capIds.add(cap.id);
    if(!flags.has(cap.state)||!hasContent(cap.description))err("capability state/description invalid "+cap.id);
    if(!Array.isArray(cap.evidence))err("evidence must be an array "+cap.id);
    if(!Array.isArray(cap.testRequirements)||!cap.testRequirements.length||
       cap.testRequirements.some(x=>!hasContent(x)))err("test requirements missing "+cap.id);
    if(cap.state==="implemented-static-evidence" && !(cap.evidence?.length))
      err("claimed implemented capability needs first-party evidence "+cap.id);
    if(cap.state!=="implemented-static-evidence" && cap.evidence?.length)
      err("unverified capability may not claim implementation evidence "+cap.id);
    for(const issue of validateSemanticContractDecision(cap))err(cap.id+": "+issue);
    for(const source of cap.evidence??[]){
      if(!hasContent(source.path)||!hasContent(source.contains)||source.contains.length>500||
         !source.path.startsWith("src/")||source.path.includes("..")||
         /[\r\n]/.test(source.path) || !/^[a-zA-Z0-9_./-]+$/.test(source.path)){
        err("unsafe evidence path/needle for "+cap.id);continue;
      }
      const path=resolve(root,source.path),rootPath=resolve(root);
      if(!(path.startsWith(rootPath+sep)) || !existsSync(path) ||
         !readFileSync(path,"utf8").includes(source.contains))
        err("stale or missing code evidence: "+cap.id+" -> "+source.path);
    }
  }
  if(!Array.isArray(record.integrations))err("integration candidates required");
  const integr=new Set();
  for(const item of record.integrations??[]) {
    if(!safeName(item.component)||!hasContent(item.relationship)||!hasContent(item.reason)||
      integr.has(item.component))err("integration candidate invalid/duplicate "+item.component);
    integr.add(item.component);
  }
  if(!Array.isArray(record.faqDecisions)||record.faqDecisions.some(x=>!hasContent(x.question)||!hasContent(x.guidance)))
    err("FAQ decisions invalid");
  if(!Array.isArray(record.derivedTestCases)||!record.derivedTestCases.length)
    err("test cases required");
  const ids=new Set();
  for(const item of record.derivedTestCases??[]){
    if(!hasContent(item.id)||ids.has(item.id)||!testKinds.has(item.kind)||!hasContent(item.description)||
      !Array.isArray(item.capabilities)||!item.capabilities.length ||
      item.capabilities.some(id=>!capIds.has(id)))
      err("test case missing or invalid "+item.id);
    ids.add(item.id);
  }
  return uniq(errors);
}

/**
 * Families' existing guidance is automatically included; curated overlays may
 * enrich individual components but never extend the public Zod/Pi API.
 */
export function buildSemanticKnowledge({root=process.cwd(),contracts=[],reuiExamples=[],approvedNames}={}) {
  const errors=[], profiles=new Map();
  const official=readOptional(root,"src/ui-catalog/shadcn-guidance.json",{});
  const reui=readOptional(root,"src/ui-catalog/reui-guidance.json",{});
  const semantics=readOptional(root,"src/ui-catalog/semantic-contract-guidance.json",{contracts:{}}).contracts??{};
  const approved=approvedNames ?? new Set(readOptional(root,"src/ui-catalog/contracts.lock.json",{components:[]}).components.map(x=>x.name));
  const ensure=name=>{
    if(!profiles.has(name))profiles.set(name,{
      component:name,sources:[],whenUse:[],whenNotUse:[],agentNotes:[],
      integrations:[],capabilities:[],faqDecisions:[],derivedTestCases:[],
      purpose:null,rationale:[],documentationReview:"guidance-only",
    });
    return profiles.get(name);
  };
  const add=(name,guide,source)=>{
    const profile=ensure(name);
    profile.sources.push(source);
    for(const key of ["whenUse","whenNotUse","agentNotes"])
      profile[key]=uniq(profile[key].concat(guide[key]??[]));
  };
  for(const [name,guide] of Object.entries(reui))
    add(name,guide,"src/ui-catalog/reui-guidance.json");
  for(const [name,guide] of Object.entries(official))
    add(name,guide,"src/ui-catalog/shadcn-guidance.json");
  for(const [name,guide] of Object.entries(semantics))
    add(name,guide,"src/ui-catalog/semantic-contract-guidance.json");
  const folder=resolve(root,knowledgeRoot);
  const curated=existsSync(folder) ? readdirSync(folder).filter(x=>x.endsWith(".json")).sort():[];
  for(const filename of curated){
    const path=knowledgeRoot+filename;
    const doc=readJson(resolve(root,path));
    errors.push(...validateSemanticOverlay(doc,root));
    if(filename!==doc.component.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase()+".json")
      errors.push(path+": filename/component mismatch");
    if(!approved.has(doc.component) && !profiles.has(doc.component) && doc.admission!=="candidate-not-admitted")
      errors.push(path+": unknown component, cannot attach curated semantics without explicit candidate marker");
    if(approved.has(doc.component) && doc.admission==="candidate-not-admitted")
      errors.push(path+": candidate marker conflicts with approved Pi type; explicit promotion review required");
    const profile=ensure(doc.component);
    if(profile.curatedSource)errors.push(doc.component+": duplicate curated overlay");
    profile.curatedSource=path;
    profile.sources.push(path);
    profile.purpose=doc.purpose;
    profile.rationale=doc.rationale;
    profile.documentationReview=doc.status;
    profile.knowledgeAdmission=doc.admission??"existing-catalog-guidance";
    for(const key of ["whenUse","whenNotUse","agentNotes"])
      profile[key]=uniq(profile[key].concat(doc[key]??[]));
    profile.capabilities=doc.capabilities;
    profile.integrations=doc.integrations;
    profile.faqDecisions=doc.faqDecisions;
    profile.derivedTestCases=doc.derivedTestCases;
    profile.provenance=doc.source;
  }
  const byContract=new Map(contracts.map(x=>[x.name,x]));
  const records=[...profiles.values()].sort((a,b)=>a.component.localeCompare(b.component))
    .map(profile=>{
      const dependencies=byContract.get(profile.component)?.dependencies??[];
      const sourceRecommendations=(profile.integrations??[]).map(x=>({
        ...x,
        implementedDependency:byContract.has(profile.component) ? dependencies.includes(x.component) : null,
        approvedPiType:approved.has(x.component),
        admission:"advisory-only",
      }));
      const gaps=profile.capabilities.filter(x=>x.state!=="implemented-static-evidence")
        .map(x=>({id:x.id,description:x.description,state:x.state}));
      return {...profile, sources:uniq(profile.sources),
        approvedPiType:approved.has(profile.component),
        integrationCandidates:sourceRecommendations,
        implementationGaps:gaps,
        contractDependencies:dependencies,
      };
    });
  const capabilityAudit=buildCapabilityGapAudit(records,{root});
  for(const profile of records){
    profile.implementationGaps=capabilityAudit.gaps
      .filter(x=>x.component===profile.component)
      .map(x=>({id:x.capability,description:x.description,state:x.state,
        availability:x.availability,reason:x.reason,source:x.source,
        evidenceChecks:x.evidenceChecks}));
  }
  const semanticConformance=auditSemanticContractConformance({root,profiles:records,capabilityAudit});
  errors.push(...semanticConformance.errors);
  const semanticTestAutomation=buildSemanticTestAutomation(records);
  errors.push(...semanticTestAutomation.errors);
  const byName=new Map(records.map(x=>[x.component,x]));
  const associatedExamples=reuiExamples.map(x=>({
    exampleId:x.id,family:x.family,source:x.sourcePath,profile:x.family,
    hasFamilyGuidance:byName.has(x.family),manualDecision:x.decision,
    approvedPiType:false,
  }));
  for(const example of associatedExamples)
    if(!example.hasFamilyGuidance)
      errors.push(example.exampleId+": ReUI example family must have semantic guidance");
  return {
    report:{
      schemaVersion:1,
      disclaimer:"Documentation guidance and code evidence do not authorize new props, events, backend actions, or Pi contracts.",
      coverage:{reuiFamilies:Object.keys(reui).length,shadcnGuides:Object.keys(official).length,
        semanticContracts:Object.keys(semantics).length,curatedOverlays:curated.length,
        coveredExamples:associatedExamples.length},
      profiles:records,
      capabilityAudit,
      semanticConformance,
      semanticTestAutomation,
      semanticCoverage:buildSemanticCoverage({
        profiles:records,reuiExamples,reuiFamilies:Object.keys(reui),
      }),
      reuiExampleProfiles:associatedExamples,
      semanticFreshness:auditSemanticFreshness({root,profiles:records}),
      enrichmentPriorities:rankSemanticEnrichment(records,associatedExamples),
    },
    errors:uniq(errors),
  };
}

export function selectAgentSemanticAdvice(report,selectedTypes) {
  const wanted=new Set(selectedTypes);
  return report.profiles.filter(x=>wanted.has(x.component)&&x.approvedPiType)
    .map(x=>({
      type:x.component,whenUse:x.whenUse,whenNotUse:x.whenNotUse,
      agentNotes:x.agentNotes,
      verifiedStaticCapabilities:x.capabilities.filter(c=>
        report.capabilityAudit?.entries.some(entry=>
          entry.component===x.component && entry.capability===c.id &&
          entry.availability==="verified-static"))
        .map(c=>({id:c.id,description:c.description})),
      implementationGaps:x.implementationGaps,
      integrationCandidates:x.integrationCandidates.map(i=>({
        component:i.component,relationship:i.relationship,
        approvedPiType:i.approvedPiType,implementedDependency:i.implementedDependency,
        admission:"not-granted",
      })),
      guidanceOnly:true,
    }));
}
