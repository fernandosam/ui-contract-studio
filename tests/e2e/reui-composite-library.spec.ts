import { test, expect } from "@playwright/test"

/** Testes da biblioteca React ReUI — execução na suíte E2E manual da main. */
test.describe("Explorador de composições ReUI (559)", () => {
  test("mantém os componentes aprovados e oferece biblioteca ReUI separada", async ({page}) => {
    await page.goto("/?screen=explorador-compostos")
    await expect(page.getByRole("tab", {name:"Contratos aprovados"})).toHaveAttribute("aria-selected","true")
    await page.getByRole("tab", {name:"Composições ReUI (559)"}).click()
    await expect(page.getByRole("tab", {name:"Composições ReUI (559)"})).toHaveAttribute("aria-selected","true")
    await expect(page.getByText("559 componentes React identificados e reutilizáveis", {exact:false})).toBeVisible()
    await expect(page.getByTestId("reui-composite-details")).toBeVisible()
  })

  test("navega da ReUI para a composição correspondente e preserva as orientações",async ({page}) => {
    await page.goto("/?screen=reui")
    await page.getByLabel("Filtrar componente").selectOption("Alert")
    const link=page.locator('a[href="?screen=explorador-compostos&reui=c-alert-1"]')
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/screen=explorador-compostos&reui=c-alert-1/)
    await expect(page.getByTestId("reui-composite-details")).toContainText("ReuiAlert01")
    await expect(page.getByTestId("reui-composite-preview-c-alert-1")).toBeVisible()
    await expect(page.getByTestId("reui-composite-best-for")).not.toBeEmpty()
    await expect(page.getByTestId("reui-composite-when-not-use").locator("li").first()).toBeVisible()
  })

  test("filtra os compostos por família e critérios Melhor para / Quando não usar",async({page})=>{
    await page.goto("/?screen=explorador-compostos&reui=c-accordion-1")
    await page.getByLabel("Filtrar família de compostos ReUI").selectOption("Accordion")
    await expect(page.getByTestId("reui-composite-option-c-accordion-1")).toBeVisible()
    const search=page.getByLabel("Pesquisar composições ReUI")
    await search.fill("NAO usar")
    await expect(page.getByTestId("reui-composite-details")).toBeVisible()
    await search.fill("SEM TERMO EXISTENTE 999999")
    await expect(page.getByText("Nenhuma composição encontrada.")).toBeVisible()
    await search.fill("")
    await expect(page.getByTestId("reui-composite-option-c-accordion-1")).toBeVisible()
  })

  test("edita somente largura e alinhamento sem alterar o TSX original",async({page})=>{
    await page.goto("/?screen=explorador-compostos&reui=c-accordion-1")
    const preview=page.getByTestId("reui-composite-preview-c-accordion-1")
    await expect(preview.locator('[data-composite="ReuiAccordion01"]')).toBeVisible()
    await page.getByLabel("Largura da composição ReUI").selectOption("sm")
    await page.getByLabel("Alinhamento da composição ReUI").selectOption("start")
    await expect(preview.locator('[data-composite="ReuiAccordion01"] > div')).toHaveClass(/max-w-sm/)
    await expect(preview.locator('[data-composite="ReuiAccordion01"]')).toHaveClass(/justify-start/)
    await page.getByTestId("reui-code-toggle-c-accordion-1").click()
    await expect(page.getByTestId("reui-source-panel-c-accordion-1").getByTestId("reui-code-block")).toContainText("AccordionTrigger")
  })
})

test("edita dados semânticos ReUI, valida Zod e preserva exemplo não configurável", async ({ page }) => {
  await page.goto("/?screen=explorador-compostos&reui=c-alert-1")
  const editor = page.getByLabel("Dados semânticos da composição ReUI")
  await expect(editor).toBeVisible()
  await editor.fill(JSON.stringify({ title: "Aviso personalizado", description: "Conteúdo configurável sem JSX" }))
  await expect(page.getByTestId("reui-composite-preview-c-alert-1")).toContainText("Aviso personalizado")
  await editor.fill(JSON.stringify({ title: "Inseguro", description: "Alerta", className: "p-4" }))
  await expect(page.getByTestId("reui-composite-details").getByRole("alert")).toBeVisible()
  await expect(page.getByTestId("reui-composite-preview-c-alert-1")).toContainText("Corrija os dados")
  await page.getByRole("button", { name: "Restaurar dados de exemplo" }).click()
  await expect(page.getByTestId("reui-composite-details").getByRole("alert")).toHaveCount(0)
  await expect(page.getByTestId("reui-composite-preview-c-alert-1")).toContainText("Alert!")
  await page.getByLabel("Filtrar família de compostos ReUI").selectOption("Button")
  await expect(page.getByLabel("Dados semânticos da composição ReUI")).toHaveCount(0)
})

test("Accordion parametrizado mantém interações locais e bloqueia IDs duplicados", async ({ page }) => {
  await page.goto("/?screen=explorador-compostos&reui=c-accordion-1")
  const editor = page.getByLabel("Dados semânticos da composição ReUI")
  await editor.fill(JSON.stringify({ items: [
    { id: "primeiro", title: "Pergunta nova", description: "Resposta personalizada" },
    { id: "segundo", title: "Outra pergunta", description: "Outra resposta" },
  ] }))
  const preview = page.getByTestId("reui-composite-preview-c-accordion-1")
  await expect(preview).toContainText("Pergunta nova")
  await preview.getByText("Outra pergunta").click()
  await expect(preview).toContainText("Outra resposta")
  await editor.fill(JSON.stringify({ items: [
    { id: "mesmo", title: "A", description: "Um" },
    { id: "mesmo", title: "B", description: "Dois" },
  ] }))
  await expect(page.getByTestId("reui-composite-details").getByRole("alert")).toBeVisible()
})
