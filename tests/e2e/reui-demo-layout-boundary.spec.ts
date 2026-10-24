import { test, expect } from "@playwright/test"

test.describe("ReUI — estilos de demonstração fora dos componentes",()=>{
  test("Galeria 3 preserva centralização e largura de Accordion, mas o fonte não inclui o wrapper",async({page})=>{
    await page.goto("/?screen=galeria-3")
    await page.getByLabel("Filtrar componente").selectOption("Accordion")
    const demo=page.getByTestId("reui-preview-c-accordion-1")
    await expect(demo.locator('[data-reui-accordion-example="1"]')).toHaveClass(/max-w-lg/)
    await expect(demo.locator('[data-reui-accordion-example="1"] [data-slot="accordion"]')).toBeVisible()
    await page.getByTestId("reui-code-toggle-c-accordion-1").click()
    const source=page.getByTestId("reui-source-panel-c-accordion-1").getByTestId("reui-code-block")
    await expect(source).toContainText("Accordion multiple")
    await expect(source).not.toContainText("mx-auto mb-auto w-full max-w-lg")
  })

  test("Composto Accordion controla a largura sem herdar a embalagem da Galeria",async({page})=>{
    await page.goto("/?screen=explorador-compostos&reui=c-accordion-1")
    const preview=page.getByTestId("reui-composite-preview-c-accordion-1")
    const composite=preview.locator('[data-composite="ReuiAccordion01"]')
    await expect(composite).toBeVisible()
    await expect(composite.locator('[data-reui-accordion-example]')).toHaveCount(0)
    await page.getByLabel("Largura da composição ReUI").selectOption("lg")
    await expect(composite.locator(":scope > div")).toHaveClass(/max-w-3xl/)
    await expect(composite.locator('[data-slot="accordion"]')).toBeVisible()
  })

  test("Exemplo Alert 12 mantém Frame e não inclui div de demonstração no código-fonte",async({page})=>{
    await page.goto("/?screen=galeria-3")
    await page.getByLabel("Filtrar componente").selectOption("Alert")
    await page.getByLabel("Pesquisar exemplos").fill("c-alert-12")
    const demo=page.getByTestId("reui-preview-c-alert-12")
    await expect(demo).toBeVisible()
    await expect(demo.locator('[data-reui-example="c-alert-12"]')).toHaveClass(/max-w-lg/)
    await page.getByTestId("reui-code-toggle-c-alert-12").click()
    const source=page.getByTestId("reui-source-panel-c-alert-12").getByTestId("reui-code-block")
    await expect(source).toContainText("<Frame>")
    await expect(source).not.toContainText("mx-auto mb-auto w-full max-w-lg")
  })
})
