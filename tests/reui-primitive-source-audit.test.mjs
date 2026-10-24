import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"

const read = path => JSON.parse(readFileSync(path,"utf8"))
const baseline=read("src/ui-catalog/reui-primitive-source-baseline.json")
const guides=read("src/ui-catalog/reui-guidance.json")
const cases=read("src/ui-catalog/reui-example-guidance.pt-BR.json")
const locked=new Set(read("src/ui-catalog/contracts.lock.json").components.map(x=>x.name))

test("inventário cobre exatamente 559 exemplos em 31 famílias com origem rastreável",()=>{
 const declared=Object.entries(guides).flatMap(([family,data])=>data.examples.map(([,id])=>({family,id})))
 assert.equal(declared.length,559)
 assert.equal(Object.keys(guides).length,31)
 assert.equal(baseline.entries.length,559)
 assert.equal(new Set(baseline.entries.map(x=>x.exampleId)).size,559)
 assert.deepEqual(
   new Set(baseline.entries.map(x=>x.exampleId)),
   new Set(declared.map(x=>x.id))
 )
 for(const entry of baseline.entries){
   assert.ok(entry.sourcePath.endsWith(".tsx"),entry.exampleId)
   assert.match(entry.sourceBlobSha,/^[a-f0-9]{40}$/)
   assert.equal(entry.guideUrl,cases[entry.exampleId]?.sourceUrl)
   assert.ok(locked.has(entry.relatedContract),entry.exampleId)
   assert.ok(entry.caseDescription.length>10,entry.exampleId)
 }
})

test("código-fonte dos 559 padrões e contratos é inspecionado, sem falsificar teste visual",()=>{
 const run=spawnSync(process.execPath,["scripts/audit-reui-primitives.mjs","--check"],{encoding:"utf8"})
 assert.equal(run.status,0,(run.stderr||run.stdout).slice(0,3500))
 assert.match(run.stdout,/559 examples \/ 31 families/)
 const auditor=readFileSync("scripts/audit-reui-primitives.mjs","utf8")
 assert.match(auditor,/readFileSync\(path,"utf8"\)/)
 assert.match(auditor,/sourceBlobSha !== gitBlobSha\(code\)/)
 assert.match(auditor,/visualParity:"not-tested"/)
 assert.match(auditor,/keyboardParity:"not-tested"/)
 assert.match(auditor,/approved-composition-candidate/)
 assert.match(auditor,/contract-capability-gap/)
})

test("cobertura semântica não promove exemplos nem modifica contratos de base",()=>{
 const source=readFileSync("scripts/audit-reui-primitives.mjs","utf8")
 const versions=read("src/ui-catalog/contracts.lock.json")
 assert.equal(versions.components.length,102)
 assert.ok(!source.includes("approve-reviewed-change"))
 assert.ok(!source.includes("extensionDefinitions = {"))
 assert.ok(!source.includes("github.com/fernandosam"))
})
