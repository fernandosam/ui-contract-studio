import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"

const catalog = JSON.parse(readFileSync("src/ui-catalog/reui-guidance.json", "utf8"))
const viewer = readFileSync("src/ui-catalog/extensions/composites/reui-source-viewer.tsx", "utf8")
const gallery = readFileSync("src/ui-runtime/catalog-explorer.tsx", "utf8")
const codeBlock = readFileSync("src/components/ui/code-block.tsx", "utf8")

test("ReUI: os 559 exemplos têm fonte local carregável apenas sob demanda", () => {
  let count = 0
  for (const [component, guide] of Object.entries(catalog)) {
    const slug = component.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
    for (const [, id] of guide.examples) {
      count++
      assert.match(id, /^c-[a-z0-9-]+-[1-9][0-9]*$/)
      assert.ok(existsSync("src/ui-catalog/extensions/composites/reui-" + slug + "-" + id.split("-").at(-1) + ".tsx"), id)
    }
  }
  assert.equal(count, 559)
  assert.ok(viewer.includes('import.meta.glob<string>("./reui-*.tsx"'))
  assert.ok(viewer.includes('query: "?raw"'))
  assert.ok(viewer.includes("const loader = sourceLoaders[path]"))
  assert.ok(viewer.includes("if (!match) return Promise.reject"))
  assert.ok(viewer.includes("if (!open || source !== null || failed) return"), "não carrega enquanto a gaveta está fechada")
})

test("ReUI: botão com ícone correto abre gaveta à direita, não painel embutido", () => {
  assert.ok(gallery.includes("<ReuiSourceViewer id={id}/>"))
  assert.ok(!gallery.includes("Ver código ↗"))
  assert.match(viewer, /<CodeXmlIcon\b[^>]*aria-hidden=/)
  assert.ok(viewer.includes("<Sheet open={open} onOpenChange={setOpen}>"))
  assert.ok(viewer.includes('<SheetContent side="right"'))
  assert.ok(viewer.includes("<SheetTrigger"))
  assert.ok(viewer.includes("<SheetClose"))
  assert.ok(viewer.includes('aria-label="Fechar código"'))
  assert.ok(viewer.includes("Tentar novamente"))
  assert.ok(viewer.includes("<CodeBlock code={source}"))
  assert.ok(!viewer.includes("<pre"), "renderização do código é responsabilidade do CodeBlock")
  assert.ok(!viewer.includes("aria-expanded={expanded}"), "estado modal pertence ao Sheet")
})

test("ReUI: botão compacto e gaveta ampla sem alterar Sheet global", () => {
  assert.match(viewer, /variant="outline" size="xs"/, "botão Ver código menor");
  assert.match(viewer, /<CodeXmlIcon className="size-3"/, "ícone acompanha tamanho do botão");
  assert.ok(viewer.includes('style={{ width: "min(100vw, 1200px)", maxWidth: "none" }}'),
    "largura da gaveta não fica limitada pelo max-w-sm padrão do Sheet");
  assert.match(viewer, /<SheetContent side="right"/, "gaveta permanece à direita");
})

test("Code Block: destaque TSX, linhas numeradas, arquivo, cópia sem HTML inseguro", () => {
  assert.ok(codeBlock.includes('data-slot="code-block"'))
  assert.ok(codeBlock.includes('data-slot="code-block-line"'))
  assert.ok(codeBlock.includes('data-slot="code-block-content"'))
  assert.ok(codeBlock.includes("tokenPattern"))
  assert.ok(codeBlock.includes("highlightLine(line)"))
  assert.ok(codeBlock.includes('data-testid="reui-copy-source"'))
  assert.ok(codeBlock.includes("navigator.clipboard.writeText(code)"))
  assert.ok(codeBlock.includes("Copiado!"))
  assert.ok(codeBlock.includes("aria-live="))
  assert.ok(!codeBlock.includes("dangerouslySetInnerHTML"))
})
