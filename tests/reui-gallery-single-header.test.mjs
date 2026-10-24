import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const page=readFileSync("src/ui-runtime/app.tsx","utf8")
const gallery=readFileSync("src/ui-runtime/catalog-explorer.tsx","utf8")
const layout=readFileSync("src/ui-runtime/layout.tsx","utf8")
const search=readFileSync("src/ui-runtime/reui-search.ts","utf8")

test("Galeria 3 usa somente o título e o subtítulo do layout",()=>{
  assert.ok(page.includes("slug:'galeria-3',title:'Galeria 3',subtitle:'Exemplos ReUI agrupados por componente, com filtro e carregamento progressivo.'"))
  assert.ok(layout.includes("<h1"))
  assert.ok(layout.includes("{subtitle}"))
  assert.ok(!gallery.includes('Galeria 3 · ReUI'),"sem segundo título")
  assert.ok(!gallery.includes('<header className="space-y-1"><h2'),"sem segundo cabeçalho")
})

test("Galeria 3 filtra nos critérios específicos de cada exemplo",()=>{
  assert.ok(gallery.includes("filterReuiExamples("))
  assert.ok(gallery.includes("exampleGuides"))
  assert.ok(search.includes("guide?.bestFor"))
  assert.ok(search.includes("guide?.whenNotUse"))
  assert.ok(search.includes("toLocaleLowerCase"))
  assert.ok(search.includes('normalize("NFD")'))
  assert.ok(gallery.includes("setLimit(12)"))
})
