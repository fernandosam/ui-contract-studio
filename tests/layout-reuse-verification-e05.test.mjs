import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {buildLayoutReuse,readLayoutPatterns} from "../scripts/lib/layout-reuse.mjs";
import {compareLayoutReuseWithCatalog} from "../scripts/lib/layout-reuse-comparison.mjs";
import {buildLayoutCompositionProposals} from "../scripts/lib/layout-composition-proposals.mjs";
import {auditE05Reuse} from "../scripts/lib/layout-reuse-verification.mjs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const lock=read("src/ui-catalog/contracts.lock.json");
const evidence=read("src/ui-requirements/layout-reuse-evidence.json");
const comparison=compareLayoutReuseWithCatalog(evidence,lock,
 read("src/ui-catalog/extensions/composites/generated-manifest.json"),read);
const proposals=buildLayoutCompositionProposals(comparison,evidence,lock,
 read("pi-catalog/props-json-schema.json"),read);
const allowedTypes=lock.components.filter(x=>x.status==="approved").map(x=>x.name);
const inputs=()=>({evidence:structuredClone(evidence),
 comparison:structuredClone(comparison),proposals:structuredClone(proposals),
 allowedTypes,read});
const audit=(overrides={})=>auditE05Reuse({...inputs(),...overrides});

test("E05: all 5 candidates and each of 16 JSON occurrences retain exact traceability",()=>{
 const actual=audit();
 assert.equal(actual.schemaVersion,1);
 assert.equal(actual.status,"traceability-verified-functional-equivalence-not-certified");
 assert.deepEqual(actual.summary,{candidateCount:5,traceableOccurrences:16,
  functionalEquivalencesCertified:0,independentOriginCandidates:3});
 assert.equal(new Set(actual.candidates.map(x=>x.proposalId)).size,5);
 for(const c of actual.candidates){
  assert.equal(c.traceability,"verified-against-approved-json-and-metadata");
  assert.equal(c.functionalEquivalence,"not-established-no-executable-composite-or-browser-proof");
  assert.equal(c.canReplaceExistingComponent,false);
  assert.equal(c.canPublish,false);
  assert.equal(c.canGrantPiPermissions,false);
  for(const row of c.occurrences){
   const spec=read(row.path),meta=read(row.metadataPath);
   const children=row.relation==="children"?spec.elements[row.parentId].children:
    spec.elements[row.parentId].slots[row.relation.slice(6)];
   assert.equal(meta.originScreen,row.originScreen);
   assert.equal(children[row.index],row.childId);
   assert.match(row.sourceFingerprint,/^[0-9a-f]{64}$/);
   assert.match(row.edgeFingerprint,/^[0-9a-f]{64}$/);
   assert.match(row.propsFingerprint,/^[0-9a-f]{64}$/);
  }
 }
 assert.deepEqual(actual,audit());
});

test("E05: evidence can be recomputed, including origin independence, without promotion",()=>{
 const fresh=buildLayoutReuse(readLayoutPatterns(),lock.components.map(x=>x.name));
 assert.deepEqual(fresh,evidence);
 const rows=audit().candidates;
 assert.equal(rows.filter(x=>x.evidenceLevel==="same-origin-candidate").length,2);
 assert.ok(rows.filter(x=>x.evidenceLevel==="same-origin-candidate")
  .every(x=>new Set(x.occurrences.map(y=>y.originScreen)).size===1));
 assert.ok(rows.filter(x=>x.evidenceLevel==="cross-origin-static-evidence")
  .every(x=>new Set(x.occurrences.map(y=>y.originScreen)).size>=2));
});

test("E05: same edge type in different screens cannot prove functional equivalence",()=>{
 const candidate=audit().candidates.find(x=>x.structureId==='["children","Card","Stack"]');
 assert.ok(candidate);
 const differentOrigins=new Map();
 for(const row of candidate.occurrences){
  if(!differentOrigins.has(row.originScreen))
   differentOrigins.set(row.originScreen,row);
 }
 assert.equal(differentOrigins.size,2);
 assert.notEqual(...[...differentOrigins.values()].map(x=>x.edgeFingerprint));
 assert.equal(candidate.canReplaceExistingComponent,false);
 assert.equal(audit().summary.functionalEquivalencesCertified,0);
});

test("E05: regressions to props, state and nested actions are observable",()=>{
 const baseline=audit();
 const source="src/ui-patterns/form-dialog.json";
 const changed=(transform)=>audit({read:path=>{
  const value=read(path);
  if(path===source)transform(value);
  return value;
 }});
 const changedProps=changed(spec=>{spec.elements.actions.props.title="E05 renamed card";});
 const previous=baseline.candidates.find(x=>x.structureId==='["children","Card","Stack"]')
  .occurrences.find(x=>x.layoutId==="form-dialog");
 const afterProps=changedProps.candidates.find(x=>x.structureId==='["children","Card","Stack"]')
  .occurrences.find(x=>x.layoutId==="form-dialog");
 assert.notEqual(afterProps.propsFingerprint,previous.propsFingerprint);
 assert.notEqual(afterProps.sourceFingerprint,previous.sourceFingerprint);
 const changedState=changed(spec=>{spec.state.dialogOpen=!spec.state.dialogOpen;});
 const afterState=changedState.candidates.find(x=>x.structureId==='["children","Card","Stack"]')
  .occurrences.find(x=>x.layoutId==="form-dialog");
 assert.notEqual(afterState.edgeFingerprint,previous.edgeFingerprint);
 assert.notEqual(afterState.sourceFingerprint,previous.sourceFingerprint);
 const changedNested=changed(spec=>{spec.elements.action_link.props.label="Changed action";});
 const afterNested=changedNested.candidates.find(x=>x.structureId==='["children","Card","Stack"]')
  .occurrences.find(x=>x.layoutId==="form-dialog");
 assert.notEqual(afterNested.sourceFingerprint,previous.sourceFingerprint);
 assert.equal(changedNested.summary.functionalEquivalencesCertified,0);
});

test("E05: reordered children and changed edges fail, even if node types still exist",()=>{
 const changed=path=>{
  const spec=read(path);
  if(path==="src/ui-patterns/detail-view.json"){
   spec.elements["info-card"].children=["link-catalog"];
  }
  return spec;
 };
 assert.throws(()=>audit({read:changed}),/source edge\/order drift|invalid source graph/);
 const wrong=inputs();
 wrong.proposals.proposals[0].evidence.reverse();
 assert.throws(()=>audit(wrong),/provenance mismatch/);
});

test("E05: metadata forgery, unrelated origin and incomplete evidence fail closed",()=>{
 assert.throws(()=>audit({read:path=>{
  const val=read(path);
  if(path==="src/ui-patterns/detail-view.meta.json")val.approved=false;
  return val;
 }}),/approval\/origin metadata mismatch/);
 const changed=inputs();
 changed.evidence.recurrentStructures[0].originScreens=["playground"];
 assert.throws(()=>audit(changed),/origin\/count drift/);
 const missing=inputs();
 missing.proposals.proposals.pop();
 assert.throws(()=>audit(missing),/missing\/extra candidates/);
 const duplicated=inputs();
 duplicated.evidence.sameOriginCandidates.push(duplicated.evidence.sameOriginCandidates[0]);
 assert.throws(()=>audit(duplicated),/duplicate\/invalid IDs/);
});

test("E05: composite references and forbidden API claims are never accepted",()=>{
 const unauthorized=inputs();
 unauthorized.proposals.proposals[0].permissionImpact="grant";
 assert.throws(()=>audit(unauthorized),/unauthorized equivalence\/admission/);
 const fakeEquivalent=inputs();
 fakeEquivalent.comparison.comparisons[0].reuseIsProven=true;
 assert.throws(()=>audit(fakeEquivalent),/unauthorized equivalence\/admission/);
 const stale=inputs();
 const p=stale.proposals.proposals.find(x=>x.dependencies.inspectExistingCompositions.length>0);
 p.dependencies.inspectExistingCompositions[0].structuralOccurrences++;
 assert.throws(()=>audit(stale),/composite reference mismatch/);
});

test("E05: CLI is deterministic, read-only and refuses --publish",()=>{
 const run=arg=>spawnSync(process.execPath,["scripts/verify-layout-reuse.mjs",arg],{encoding:"utf8"});
 const first=run("--check"),second=run("--check");
 assert.equal(first.status,0,first.stderr);
 assert.equal(second.status,0,second.stderr);
 assert.equal(first.stdout,second.stdout);
 assert.match(first.stdout,/0 runtime equivalences certified/);
 assert.notEqual(run("--publish").status,0);
});
