/** E05: offline evidence of repeated JSON layout structures; never an admission decision. */
import {readdirSync,readFileSync} from "node:fs";
import {join} from "node:path";
import {graphErrors} from "./spec-invariants.mjs";

const pairKey=(parent,child,relation)=>JSON.stringify([relation,parent,child]);
const compare=(a,b)=>a.localeCompare(b,"en");
const sortEvidence=(a,b)=>compare(a.layoutId,b.layoutId)||
 compare(a.parentId,b.parentId)||compare(a.relation,b.relation)||
 a.index-b.index||compare(a.childId,b.childId);

export function readLayoutPatterns(directory="src/ui-patterns"){
 const files=readdirSync(directory).filter(name=>name.endsWith(".json")&&!name.endsWith(".meta.json")).sort(compare);
 return files.map(filename=>{
  const id=filename.slice(0,-5);
  if(!/^[a-z0-9-]+$/.test(id))throw Error("Invalid layout pattern filename: "+filename);
  const metaFile=id+".meta.json";
  const spec=JSON.parse(readFileSync(join(directory,filename),"utf8"));
  const meta=JSON.parse(readFileSync(join(directory,metaFile),"utf8"));
  return {id,spec,meta,sourcePath:"src/ui-patterns/"+filename,
   metadataPath:"src/ui-patterns/"+metaFile};
 });
}

/**
 * Count independent pattern IDs and independent originScreen labels.
 * Names and IDs in examples are evidence pointers, NOT signature inputs.
 * Two-node adjacency is intentionally only a structural hint: it cannot prove
 * equivalent behavior, accessibility, responsive quality or human approval.
 */
export function buildLayoutReuse(layouts,allowedTypes){
 if(!Array.isArray(layouts)||!Array.isArray(allowedTypes))throw Error("Invalid layout reuse inputs");
 const groups=new Map(),approved=[],excluded=[];
 const seen=new Set();
 for(const item of [...layouts].sort((a,b)=>compare(a.id,b.id))){
  if(!item||typeof item.id!=="string"||seen.has(item.id))throw Error("Duplicate or invalid layout ID");
  seen.add(item.id);
  const {id,spec,meta,sourcePath,metadataPath}=item;
  if(!meta||meta.id!==id)throw Error(id+": missing or mismatched metadata ID");
  if(meta.approved!==true){excluded.push(id);continue;}
  if(meta.immutableContracts!==true||meta.sourceRoot!==spec?.root||
   typeof meta.originScreen!=="string"||!meta.originScreen.trim()||
   typeof sourcePath!=="string"||typeof metadataPath!=="string")
   throw Error(id+": incomplete approved layout provenance");
  const problems=graphErrors(spec,allowedTypes);
  if(problems.length)throw Error(id+": invalid approved JSON tree: "+problems.join("; "));
  approved.push({layoutId:id,originScreen:meta.originScreen,sourcePath,metadataPath,
   rootId:spec.root});
  for(const [parentId,node] of Object.entries(spec.elements)){
   const relationships=[{relation:"children",children:node.children}];
   for(const [slot,children] of Object.entries(node.slots??{}))
    relationships.push({relation:"slots."+slot,children});
   for(const {relation,children} of relationships){
    for(const [index,childId] of children.entries()){
     const child=spec.elements[childId];
     const key=pairKey(node.type,child.type,relation);
     if(!groups.has(key))groups.set(key,{parentType:node.type,childType:child.type,relation,evidence:[]});
     groups.get(key).evidence.push({layoutId:id,originScreen:meta.originScreen,
      sourcePath,metadataPath,parentId,childId,relation,index});
    }
   }
  }
 }
 const structures=[],sameOriginCandidates=[];
 for(const [key,group] of [...groups].sort((a,b)=>compare(a[0],b[0]))){
  const evidence=group.evidence.sort(sortEvidence);
  const layoutIds=[...new Set(evidence.map(e=>e.layoutId))].sort(compare);
  if(layoutIds.length<2)continue; // repeated occurrences in one layout are not reuse
  const originScreens=[...new Set(evidence.map(e=>e.originScreen))].sort(compare);
  const record={id:key,structure:{parentType:group.parentType,childType:group.childType,
   relation:group.relation},layoutCount:layoutIds.length,originCount:originScreens.length,
   occurrenceCount:evidence.length,layoutIds,originScreens,evidence,
   status:originScreens.length>=2?"cross-origin-static-evidence":"same-origin-candidate"};
  (originScreens.length>=2?structures:sameOriginCandidates).push(record);
 }
 return {schemaVersion:1,status:"static-evidence-only",
  authorization:"does-not-admit-contracts-components-actions-or-pi-permissions",
  criterion:"pair-of-adjacent-admitted-types-in-two-approved-patterns-from-distinct-originScreen-labels",
  limitations:"Structural metadata is not independent human approval, behavioral equivalence, visual/browser evidence or proof of actual reuse.",
  approvedLayouts:approved,excludedLayouts:excluded,
  summary:{approvedLayoutCount:approved.length,excludedLayoutCount:excluded.length,
   crossOriginStructureCount:structures.length,sameOriginCandidateCount:sameOriginCandidates.length},
  recurrentStructures:structures,sameOriginCandidates};
}
