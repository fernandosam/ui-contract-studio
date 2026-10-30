/** E05: advisory interfaces built only from approved layout edges and existing primitive schemas. */
const sort = (a,b) => a.localeCompare(b,"en");
const purposeByEdge = {
 "Card>Stack": "Group structured information or related actions inside a card using an existing Stack.",
 "Card>Table": "Present tabular information within a card, without inventing data fetching or table behavior.",
 "Stack>Link": "Place navigation links within an existing stack while retaining the original Link contract.",
 "Card>Grid": "Arrange a grid of content inside a card without assuming responsive behavior beyond existing contracts.",
 "Grid>Card": "Arrange independent cards in a grid using only their currently admitted contracts."
};
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const pointer=s=>s.replaceAll("~","~0").replaceAll("/","~1");
const schemaKinds=shape=>[...new Set(
 [shape?.type,...(shape?.anyOf??[]).map(option=>option.type)].filter(x=>typeof x==="string")
)].sort(sort);
const range=lengths=>({min:Math.min(...lengths),max:Math.max(...lengths)});

/**
 * No proposals are executable. A composite-level property/slot is NOT inferred
 * from a primitive property or a JSON tree edge; admission is always separate.
 */
export function buildLayoutCompositionProposals(comparison,evidence,lock,propsSchemas,loadPattern){
 if(comparison?.schemaVersion!==1||comparison.status!=="static-comparison-only"||
    evidence?.schemaVersion!==1||evidence.status!=="static-evidence-only"||
    !Array.isArray(comparison.comparisons)||!Array.isArray(evidence.recurrentStructures)||
    !Array.isArray(evidence.sameOriginCandidates)||!Array.isArray(lock?.components)||
    propsSchemas?.schemaVersion!==3||!propsSchemas.types||
    typeof propsSchemas.types!=="object"||Array.isArray(propsSchemas.types)||
    typeof loadPattern!=="function")throw Error("Invalid E05 proposal inputs");
 const items=[...evidence.recurrentStructures,...evidence.sameOriginCandidates];
 if(items.length!==comparison.comparisons.length)throw Error("E05 comparison is missing candidates");
 const byId=new Map(items.map(x=>[x.id,x]));
 if(byId.size!==items.length)throw Error("Duplicate E05 evidence candidates");
 const byContract=new Map(lock.components.map(x=>[x.name,x]));
 if(byContract.size!==lock.components.length)throw Error("Duplicate contracts");
 const seen=new Set(), proposals=[];
 for(const match of comparison.comparisons){
  if(typeof match?.structureId!=="string"||seen.has(match.structureId))throw Error("Duplicate or invalid comparison candidate");
  seen.add(match.structureId);
  const candidate=byId.get(match.structureId);
  if(!candidate||JSON.stringify(candidate.structure)!==JSON.stringify(match.structure)||
     candidate.status!==match.originEvidenceStatus||
     candidate.layoutCount!==match.layoutCount||candidate.originCount!==match.originCount||
     JSON.stringify(candidate.layoutIds)!==JSON.stringify(match.sourceLayoutIds))
    throw Error("Stale or inconsistent E05 comparison: "+match.structureId);
  if(!Array.isArray(candidate.evidence)||candidate.evidence.length!==candidate.occurrenceCount||
     !Array.isArray(match.existingCompositions)||match.existingCompositionCount!==match.existingCompositions.length||
     !["structural-match-in-existing-composition","already-composable-with-primitives","requires-manual-review"].includes(match.matchStatus))
   throw Error("Invalid E05 candidate metadata: "+match.structureId);
  const {parentType,childType,relation}=candidate.structure;
  if(typeof parentType!=="string"||typeof childType!=="string"||
     !/^(children|slots\.[a-zA-Z][a-zA-Z0-9_-]*)$/.test(relation)||
     candidate.id!==JSON.stringify([relation,parentType,childType]))
   throw Error("Invalid E05 relationship: "+candidate.id);
  const dependencies=[...new Set([parentType,childType])].sort(sort).map(type=>{
   const contract=byContract.get(type);
   if(!contract||contract.tier!=="base"||contract.status!=="approved"||
      !/^\d+\.\d+\.\d+/.test(contract.version??"")||
      !/^[a-f0-9]{64}$/.test(contract.semanticFingerprint??""))
    throw Error("Missing approved, versioned primitive contract: "+type);
   const schema=propsSchemas.types[type];
   if(!schema||schema.type!=="object"||!schema.properties||
      typeof schema.properties!=="object"||Array.isArray(schema.properties)||
      schema.additionalProperties!==false)
    throw Error("Missing closed primitive JSON schema: "+type);
   return {type,version:contract.version,stability:contract.stability,
    fingerprint:contract.semanticFingerprint,lockPath:"src/ui-catalog/contracts.lock.json",
    propsSchemaPath:"pi-catalog/props-json-schema.json#/types/"+pointer(type)};
  });
  const samples=[];
  for(const occurrence of candidate.evidence){
   if(!candidate.layoutIds.includes(occurrence.layoutId)||occurrence.relation!==relation||
      typeof occurrence.sourcePath!=="string"||
      occurrence.sourcePath!=="src/ui-patterns/"+occurrence.layoutId+".json"||
      typeof occurrence.parentId!=="string"||typeof occurrence.childId!=="string"||
      !Number.isSafeInteger(occurrence.index)||occurrence.index<0)
    throw Error("Invalid E05 source pointer: "+candidate.id);
   const spec=loadPattern(occurrence.sourcePath);
   const parent=spec?.elements?.[occurrence.parentId],child=spec?.elements?.[occurrence.childId];
   const children=relation==="children"?parent?.children:parent?.slots?.[relation.slice(6)];
   if(parent?.type!==parentType||child?.type!==childType||children?.[occurrence.index]!==occurrence.childId)
    throw Error("E05 proposal source no longer matches: "+occurrence.sourcePath);
   for(const [type,node] of [[parentType,parent],[childType,child]]){
    if(!node.props||typeof node.props!=="object"||Array.isArray(node.props)||
       Object.keys(node.props).some(prop=>!own(propsSchemas.types[type].properties,prop)))
     throw Error("Source properties not in admitted primitive schema: "+occurrence.sourcePath+" ("+type+")");
   }
   samples.push({layoutId:occurrence.layoutId,originScreen:occurrence.originScreen,
    path:occurrence.sourcePath,parentId:occurrence.parentId,childId:occurrence.childId,
    relation,index:occurrence.index,parent,child,relationshipChildCount:children.length});
  }
  const properties=Object.fromEntries([["parent",parentType],["child",childType]].map(([role,type])=>{
   const schema=propsSchemas.types[type];
   const fields=Object.entries(schema.properties).sort(([a],[b])=>sort(a,b)).map(([name,shape])=>({
    name,types:schemaKinds(shape),required:(schema.required??[]).includes(name),
    schemaPointer:"pi-catalog/props-json-schema.json#/types/"+pointer(type)+"/properties/"+pointer(name),
    observedIn:samples.filter(x=>own(x[role].props,name))
     .map(x=>({layoutId:x.layoutId,nodeId:x[role==="parent"?"parentId":"childId"]})),
    scope:"primitive-property-only-not-an-admitted-composite-property"
   }));
   return [role,fields];
  }));
  const slots=[{
   name:"content",proposedBinding:relation==="children"?"parent.children":"parent."+relation,
   acceptsExistingType:childType,observedChildren:range(samples.map(x=>x.relationshipChildCount)),
   scope:"proposed-composition-interface-not-an-admitted-slot"
  }];
  if(samples.some(x=>x.child.children.length>0)){
   slots.push({name:"nestedContent",proposedBinding:"child.children",
    acceptsExistingType:null,observedChildren:range(samples.map(x=>x.child.children.length)),
    scope:"proposed-composition-interface-not-an-admitted-slot"});
  }
  const references=samples.map(({layoutId,originScreen,path,parentId,childId,relation,index})=>
   ({layoutId,originScreen,path,parentId,childId,relation,index}));
  const existingCompositions=match.existingCompositions.map(entry=>{
   const contract=byContract.get(entry.componentName);
   if(!contract||contract.status!=="approved"||contract.tier==="base"||
      typeof entry.templatePath!=="string"||!entry.templatePath.startsWith("src/ui-catalog/extensions/composites/templates/"))
    throw Error("Unapproved E05 suggested composite dependency: "+entry.componentName);
   return {name:entry.componentName,templatePath:entry.templatePath,
    structuralOccurrences:entry.occurrences.length,relationOnly:true};
  }).sort((a,b)=>sort(a.name,b.name));
  const sameOrigin=candidate.status!=="cross-origin-static-evidence";
  const strategy=sameOrigin?"observe-until-independent-origins":
   existingCompositions.length?"review-existing-compositions-first":
   match.matchStatus==="already-composable-with-primitives"?"compose-admitted-primitives":"manual-review-required";
  const purpose=purposeByEdge[parentType+">"+childType] ??
   "Consider grouping "+childType+" within "+parentType+"; verify the intended user flow before reuse.";
  proposals.push({
   id:"e05-"+relation.replaceAll(".","-")+"-"+parentType.toLowerCase()+"-"+childType.toLowerCase(),
   name:"Candidate: "+parentType+" + "+childType, status:"advisory-not-admitted",
   evidenceLevel:candidate.status, strategy,purpose,
   structure:{parentType,childType,relation}, properties,slots,
   dependencies:{primitives:dependencies,inspectExistingCompositions:existingCompositions},
   evidence:references,
   unresolved:["Validate full semantics, state/events, accessibility and responsive layout.",
    "Review possible duplication and actual substitutability before adding a composite.",
    "Only independent contract admission can introduce composite props, slots or Pi authorization."],
   permissionImpact:"none"
  });
 }
 return {schemaVersion:1,status:"proposals-only-not-authorized",
  sourcePaths:["src/ui-requirements/layout-reuse-evidence.json",
   "src/ui-catalog/extensions/composites/generated-manifest.json",
   "src/ui-catalog/contracts.lock.json","pi-catalog/props-json-schema.json"],
  limitation:"Observed primitive props and JSON children are NOT composite-level API or named Zod slots. Structural matches are not behavioral/visual equivalence; same-origin samples do not prove independent reuse.",
  summary:{candidateCount:proposals.length,
   independentOriginCount:proposals.filter(x=>x.evidenceLevel==="cross-origin-static-evidence").length,
   sameOriginCount:proposals.filter(x=>x.evidenceLevel!=="cross-origin-static-evidence").length,
   existingCompositeReviewCount:proposals.filter(x=>x.strategy==="review-existing-compositions-first").length,
   primitiveAssemblyCount:proposals.filter(x=>x.strategy==="compose-admitted-primitives").length},
  proposals:proposals.sort((a,b)=>sort(a.id,b.id))};
}
