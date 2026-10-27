import {test,expect} from "@playwright/test";

for(const pattern of ["login","search","list","dashboard"]){
 test("T34 pattern preview renders: "+pattern,async({page})=>{
  await page.goto("/?screen=criador-padroes");
  const wizard=page.getByTestId("pattern-wizard");
  await expect(wizard).toBeVisible();
  await wizard.getByLabel("Tipo de tela").selectOption(pattern);
  await wizard.getByRole("button",{name:"Gerar interface do padrão"}).click();
  await expect(wizard.getByTestId("pattern-preview")).toBeVisible();
  await expect(wizard.getByText("A interface foi bloqueada: especificação não autorizada.")).toHaveCount(0);
 });
}
test("T34 alternate dashboard and login choices remain valid",async({page})=>{
 await page.goto("/?screen=criador-padroes");
 const wizard=page.getByTestId("pattern-wizard");
 await wizard.getByLabel("Tipo de tela").selectOption("dashboard");
 await wizard.getByLabel("Quais indicadores apresentar?").selectOption("graphs");
 await wizard.getByRole("button",{name:"Gerar interface do padrão"}).click();
 await expect(wizard.getByTestId("pattern-preview")).toBeVisible();
 await wizard.getByLabel("Tipo de tela").selectOption("login");
 await wizard.getByLabel("Identificação").selectOption("username");
 await wizard.getByRole("button",{name:"Gerar interface do padrão"}).click();
 await expect(wizard.getByTestId("pattern-preview")).toBeVisible();
});
