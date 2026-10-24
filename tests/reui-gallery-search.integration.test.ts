import test from "node:test"
import assert from "node:assert/strict"
import guidance from "../src/ui-catalog/reui-example-guidance.pt-BR.json"
import groups from "../src/ui-catalog/reui-guidance.json"
import { filterReuiExamples, normalizeReuiSearch } from "../src/ui-runtime/reui-search"

test("normalização ignora acentuação, letras maiúsculas e espaços duplicados", () => {
  assert.equal(normalizeReuiSearch("  QUANDO   NÃO   USAR "), "quando nao usar")
  assert.equal(normalizeReuiSearch(" Expansão única "), "expansao unica")
})

const examples = [
  ["Expansão única", "c-accordion-1"],
  ["Ícones de mais e menos", "c-accordion-2"],
  ["Caixas individuais", "c-accordion-3"],
] as const
const sampleGuides = {
  "c-accordion-1": {bestFor: "Perguntas frequentes em uma seção",whenNotUse:["Não use para expansão múltipla com ícones"]},
  "c-accordion-2": {bestFor: "Várias respostas abertas simultaneamente",whenNotUse:["Evite para respostas exclusivas"]},
  "c-accordion-3": {bestFor: "Listas longas com cartões",whenNotUse:["Evitar conteúdo simples"]},
}

test("pesquisa pelo título, componente, ID, melhor para e quando não usar", () => {
  assert.deepEqual(filterReuiExamples(examples,"Accordion","EXPANSAO UNICA",sampleGuides).map(x=>x[1]),["c-accordion-1"])
  assert.deepEqual(filterReuiExamples(examples,"Accordion","c-accordion-2",sampleGuides).map(x=>x[1]),["c-accordion-2"])
  assert.deepEqual(filterReuiExamples(examples,"Accordion","Accordion",sampleGuides).length,3)
  assert.deepEqual(filterReuiExamples(examples,"Accordion","perguntas frequentes",sampleGuides).map(x=>x[1]),["c-accordion-1"])
  assert.deepEqual(filterReuiExamples(examples,"Accordion","NAO use",sampleGuides).map(x=>x[1]),["c-accordion-1"])
  assert.deepEqual(filterReuiExamples(examples,"Accordion","RESPOSTAS simultaneamente",sampleGuides).map(x=>x[1]),["c-accordion-2"])
  assert.deepEqual(filterReuiExamples(examples,"Accordion","  ",sampleGuides).length,3)
  assert.deepEqual(filterReuiExamples(examples,"Accordion","texto inexistente",sampleGuides),[])
})

test("termos de campos diferentes se combinam sem depender da ordem", () => {
  assert.deepEqual(filterReuiExamples(examples,"Accordion","perguntas MULTIPLA",sampleGuides).map(x=>x[1]),["c-accordion-1"])
  assert.deepEqual(filterReuiExamples(examples,"Accordion","MULTIPLA perguntas",sampleGuides).map(x=>x[1]),["c-accordion-1"])
})

test("pesquisa integra os critérios oficiais pt-BR dos exemplos da Galeria 3", () => {
  const accordion=groups.Accordion.examples as [string,string][]
  const guides=guidance as Record<string,{bestFor:string;whenNotUse:string[]}>
  assert.equal(Object.keys(guides).length,559)
  assert.ok(filterReuiExamples(accordion,"Accordion","PADRAO MINIMO",guides).some(x=>x[1]==="c-accordion-1"),"busca em melhor para")
  assert.ok(filterReuiExamples(accordion,"Accordion","VARIAS respostas",guides).some(x=>x[1]==="c-accordion-1"),"busca em quando não usar")
  assert.equal(filterReuiExamples(accordion,"Accordion","",guides).length,accordion.length)
})
