import {test,expect} from "@playwright/test";
test("T33: natural-language pattern choices are visible and overridable",async({page})=>{
 await page.goto("/?screen=criador-padroes");
 const wizard=page.getByTestId("pattern-wizard");
 await wizard.getByLabel("Descreva a interface").fill("Quero dashboard com gráficos");
 await expect(wizard.getByLabel("Tipo de tela")).toHaveValue("dashboard");
 await expect(wizard.getByLabel("Quais indicadores apresentar?")).toHaveValue("graphs");
 await expect(wizard.getByLabel("Quantidade de indicadores?")).toHaveCount(0);
 await wizard.getByLabel("Quais indicadores apresentar?").selectOption("kpis");
 await expect(wizard.getByLabel("Quantidade de indicadores?")).toBeVisible();
 await wizard.getByRole("button",{name:"Gerar interface do padrão"}).click();
 await expect(wizard.getByTestId("pattern-preview")).toBeVisible();
});
