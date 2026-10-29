import {test, expect} from "@playwright/test";

test("E06: theme choice stays synchronized across primitives, composites and JSON screens", async ({page}) => {
  await page.goto("/?screen=explorador-primitivos");
  await page.getByLabel("Buscar componente").fill("Button");
  await page.locator('[aria-label="Componentes registrados"] button[aria-label="Button"]').click();
  const primitive = page.getByTestId("preview-theme-selector").first();
  await expect(primitive).toHaveValue("studio@1.0.0:dark");
  await primitive.selectOption("studio@1.0.0:light");
  await expect(page.locator("html")).toHaveClass(/light-theme/);
  await expect(page.getByRole("button", {name:"Ativar tema escuro"})).toBeVisible();

  await page.goto("/?screen=explorador-compostos");
  await page.getByLabel("Buscar componente").fill("Dashboard01");
  await page.getByRole("button", {name:"Dashboard01", exact:true}).click();
  await expect(page.getByTestId("preview-theme-selector").first()).toHaveValue("studio@1.0.0:light");
  await page.getByRole("button", {name:"ReUI (559)"}).click();
  await expect(page.getByTestId("preview-theme-selector").first()).toHaveValue("studio@1.0.0:light");

  await page.goto("/?screen=explorador-exemplos");
  await expect(page.getByTestId("preview-theme-selector").first()).toHaveValue("studio@1.0.0:light");
  await page.goto("/?screen=blocos-login");
  await expect(page.getByTestId("preview-theme-selector").first()).toHaveValue("studio@1.0.0:light");

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/light-theme/);
  await expect(page.getByTestId("preview-theme-selector").first()).toHaveValue("studio@1.0.0:light");
  await page.getByRole("button", {name:"Ativar tema escuro"}).click();
  await expect(page.locator("html")).toHaveClass(/dark-theme/);
  await expect(page.getByTestId("preview-theme-selector").first()).toHaveValue("studio@1.0.0:dark");
});

test("E06: invalid persisted theme cannot inject classes or change approved spec", async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem("ui-contract-studio-preview-theme",
      JSON.stringify({id:"studio",version:"1.0.0",mode:"light",className:"injected-class"}));
  });
  await page.goto("/?screen=explorador-exemplos");
  await expect(page.getByTestId("preview-theme-selector").first()).toHaveValue("studio@1.0.0:dark");
  await expect(page.locator("html")).toHaveClass(/dark-theme/);
  await expect(page.locator("html")).not.toHaveClass(/injected-class/);
  await expect(page.getByTestId("catalog-live-preview")).toBeVisible();
});

test("E06: ReUI gallery theme controls are available without editing demo components", async ({page}) => {
  await page.goto("/?screen=reui");
  const selector = page.getByTestId("preview-theme-selector").first();
  await expect(selector).toBeVisible();
  await selector.selectOption("studio@1.0.0:light");
  await expect(page.locator("html")).toHaveClass(/light-theme/);
  await expect(page.locator('[data-testid^="reui-preview-"]').first()).toBeVisible();
});
