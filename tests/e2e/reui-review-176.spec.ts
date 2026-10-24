import {test,expect} from "@playwright/test"

test.describe("Revisão semântica de 176 exemplos ReUI",()=>{
 test("explorador separa aprovação, lacunas e candidatos adiados",async({page})=>{
  await page.goto("/?screen=explorador-compostos&reui=c-rating-6")
  await expect(page.getByTestId("reui-semantic-admission")).toContainText("RatingDistribution")
  await page.getByLabel("Filtrar classificação semântica").selectOption("approved-semantic")
  await expect(page.getByTestId("reui-composite-option-c-rating-6")).toBeVisible()
  await page.getByLabel("Filtrar classificação semântica").selectOption("deferred-semantic")
  await expect(page.getByTestId("reui-semantic-admission")).toContainText("não admitido")
 })

 test("novo contrato RatingDistribution aparece com contagens dinâmicas",async({page})=>{
  await page.goto("/?screen=explorador-compostos")
  await page.getByLabel("Buscar componente").fill("RatingDistribution")
  await page.getByRole("button",{name:"RatingDistribution",exact:true}).click()
  await expect(page.locator('[data-composite="RatingDistribution"]')).toBeVisible()
  await expect(page.getByText("200 avaliações")).toBeVisible()
 })

 test("novo campo com contador respeita o limite",async({page})=>{
  await page.goto("/?screen=explorador-compostos")
  await page.getByLabel("Buscar componente").fill("CharacterCountTextarea")
  await page.getByRole("button",{name:"CharacterCountTextarea",exact:true}).click()
  const area=page.locator('[data-composite="CharacterCountTextarea"] textarea')
  await expect(area).toBeVisible()
  await area.fill("Teste de contagem")
  await expect(page.locator('[data-composite="CharacterCountTextarea"]')).toContainText("17/280")
 })
})
