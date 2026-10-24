import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const root="src/ui-catalog/extensions/composites"
const preview=readFileSync(root+"/reui-preview.tsx","utf8")
const registry=readFileSync(root+"/reui-composite-catalog.tsx","utf8")
const demoLayout="mx-auto mb-auto w-full max-w-lg"

test("20 exemplos Accordion e Alert removem o contêiner exclusivo de demonstração",()=>{
 const examples=[
  ...Array.from({length:11},(_,i)=>({family:"accordion",index:i+1})),
  ...Array.from({length:9},(_,i)=>({family:"alert",index:i+12})),
 ]
 for(const {family,index} of examples){
  const source=readFileSync(root+"/reui-"+family+"-"+index+".tsx","utf8")
  assert.ok(!source.includes(demoLayout),family+"-"+index+": margens e largura pertencem ao exemplo, não ao componente")
  assert.match(source,/return \(\s*<(Accordion|Card|Frame)\b/,family+"-"+index+": componente preserva raiz sem wrapper")
  assert.ok(!source.includes("dangerouslySetInnerHTML"))
 }
})

test("Renderizador de exemplos mantém o estilo original separado do componente puro",()=>{
 assert.ok(preview.includes("export function ReuiPattern("))
 assert.ok(preview.includes("export function ReuiPreview("))
 assert.ok(preview.includes('className="'+demoLayout+'" data-reui-accordion-example'))
 assert.ok(preview.includes('className="'+demoLayout+'" data-reui-example={id}'))
 assert.ok(preview.includes("kind==='Alert' && index>=12 && index<=20"))
 assert.match(preview,/data-reui-accordion-example=\{index\}/)
 assert.match(preview,/data-reui-example=\{id\}/)
 assert.match(preview,/return Pattern \? <Suspense/)
 assert.match(registry,/import \{ ReuiPattern \} from "\.\/reui-preview"/)
 assert.match(registry,/<ReuiPattern kind=\{descriptor\.kind\} id=\{descriptor\.id\}/)
 assert.ok(!registry.includes("ReuiPreview"),"componentes reutilizáveis não herdam o wrapper de demonstração")
})
