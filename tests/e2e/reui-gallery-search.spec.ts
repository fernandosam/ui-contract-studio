import { test, expect } from "@playwright/test"

test.describe("Galeria 3 — cabeçalho e busca de orientações", () => {
  test("apresenta somente o cabeçalho padrão da página", async ({ page }) => {
    await page.goto("/?screen=galeria-3")
    await expect(page.getByRole("heading", { name: "Galeria 3", level: 1 })).toHaveCount(1)
    await expect(page.getByText("Exemplos ReUI agrupados por componente, com filtro e carregamento progressivo.", { exact: true })).toHaveCount(1)
    await expect(page.getByRole("heading", { name: "Galeria 3 · ReUI" })).toHaveCount(0)
  })

  test("pesquisa por Melhor para sem exigir acentos", async ({ page }) => {
    await page.goto("/?screen=galeria-3")
    await page.getByLabel("Filtrar componente").selectOption("Accordion")
    const input = page.getByLabel("Pesquisar exemplos")
    await input.fill("PADRAO MINIMO")
    await expect(page.getByTestId("reui-preview-c-accordion-1")).toBeVisible()
    await expect(page.getByTestId("reui-preview-c-accordion-2")).toHaveCount(0)
    await expect(page.getByText("Exibindo 1 de 1 exemplos encontrados.", { exact: false })).toBeVisible()
  })

  test("pesquisa por Quando não usar e atualiza os resultados", async ({ page }) => {
    await page.goto("/?screen=galeria-3")
    await page.getByLabel("Filtrar componente").selectOption("Accordion")
    const input = page.getByLabel("Pesquisar exemplos")
    await input.fill("VARIAS RESPOSTAS")
    await expect(page.getByTestId("reui-preview-c-accordion-1")).toBeVisible()
    await input.fill("TERMO NAO EXISTENTE 99188")
    await expect(page.getByText("Nenhum exemplo corresponde aos filtros.")).toBeVisible()
    await input.fill("")
    await expect(page.getByTestId("reui-preview-c-accordion-1")).toBeVisible()
  })
})
