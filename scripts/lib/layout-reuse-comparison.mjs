/** E05: conservative static lookup against approved primitives and reviewed JSON compositions. */
import {graphErrors} from "./spec-invariants.mjs";

const sort=(a,b)=>a.localeCompare(b,"en");
const edgeKey=({parentType,childType,relation})=>JSON.stringify([relation,parentType,childType]);

export function compareLayoutReuseWithCatalog(evidence,lock,manifest,loadTemplate){
 if(evidence?.schemaVersion!==1||evidence.status!=="static-evidence-only"||
   !Array.isArray(evidence.recurrentStructures)||!Array.isArray(evidence.sameOriginCandidates))
  throw Error("Invalid E05 structural evidence");
 if(!Array.isArray(lock?.components)||!Array.isArray(manifest?.components)||typeof loadTemplate!=="function")
  throw Error("Invalid approved catalog inputs");
 const approved=new Map();
 for(const item of lock.components){
  if(!item||typeof item.name!=="string"||approved.has(item.name))
   throw Error("Invalid or duplicate contract in lock");
  approved.set(item.name,item);
 }
 const primitiveTypes=[...approved.values()].filter(x=>x.status==="approved"&&x.tier==="base")
  .map(x=>x.name).sort(sort);
 const primitiveSet=new Set(primitiveTypes);
 const candidateList=[...evidence.recurrentStructures,...evidence.sameOriginCandidates];
 const candidateKeys=new Set();
 for(const candidate of candidateList){
  if(!candidate?.structure||typeof candidate.id!=="string"||
     candidate.id!==edgeKey(candidate.structure)||candidateKeys.has(candidate.id))
   throw Error("Invalid or duplicate E05 structure");
  candidateKeys.add(candidate.id);
  const cross=candidate.originCount>=2 && candidate.layoutCount>=2;
  if(candidate.status!==(cross?"cross-origin-static-evidence":"same-origin-candidate")||
     !Array.isArray(candidate.evidence)||candidate.evidence.length!==candidate.occurrenceCount||
     candidate.layoutCount<2||!candidate.layoutIds||!candidate.originScreens||
     candidate.layoutIds.length!==candidate.layoutCount||
     candidate.originScreens.length!==candidate.originCount)
   throw Error("Inconsistent E05 origin or occurrence evidence: "+candidate.id);
 }
 const compositions=[];
 const seenNames=new Set(),seenTemplates=new Set();
 for(const entry of manifest.components){
  if(!entry||typeof entry.name!=="string"||typeof entry.template!=="string"||
     !/^[a-z0-9-]+\.json$/.test(entry.template)||
     seenNames.has(entry.name)||seenTemplates.has(entry.template))
   throw Error("Invalid, duplicated or unsafe composite manifest entry");
  seenNames.add(entry.name);seenTemplates.add(entry.template);
  if(approved.get(entry.name)?.status!=="approved")
   throw Error("Composite not approved in lock: "+entry.name);
  const path="src/ui-catalog/extensions/composites/templates/"+entry.template;
  const spec=loadTemplate(path);
  const errors=graphErrors(spec,[...approved.values()].filter(x=>x.status==="approved").map(x=>x.name));
  if(errors.length)throw Error("Invalid composite template "+path+": "+errors.join("; "));
  const byStructure=new Map();
  for(const [parentId,node] of Object.entries(spec.elements)){
   const relations=[["children",node.children],...Object.entries(node.slots??{}).map(([slot,ids])=>["slots."+slot,ids])];
   for(const [relation,children] of relations)for(const [index,childId] of children.entries()){
    const child=spec.elements[childId];
    const key=edgeKey({parentType:node.type,childType:child.type,relation});
    if(!byStructure.has(key))byStructure.set(key,[]);
    byStructure.get(key).push({parentId,childId,relation,index});
   }
  }
  compositions.push({name:entry.name,path,byStructure});
 }
 compositions.sort((a,b)=>sort(a.name,b.name));
 const comparisons=candidateList.map(candidate=>{
  const {parentType,childType,relation}=candidate.structure;
  const coveredByPrimitives=primitiveSet.has(parentType)&&primitiveSet.has(childType);
  const matches=compositions.flatMap(c=>{
   const occurrences=c.byStructure.get(candidate.id);
   return occurrences?.length?[{componentName:c.name,templatePath:c.path,
    occurrences:occurrences.sort((a,b)=>sort(a.parentId,b.parentId)||a.index-b.index||sort(a.childId,b.childId))}]:[];
  });
  const matchStatus=matches.length?"structural-match-in-existing-composition":
   coveredByPrimitives?"already-composable-with-primitives":"requires-manual-review";
  return {structureId:candidate.id,structure:candidate.structure,
   originEvidenceStatus:candidate.status,layoutCount:candidate.layoutCount,originCount:candidate.originCount,
   sourceLayoutIds:candidate.layoutIds,primitiveCoverage:{
    parent:primitiveSet.has(parentType)?{name:parentType,contractPath:"src/ui-catalog/contracts.lock.json"}:null,
    child:primitiveSet.has(childType)?{name:childType,contractPath:"src/ui-catalog/contracts.lock.json"}:null},
   matchStatus,existingCompositionCount:matches.length,existingCompositions:matches,
   recommendation:matches.length?"inspect-existing-compositions-before-proposing":
    coveredByPrimitives?"compose-approved-primitives-before-proposing":"manual-catalog-review-required",
   reuseIsProven:false};
 }).sort((a,b)=>sort(a.structureId,b.structureId));
 return {
  schemaVersion:1,status:"static-comparison-only",
  authorization:"does-not-create-admit-or-publish-components-or-change-zod-pi-permissions",
  sourceEvidencePath:"src/ui-requirements/layout-reuse-evidence.json",
  comparedCatalogs:["src/ui-catalog/contracts.lock.json","src/ui-catalog/extensions/composites/generated-manifest.json"],
  limitations:"A matching two-node edge is not equivalent to complete component behavior, props, visual layout or accessibility. Only approved JSON templates in the generated manifest are inspected; custom TSX/ReUI implementations are outside this static comparison.",
  summary:{candidateCount:comparisons.length,crossOriginCount:comparisons.filter(x=>x.originEvidenceStatus==="cross-origin-static-evidence").length,
   sameOriginCount:comparisons.filter(x=>x.originEvidenceStatus==="same-origin-candidate").length,
   matchedCandidateCount:comparisons.filter(x=>x.existingCompositionCount>0).length,
   primitiveOnlyCount:comparisons.filter(x=>x.matchStatus==="already-composable-with-primitives").length,
   reviewedCompositeCount:compositions.length},comparisons
 };
}
