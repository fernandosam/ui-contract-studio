import {test,expect} from "@playwright/test";

test("official catalog distinguishes pending E2E and only previews it after opt-in",async({page})=>{
 await page.goto("/?screen=catalogo-pi");
 const catalog=page.getByTestId("admission-catalog");
 await expect(catalog).toBeVisible();
 await expect(catalog.getByText(/102 contratos base.extensão e 5 composições adicionais/)).toBeVisible();
 await catalog.getByLabel("Buscar componente").fill("TypedConfirmationDialog");
 const member=catalog.getByRole("button",{name:/TypedConfirmationDialog/});
 await expect(member).toBeVisible();
 await member.click();
 const pending=await catalog.getByText(/Este componente ainda não passou pelo E2E completo/).count();
 if(!pending)await expect(catalog.getByText("E2E aprovado").first()).toBeVisible();
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
