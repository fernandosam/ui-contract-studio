import {test,expect} from "@playwright/test"

test.describe("Admissão semântica ReUI",()=>{
 test("matriz de admissão aparece no explorador de composições",async({page})=>{
  await page.goto("/?screen=explorador-compostos&reui=c-accordion-11")
  await expect(page.getByTestId("reui-semantic-admission")).toContainText("OnboardingChecklist")
  await expect(page.getByTestId("reui-semantic-admission")).toContainText("Contrato semântico aprovado")
  await page.getByLabel("Filtrar classificação semântica").selectOption("approved-semantic")
  await expect(page.getByTestId("reui-composite-option-c-accordion-11")).toBeVisible()
  await expect(page.getByTestId("reui-composite-option-c-accordion-1")).toHaveCount(0)
 })

 test("contrato aprovado renderiza dados configuráveis no explorador",async({page})=>{
  await page.goto("/?screen=explorador-compostos")
  await page.getByRole("tab",{name:"Contratos aprovados"}).click()
  const search=page.getByLabel("Buscar componente")
  await search.fill("OnboardingChecklist")
  await page.getByRole("button",{name:"OnboardingChecklist",exact:true}).click()
  await expect(page.getByText("Criar conta")).toBeVisible()
  await expect(page.getByText("Configurar perfil")).toBeVisible()
  await expect(page.getByText("Ativar segurança")).toBeVisible()
 })
})
