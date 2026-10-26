import { test, expect } from "@playwright/test"

/** Rodar na suíte E2E manual da main. O Sheet é um modal na lateral direita. */
test.describe("ReUI — código-fonte em gaveta lateral", () => {
  test("abre à direita com Code Block formatado e fecha com Escape", async ({ page }) => {
    await page.goto("/?screen=reui")
    await page.getByLabel("Filtrar componente").selectOption("Alert")
    const trigger = page.getByTestId("reui-code-toggle-c-alert-1")
    await expect(trigger).toContainText("Ver código")
    await trigger.click()

    const panel = page.getByTestId("reui-source-panel-c-alert-1")
    await expect(panel).toBeVisible()
    await expect(panel).toHaveAttribute("data-side", "right")
    await expect(panel.getByRole("heading", { name: "Código-fonte" })).toBeVisible()
    const code = panel.getByTestId("reui-code-block")
    await expect(code).toContainText("AlertTitle")
    await expect(code).toContainText("AlertDescription")
    await expect(code.locator('[data-slot="code-block-line"]').first()).toBeVisible()
    await expect(code.locator('span[class*="text-rose-"]')).not.toHaveCount(0)
    await expect(page).toHaveURL(/screen=reui/)
    await page.keyboard.press("Escape")
    await expect(panel).not.toBeVisible()
    await expect(trigger).toBeFocused()
  })

  test("fecha pelo botão e mantém o código original para Accordion, Button e Textarea", async ({ page }) => {
    const cases = [
      { component: "Accordion", id: "c-accordion-1", code: "AccordionTrigger" },
      { component: "Button", id: "c-button-1", code: "Button" },
      { component: "Textarea", id: "c-textarea-1", code: "Textarea" },
    ]
    await page.goto("/?screen=reui")
    for (const entry of cases) {
      await page.getByLabel("Filtrar componente").selectOption(entry.component)
      await page.getByTestId("reui-code-toggle-" + entry.id).click()
      const panel = page.getByTestId("reui-source-panel-" + entry.id)
      await expect(panel.getByTestId("reui-code-block")).toContainText(entry.code)
      await expect(panel).toContainText("reui-" + entry.id.slice(2) + ".tsx")
      await panel.getByRole("button", { name: "Fechar código" }).click()
      await expect(panel).not.toBeVisible()
    }
  })

  test("abrir uma gaveta não carrega nem abre outros códigos", async ({ page }) => {
    await page.goto("/?screen=reui")
    await page.getByLabel("Filtrar componente").selectOption("Alert")
    await page.getByTestId("reui-code-toggle-c-alert-2").click()
    await expect(page.getByTestId("reui-source-panel-c-alert-2").getByTestId("reui-code-block")).toContainText("AlertTitle")
    await expect(page.getByTestId("reui-source-panel-c-alert-1")).toHaveCount(0)
  })

  test("copia o TSX exato, sem os números das linhas", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto("/?screen=reui")
    await page.getByLabel("Filtrar componente").selectOption("Alert")
    await page.getByTestId("reui-code-toggle-c-alert-4").click()
    const panel = page.getByTestId("reui-source-panel-c-alert-4")
    const code = panel.getByTestId("reui-code-block")
    await expect(code).toContainText("Payment Failed")
    await panel.getByTestId("reui-copy-source").click()
    await expect(panel.getByTestId("reui-copy-source")).toContainText("Copiado!")
    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toContain("Payment Failed")
    expect(clipboard).toContain("<Alert")
    expect(clipboard).not.toContain("1 <")
  })

  test("botão menor e gaveta ampla no desktop", async ({ page, isMobile }) => {
    test.skip(isMobile, "Verificação da largura em desktop")
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/?screen=reui")
    await page.getByLabel("Filtrar componente").selectOption("Alert")
    const button = page.getByTestId("reui-code-toggle-c-alert-1")
    const buttonBox = await button.boundingBox()
    expect(buttonBox).not.toBeNull()
    expect(buttonBox!.height).toBeLessThanOrEqual(28)
    await button.click()
    const panel = page.getByTestId("reui-source-panel-c-alert-1")
    await expect(panel).toBeVisible()
    const panelBox = await panel.boundingBox()
    expect(panelBox).not.toBeNull()
    expect(panelBox!.width).toBeGreaterThan(1000)
    expect(panelBox!.width).toBeLessThanOrEqual(1201)
  })

  test("a gaveta ocupa o lado direito em dispositivos móveis", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Cenário responsivo")
    await page.goto("/?screen=reui")
    await page.getByLabel("Filtrar componente").selectOption("Alert")
    await page.getByTestId("reui-code-toggle-c-alert-1").click()
    const panel = page.getByTestId("reui-source-panel-c-alert-1")
    await expect(panel).toBeVisible()
    const bounds = await panel.boundingBox()
    const viewport = page.viewportSize()
    expect(bounds).not.toBeNull()
    expect(viewport).not.toBeNull()
    // The sheet slides in via CSS transition; check settled geometry.
    await expect.poll(async () => {
      const current = await panel.boundingBox()
      return Math.abs((current?.x ?? 0) + (current?.width ?? 0) - viewport!.width)
    }, { timeout: 5_000 }).toBeLessThan(5)
    await expect(panel.getByTestId("reui-code-block")).toBeVisible()
  })
})
