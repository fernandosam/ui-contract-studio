import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import {
  reuiCompositeCatalog,
  reuiCompositeById,
  reuiCompositePropsSchema,
} from "../src/ui-catalog/extensions/composites/reui-composite-definitions"

type FamilyGuide = { examples: [string, string][]; whenUse: string[]; whenNotUse: string[]; agentNotes: string[] }
type ExampleGuide = { bestFor: string; whenNotUse: string[]; sourceUrl: string; language: string }
const families = JSON.parse(readFileSync("src/ui-catalog/reui-guidance.json", "utf8")) as Record<string, FamilyGuide>
const examples = JSON.parse(readFileSync("src/ui-catalog/reui-example-guidance.pt-BR.json", "utf8")) as Record<string, ExampleGuide>
const approved = JSON.parse(readFileSync("src/ui-catalog/contracts.lock.json", "utf8")) as { components: { name: string }[] }

test("Cada um dos 559 exemplos ReUI tem identidade de componente único, arquivo e proveniência", () => {
  assert.equal(Object.keys(families).length, 31)
  assert.equal(reuiCompositeCatalog.length, 559)
  assert.equal(Object.keys(reuiCompositeById).length, 559)
  const identifiers = new Set<string>()
  const names = new Set<string>()
  const originalCatalogTypes = new Set(approved.components.map(item => item.name))
  for (const entry of reuiCompositeCatalog) {
    assert.match(entry.id, /^c-[a-z0-9-]+-\d+$/)
    assert.match(entry.name, /^Reui[A-Z][A-Za-z0-9]+$/)
    assert.ok(!identifiers.has(entry.id), "duplicate id: " + entry.id)
    assert.ok(!names.has(entry.name), "duplicate component: " + entry.name)
    assert.ok(!originalCatalogTypes.has(entry.name), "reused approved name: " + entry.name)
    identifiers.add(entry.id)
    names.add(entry.name)
    assert.equal(entry.status, "react-composite")
    assert.deepEqual(entry.exampleProps, {})
    assert.ok(existsSync(entry.sourcePath), entry.sourcePath)
    assert.equal(reuiCompositeById[entry.id], entry)
    assert.equal(entry.sourceUrl, examples[entry.id]?.sourceUrl)
    assert.ok(entry.sourceUrl.startsWith("https://reui.io/"), entry.id)
  }
  assert.equal(identifiers.size, 559)
  assert.equal(names.size, 559)
})

test("Informações apresentadas na Galeria 3 tornam-se metadados de exemplo e notas do composto", () => {
  for (const entry of reuiCompositeCatalog) {
    const family = families[entry.kind]
    const original = family.examples.find(([, id]) => id === entry.id)
    const guide = examples[entry.id]
    assert.ok(original, entry.id)
    assert.ok(guide, entry.id)
    assert.equal(entry.title, original[0])
    assert.equal(entry.bestFor, guide.bestFor)
    assert.deepEqual(entry.whenNotUse, guide.whenNotUse)
    assert.deepEqual(entry.whenUse, family.whenUse)
    assert.deepEqual(entry.familyWhenNotUse, family.whenNotUse)
    assert.deepEqual(entry.agentNotes, family.agentNotes)
    assert.equal(guide.language, "pt-BR")
    assert.ok(entry.bestFor.length > 0)
    assert.ok(entry.whenNotUse.length > 0)
  }
})

test("API do componente composto ReUI rejeita JSX, className, estilos e callbacks arbitrários", () => {
  assert.equal(reuiCompositePropsSchema.safeParse({}).success, true)
  assert.equal(reuiCompositePropsSchema.safeParse({ width: "sm", align: "start" }).success, true)
  assert.equal(reuiCompositePropsSchema.safeParse({ width: "xl" }).success, false)
  assert.equal(reuiCompositePropsSchema.safeParse({ className: "bg-red-500" }).success, false)
  assert.equal(reuiCompositePropsSchema.safeParse({ children: "<script/>" }).success, false)
  assert.equal(reuiCompositePropsSchema.safeParse({ html: "<b>unsafe</b>" }).success, false)
  assert.equal(reuiCompositePropsSchema.safeParse({ onClick: "javascript:..." }).success, false)
  assert.equal(reuiCompositePropsSchema.safeParse({ align: "top" }).success, false)
})

test("React implementa os 559 compostos sem contornar o catálogo de 156 contratos aprovados", () => {
  const code=readFileSync("src/ui-catalog/extensions/composites/reui-composite-catalog.tsx","utf8")
  const explorer=readFileSync("src/ui-runtime/reui-composite-explorer.tsx","utf8")
  const shell=readFileSync("src/ui-runtime/catalog-explorer.tsx","utf8")
  assert.match(code,/reuiCompositeCatalog\.map\(descriptor => \[descriptor\.name, createReuiComposite\(descriptor\)\]\)/)
  assert.match(code,/Composite\.displayName = descriptor\.name/)
  assert.match(code,/<ReuiPattern kind=\{descriptor\.kind\} id=\{descriptor\.id\}/)
  assert.match(code,/safeParse\(props\)/)
  assert.match(explorer,/<ReuiComposite key=\{selected\.id\} id=\{selected\.id\}/)
  assert.match(explorer,/Melhor para/)
  assert.match(explorer,/Quando não usar/)
  assert.match(explorer,/Notas do agente/)
  assert.match(shell,/Composições ReUI \(559\)/)
  assert.match(shell,/Abrir componente composto/)
  assert.equal(approved.components.length,156,"A admissão de novos contratos Pi não pode ser automática")
})
