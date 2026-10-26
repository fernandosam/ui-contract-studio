import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const read = path => JSON.parse(readFileSync(path,"utf8"))
const matrix = read("src/ui-catalog/reui-semantic-admissions.json")
const guidance = read("src/ui-catalog/reui-guidance.json")
const contract = read("src/ui-catalog/contracts.lock.json")
const agentGuidance = read("src/ui-catalog/semantic-contract-guidance.json")
const pi = read("pi-catalog/contracts.json")

test("Todos os 559 exemplos recebem classificação individual conservadora e rastreável",()=>{
 const original=Object.values(guidance).flatMap(group=>group.examples.map(([,id])=>id))
 assert.equal(matrix.schemaVersion,2)
 assert.equal(matrix.entries.length,559)
 assert.deepEqual(new Set(matrix.entries.map(e=>e.exampleId)),new Set(original))
 assert.equal(new Set(matrix.entries.map(e=>e.exampleId)).size,559)
 const approved=matrix.entries.filter(e=>e.reviewStatus==="approved")
 assert.deepEqual(approved.map(e=>e.exampleId).sort(),["c-accordion-11","c-rating-6","c-textarea-6"])
 assert.deepEqual(approved.map(e=>e.contractName).sort(),["CharacterCountTextarea","OnboardingChecklist","RatingDistribution"])
 for(const e of matrix.entries){
   assert.ok(e.reason.length>20,e.exampleId)
   assert.ok(["existing-primitive-variant","existing-composition","existing-contract-gap","deferred-semantic","approved-semantic"].includes(e.classification))
   if(e.classification==="existing-contract-gap"||e.classification==="deferred-semantic")assert.equal(e.reviewStatus,"reviewed")
   if(e.classification==="existing-primitive-variant") {
     assert.equal(e.reviewStatus,"reused")
     assert.ok(contract.components.some(c=>c.name===e.contractName&&c.status==="approved"))
   }
 }
})

test("Contrato aprovado possui provenance, versão, fingerprint, schema e exemplo para Pi",()=>{
 const item=contract.components.find(c=>c.name==="OnboardingChecklist")
 assert.ok(item)
 assert.equal(item.version,"1.0.0")
 assert.equal(item.tier,"extension")
 assert.equal(item.status,"approved")
 assert.match(item.semanticFingerprint,/^[a-f0-9]{64}$/)
 const api=pi.components.find(c=>c.type==="OnboardingChecklist")
 assert.ok(api)
 assert.equal(api.hasSemanticAPI,true)
 assert.equal(api.capability,"local-interactive")
 assert.deepEqual(api.semanticGuidance,agentGuidance.contracts.OnboardingChecklist)
 assert.deepEqual(api.semanticGuidance.referenceExamples,["c-accordion-11"])
 const spec=read(api.example)
 assert.equal(spec.elements[spec.root].type,"OnboardingChecklist")
 assert.equal(spec.elements[spec.root].props.steps.length,3)
 assert.deepEqual(spec.elements[spec.root].children,[])
 assert.equal(contract.components.length,102)
})

test("Contrato não aceita código arbitrário nem depende de textos fixos do exemplo",()=>{
 const src=readFileSync("src/ui-catalog/extensions/components/onboarding-checklist.tsx","utf8")
 const catalog=readFileSync("src/ui-catalog/extensions/catalog.ts","utf8")
 const explorer=readFileSync("src/ui-runtime/reui-composite-explorer.tsx","utf8")
 assert.match(src,/props\.steps\.map/)
 assert.match(src,/defaultValue=/)
 assert.match(src,/data-composite="OnboardingChecklist"/)
 assert.match(catalog,/OnboardingChecklist: \{/)
 assert.match(catalog,/superRefine/)
 assert.ok(!src.includes("james@alignui.com"))
 assert.ok(!src.includes("dangerouslySetInnerHTML"))
 assert.match(explorer,/Filtrar classificação semântica/)
 assert.match(explorer,/reui-semantic-admission/)
})
