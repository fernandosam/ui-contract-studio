import test from "node:test"
import assert from "node:assert/strict"
import {readFileSync} from "node:fs"

const read = path => readFileSync(path,"utf8")
const official = JSON.parse(read("pi-catalog/contracts.json"))

test("E11: all official contract samples resolve through allowlisted build-time JSON patterns",()=>{
 assert.ok(official.components.length>0)
 assert.ok(official.components.every(entry=>/^pi-catalog\/(examples|experimental-examples)\/[^/]+\.json$/.test(entry.example)))
 const explorer=read("src/ui-runtime/catalog-explorer.tsx")
 const admission=read("src/ui-runtime/admission-explorer.tsx")
 assert.match(explorer,/const exampleLoaders = import\.meta\.glob<UiSpec>/)
 assert.match(admission,/const exampleLoaders=import\.meta\.glob<unknown>/)
 assert.ok(explorer.includes("samples[entry.type]"))
 assert.ok(admission.includes('current.example'))
 assert.ok(explorer.includes("exampleCache.set(selectedType,value)"))
 assert.ok(admission.includes("exampleCache.set(samplePath,spec)"))
 assert.ok(!explorer.includes("const examples = import.meta.glob("))
 assert.ok(!admission.includes("stableExamples=import.meta.glob("))
 assert.ok(!admission.includes("experimentalExamples=import.meta.glob("))
})

test("E11: JSON patterns are loaded only for active selection, with cancelation and status",()=>{
 const explorer=read("src/ui-runtime/catalog-explorer.tsx")
 assert.match(explorer,/const patternFiles = import\.meta\.glob<UiSpec>/)
 assert.ok(!/import\.meta\.glob\('\.\.\/ui-patterns\/\*\.json',\s*\{\s*eager:\s*true/.test(explorer))
 assert.ok(explorer.includes("patternCache.set(selectedSource,spec)"))
 assert.ok(explorer.includes("if(!active)return"))
 assert.ok(explorer.includes("Carregando padrão"))
 assert.ok(explorer.includes("Carregando exemplo aprovado"))
 assert.ok(explorer.includes("const screenOptions=Object.values(screens)"))
})

test("E11: semantic indexes cannot change Pi admissions",()=>{
 const discovery=read("src/ui-runtime/catalog-discovery.ts")
 const reui=read("src/ui-runtime/reui-search.ts")
 assert.ok(discovery.includes("buildDiscoveryIndex"))
 assert.ok(reui.includes("buildReuiExampleIndex"))
 assert.ok(!/\b(fetch|eval|new Function)\s*\(/.test(discovery+reui))
})
