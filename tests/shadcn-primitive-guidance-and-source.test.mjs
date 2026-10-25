import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"

const read = file => JSON.parse(readFileSync(file, "utf8"))
const guidance = read("src/ui-catalog/primitive-guidance.pt-BR.json")
const official = read("src/ui-catalog/shadcn-guidance.json")
const lock = read("src/ui-catalog/contracts.lock.json")
const baseNames = lock.components.filter(item => item.tier === "base").map(item => item.name)
const extensions = ["Field","AspectRatio","Kbd","Empty","ScrollArea","AlertDialog","Attachment","Bubble","ContextMenu","HoverCard","Item","Marker","Message"]

test("as 54 primitivas do explorador possuem orientações de agentes em português", () => {
  assert.equal(guidance.language,"pt-BR")
  assert.equal(baseNames.length,41)
  assert.equal(new Set([...baseNames,...extensions]).size,54)
  for(const name of [...baseNames,...extensions]){
    const entry = guidance[name] ?? official[name]
    assert.ok(entry,"Faltam orientações em português: "+name)
    for(const field of ["whenUse","whenNotUse","agentNotes"]){
      assert.ok(Array.isArray(entry[field]) && entry[field].length>=2,name+"."+field)
      for(const item of entry[field]){
        assert.ok(item.length>15 && item.length<400,name+"."+field+" conteúdo inválido")
      }
    }
  }
  assert.deepEqual(
    Object.keys(guidance).filter(name => name!=="language").sort(),
    [...baseNames,"Field"].sort(),
    "Traduções devem acompanhar os contratos efetivamente exibidos"
  )
})
test("a interface usa orientação pt-BR e preserva documentação de origem",()=>{
  const explorer=readFileSync("src/ui-runtime/catalog-explorer.tsx","utf8")
  assert.match(explorer,/localizedPrimitiveDocs\[type\] \?\? shadcnDocs\[type\]/)
  assert.match(explorer,/lang="pt-BR"/)
  assert.ok(explorer.includes("const referenceUrl=officialUrl ?? (reuiDocs[type]?"))
  assert.ok(explorer.includes("<PrimitiveSourceViewer key={type} type={type} example={spec}/>"))
})
test("botão Ver código abre Sheet com mesmo CodeBlock dos exemplos ReUI",()=>{
  const viewer=readFileSync("src/ui-catalog/extensions/composites/primitive-source-viewer.tsx","utf8")
  assert.match(viewer,/import\.meta\.glob<string>\("\.\.\/\.\.\/\.\.\/components\/ui\/\*\.tsx"/)
  assert.match(viewer,/query: "\?raw"/)
  assert.match(viewer,/!open \|\| tab !== "tsx"/)
  assert.ok(viewer.includes('<SheetContent side="right"'))
  assert.ok(viewer.includes('style={{ width: "min(100vw, 1200px)", maxWidth: "none" }}'))
  assert.ok(viewer.includes('size="xs"'))
  assert.ok(viewer.includes("Ver código"))
  assert.ok(viewer.includes('aria-label="Fechar código"'))
  assert.ok(viewer.includes("Tentar novamente"))
  assert.ok(viewer.includes("Componente TSX"))
  assert.ok(viewer.includes("Exemplo JSON"))
  assert.ok(viewer.includes("<CodeBlock code={source}"))
  assert.ok(viewer.includes("<CodeBlock code={json}"))
  assert.ok(!viewer.includes("dangerouslySetInnerHTML"))
  assert.ok(existsSync("src/components/ui/code-block.tsx"))
})
