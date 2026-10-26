import test from "node:test"
import assert from "node:assert/strict"
import {readFileSync} from "node:fs"
import {signatures} from "../scripts/lib/contract-lock.mjs"

const read = path => JSON.parse(readFileSync(path,"utf8"))
const matrix=read("src/ui-catalog/reui-semantic-admissions.json")
const lock=read("src/ui-catalog/contracts.lock.json")
const guides=read("src/ui-catalog/reui-example-guidance.pt-BR.json")
const semantics=read("src/ui-catalog/semantic-contract-guidance.json").contracts

test("176 pendentes foram avaliados; nenhum permanece com aprovação implícita",()=>{
 assert.equal(matrix.entries.length,559)
 const oldPending=new Set([...Array.from({length:57},(_,i)=>"c-button-group-"+(i+1))])
 const categories=matrix.entries.reduce((o,x)=>(o[x.classification]=(o[x.classification]??0)+1,o),{})
 assert.deepEqual(categories,{"existing-primitive-variant":511,"existing-composition":22,"existing-contract-gap":15,"deferred-semantic":8,"approved-semantic":3})
 assert.equal(matrix.entries.filter(e=>e.reviewStatus==="pending").length,0)
 assert.equal(matrix.entries.filter(e=>e.reviewStatus==="approved").length,3)
 assert.equal(matrix.entries.filter(e=>e.reviewStatus==="reviewed").length,23)
 assert.equal(matrix.entries.filter(e=>e.reviewStatus==="reused").length,533)
 for(const e of matrix.entries){
  assert.ok(e.reason.length>20,e.exampleId)
  assert.ok(e.contractName||e.classification==="review-required",e.exampleId)
  assert.ok(guides[e.exampleId]?.bestFor,e.exampleId)
  if(e.reviewedOn){
   assert.equal(e.reviewedOn,"2026-10-24")
   assert.equal(e.exampleUseCase,guides[e.exampleId].bestFor)
   assert.ok(["guidance-and-source","guidance-and-contract"].includes(e.reviewBasis))
  }
  if(e.reviewStatus==="approved"){
   assert.equal(e.classification,"approved-semantic")
   assert.ok(lock.components.some(c=>c.name===e.contractName&&c.status==="approved"))
   assert.ok(semantics[e.contractName]?.referenceExamples.includes(e.exampleId))
  }
 }
 assert.ok(oldPending.has("c-button-group-57"))
 assert.equal(lock.components.length,102)
 assert.deepEqual(
   matrix.entries.filter(e=>e.reviewStatus==="approved").map(e=>e.exampleId).sort(),
   ["c-accordion-11","c-rating-6","c-textarea-6"]
 )
})

test("Novos contratos são tipados, rastreados e com fingerprints consistentes",()=>{
 const list=signatures()
 for(const name of ["RatingDistribution","CharacterCountTextarea"]){
  const item=lock.components.find(e=>e.name===name)
  const sig=list.find(e=>e.name===name)
  assert.ok(item && sig)
  assert.equal(item.semanticFingerprint,sig.semanticFingerprint)
  assert.equal(item.version,"1.0.0")
  assert.equal(item.tier,"extension")
  const contract=read("pi-catalog/contracts.json").components.find(e=>e.type===name)
  assert.equal(contract.hasSemanticAPI,true)
  assert.deepEqual(contract.semanticGuidance,semantics[name])
  assert.equal(read(contract.example).elements[read(contract.example).root].type,name)
 }
})
