/** E05: evidence/behavior regression fingerprints; deliberately NOT runtime equivalence. */
import {createHash} from "node:crypto";
import {isDeepStrictEqual} from "node:util";
import {graphErrors} from "./spec-invariants.mjs";

const order=(a,b)=>a.localeCompare(b,"en");
const digest=(value)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
const ids=(rows)=>rows.map(x=>x.id).sort(order);
const ensure=(ok,message)=>{if(!ok)throw Error("E05 traceability: "+message);};
const refKey=({layoutId,parentId,childId,relation,index})=>
 JSON.stringify([layoutId,parentId,childId,relation,index]);
const proposalRef=({layoutId,originScreen,sourcePath,parentId,childId,relation,index})=>({
 layoutId,originScreen,path:sourcePath,parentId,childId,relation,index
});
const mapUnique=(rows,label)=>{
 const m=new Map();
 for(const row of rows){
  ensure(row&&typeof row.id==="string"&&!m.has(row.id),label+" has duplicate/invalid IDs");
  m.set(row.id,row);
 }
 return m;
};

/**
 * Checks EVERY declared E05 occurrence against current approved JSON and its metadata.
 * Hashes cover the *observed* declarative state, props and descendants, not browser
 * behavior; a passing audit must never be interpreted as functional equivalence.
 */
export function auditE05Reuse({evidence,comparison,proposals,read,allowedTypes}){
 ensure(evidence?.schemaVersion===1&&evidence.status==="static-evidence-only"&&
  comparison?.status==="static-comparison-only"&&
  proposals?.status==="proposals-only-not-authorized","invalid report statuses");
 ensure(typeof read==="function"&&Array.isArray(allowedTypes)&&
  Array.isArray(evidence.recurrentStructures)&&Array.isArray(evidence.sameOriginCandidates)&&
  Array.isArray(comparison.comparisons)&&Array.isArray(proposals.proposals),"invalid inputs");
 const candidates=mapUnique([...evidence.recurrentStructures,...evidence.sameOriginCandidates],"evidence");
 const compared=mapUnique(comparison.comparisons.map(x=>({...x,id:x.structureId})),"comparison");
 const proposed=mapUnique(proposals.proposals,"proposals");
 ensure(candidates.size>0&&candidates.size===compared.size&&candidates.size===proposed.size,
  "missing/extra candidates across evidence, comparison and proposals");
 const byStructure=new Map();
 for(const proposal of proposals.proposals){
  const key=JSON.stringify([proposal.structure.relation,proposal.structure.parentType,
   proposal.structure.childType]);
  ensure(!byStructure.has(key),"duplicate proposal structure");
  byStructure.set(key,proposal);
 }
 ensure(byStructure.size===candidates.size,"missing proposal structures");
 const results=[];
 for(const [id,candidate] of [...candidates].sort(([a],[b])=>order(a,b))){
  const comparisonRow=compared.get(id),p=byStructure.get(id);
  ensure(comparisonRow&&p,"missing comparison or proposal for "+id);
  ensure(p.id==="e05-"+candidate.structure.relation.replaceAll(".","-")+"-"+
   candidate.structure.parentType.toLowerCase()+"-"+candidate.structure.childType.toLowerCase(),
   "invalid proposal ID "+id);
  ensure(isDeepStrictEqual(candidate.structure,comparisonRow.structure)&&
   isDeepStrictEqual(candidate.structure,p.structure),"structure mismatch "+id);
  ensure(candidate.status===comparisonRow.originEvidenceStatus&&
   candidate.status===p.evidenceLevel&&
   isDeepStrictEqual(candidate.layoutIds,comparisonRow.sourceLayoutIds),"evidence status/layout mismatch "+id);
  ensure(p.status==="advisory-not-admitted"&&p.permissionImpact==="none"&&
   comparisonRow.reuseIsProven===false,"unauthorized equivalence/admission claim "+id);
  ensure(Array.isArray(candidate.evidence)&&candidate.evidence.length>0&&
   Array.isArray(p.evidence)&&p.evidence.length===candidate.evidence.length,
   "missing occurrence trace "+id);
  const primitiveTypes=[...new Set([candidate.structure.parentType,candidate.structure.childType])].sort(order);
  ensure(isDeepStrictEqual((p.dependencies?.primitives??[]).map(x=>x.type).sort(order),primitiveTypes),
   "primitive dependency mismatch "+id);
  const expectedComposites=(comparisonRow.existingCompositions??[]).map(x=>({
   name:x.componentName,templatePath:x.templatePath,
   structuralOccurrences:x.occurrences.length,relationOnly:true
  })).sort((a,b)=>order(a.name,b.name));
  ensure(isDeepStrictEqual(p.dependencies.inspectExistingCompositions,expectedComposites),
   "composite reference mismatch "+id);
  ensure(comparisonRow.existingCompositionCount===expectedComposites.length,
   "composite count mismatch "+id);
  const seen=new Set(),occurrences=[];
  for(let i=0;i<candidate.evidence.length;i++){
   const occurrence=candidate.evidence[i],ref=p.evidence[i];
   ensure(isDeepStrictEqual(ref,proposalRef(occurrence)),"proposal provenance mismatch "+id);
   ensure(ref.path==="src/ui-patterns/"+ref.layoutId+".json"&&
    occurrence.metadataPath==="src/ui-patterns/"+ref.layoutId+".meta.json",
    "untrusted path "+id);
   const key=refKey(ref);
   ensure(!seen.has(key),"duplicate occurrence "+id);
   seen.add(key);
   const meta=read(occurrence.metadataPath);
   const spec=read(ref.path);
   ensure(meta?.id===ref.layoutId&&meta.approved===true&&
    meta.immutableContracts===true&&meta.originScreen===ref.originScreen&&
    meta.sourceRoot===spec.root,"approval/origin metadata mismatch "+ref.layoutId);
   const problems=graphErrors(spec,allowedTypes);
   ensure(problems.length===0,"invalid source graph "+ref.layoutId+": "+problems.join("; "));
   const parent=spec.elements[ref.parentId],child=spec.elements[ref.childId];
   const siblings=ref.relation==="children"?parent?.children:
    ref.relation.startsWith("slots.")?parent?.slots?.[ref.relation.slice(6)]:null;
   ensure(parent?.type===candidate.structure.parentType&&
    child?.type===candidate.structure.childType&&
    ref.relation===candidate.structure.relation&&
    Number.isInteger(ref.index)&&siblings?.[ref.index]===ref.childId,
    "source edge/order drift "+key);
   // The fingerprint includes state and whole JSON graph: changes to nested
   // actions, siblings, bindings or props remain visible even if edge IDs persist.
   occurrences.push({
    layoutId:ref.layoutId,originScreen:ref.originScreen,path:ref.path,
    metadataPath:occurrence.metadataPath,parentId:ref.parentId,childId:ref.childId,
    relation:ref.relation,index:ref.index,
    sourceFingerprint:digest(spec),
    edgeFingerprint:digest({parent,child,state:spec.state??null}),
    propsFingerprint:digest({parent:parent.props??{},child:child.props??{}}),
    childCount:siblings.length
   });
  }
  const actualLayouts=[...new Set(occurrences.map(x=>x.layoutId))].sort(order);
  const actualOrigins=[...new Set(occurrences.map(x=>x.originScreen))].sort(order);
  ensure(isDeepStrictEqual(actualLayouts,candidate.layoutIds)&&
   isDeepStrictEqual(actualOrigins,candidate.originScreens)&&
   candidate.layoutCount===actualLayouts.length&&
   candidate.originCount===actualOrigins.length&&
   candidate.occurrenceCount===occurrences.length,"origin/count drift "+id);
  ensure(candidate.status===(actualOrigins.length>=2?"cross-origin-static-evidence":"same-origin-candidate"),
   "false cross-origin reuse claim "+id);
  results.push({structureId:id,proposalId:p.id,evidenceLevel:candidate.status,
   traceability:"verified-against-approved-json-and-metadata",
   declarativeRegression:"fingerprints-recorded",
   functionalEquivalence:"not-established-no-executable-composite-or-browser-proof",
   canReplaceExistingComponent:false,canPublish:false,canGrantPiPermissions:false,
   occurrences});
 }
 ensure(results.length===proposals.summary.candidateCount&&
  results.filter(x=>x.evidenceLevel==="cross-origin-static-evidence").length===
   proposals.summary.independentOriginCount&&
  results.filter(x=>x.evidenceLevel==="same-origin-candidate").length===
   proposals.summary.sameOriginCount,"proposal summary drift");
 return {
  schemaVersion:1,status:"traceability-verified-functional-equivalence-not-certified",
  authorization:"no-contract-admission-no-pi-permissions-no-runtime-certification",
  limitations:"SHA-256 fingerprints detect declarative source changes but do not certify equivalent user actions, keyboard behavior, accessibility, visual fidelity or responsive behavior. Proposed composites are not executable.",
  summary:{candidateCount:results.length,traceableOccurrences:results.reduce((sum,x)=>sum+x.occurrences.length,0),
   functionalEquivalencesCertified:0,independentOriginCandidates:results.filter(x=>x.evidenceLevel==="cross-origin-static-evidence").length},
  candidates:results
 };
}
