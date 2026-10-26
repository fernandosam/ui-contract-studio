import {test,expect} from "@playwright/test";

test("official catalog distinguishes pending E2E and only previews it after opt-in",async({page})=>{
 await page.goto("/?screen=catalogo-pi");
 const catalog=page.getByTestId("admission-catalog");
 await expect(catalog).toBeVisible();
 await expect(catalog.getByText("102 contratos estáveis e 4 contratos experimentais")).toBeVisible();
 await catalog.getByLabel("Maturidade").selectOption("experimental");
 const member=catalog.getByRole("button",{name:/TypedConfirmationDialog/});
 await expect(member).toBeVisible();
 await member.click();
 await expect(catalog.getByText(/Este componente ainda não passou pelo E2E completo/)).toBeVisible();
 await catalog.getByLabel("Canal Pi").selectOption("experimental");
 const preview=catalog.getByRole("region",{name:"Prévia do contrato"});
 await expect(preview.getByRole("button",{name:"Excluir"})).toBeVisible();
 await preview.getByRole("button",{name:"Excluir"}).click();
 const dialog=page.locator('[data-slot="alert-dialog-content"]');
 await expect(dialog).toBeVisible();
 const confirm=dialog.getByRole("button",{name:"Excluir"});
 await expect(confirm).toBeDisabled();
 await dialog.getByRole("textbox",{name:/Digite exatamente:/}).fill("EXCLUIR");
 await expect(confirm).toBeEnabled();
});
