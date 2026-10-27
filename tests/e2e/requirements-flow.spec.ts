import {test,expect} from "@playwright/test";

test("T34: cadastro local valida os campos e conclui sem persistência",async({page})=>{
 await page.goto("/?screen=criador-interfaces");
 const wizard=page.getByTestId("requirements-wizard");
 await wizard.getByLabel("O cadastro será demonstrativo ou salvará no servidor?").selectOption("local-demo");
 await wizard.getByRole("button",{name:"Gerar prévia JSON"}).click();
 const demo=page.getByTestId("registration-flow-demo");
 await expect(demo).toBeVisible();
 await demo.getByRole("button",{name:"Concluir demonstração"}).click();
 await expect(demo.getByText("Campo obrigatório").first()).toBeVisible();
 await demo.getByLabel(/^Nome/).fill("Ana");
 await demo.getByLabel(/^E-mail/).fill("ana@exemplo.com");
 await demo.getByLabel(/^Senha/).fill("senha-local");
 await demo.getByRole("button",{name:"Concluir demonstração"}).click();
 await expect(demo.getByRole("status")).toContainText("Nenhum registro foi salvo");
});
test("T34: confirmação é revogável e não duplica submissão",async({page})=>{
 await page.goto("/?screen=criador-interfaces");
 const wizard=page.getByTestId("requirements-wizard");
 await wizard.getByLabel("O cadastro será demonstrativo ou salvará no servidor?").selectOption("local-demo");
 await wizard.getByLabel("Mostrar confirmação antes de salvar?").check();
 await wizard.getByRole("button",{name:"Gerar prévia JSON"}).click();
 const demo=page.getByTestId("registration-flow-demo");
 await demo.getByLabel(/^Nome/).fill("Ana");
 await demo.getByLabel(/^E-mail/).fill("ana@exemplo.com");
 await demo.getByLabel(/^Senha/).fill("senha");
 await demo.getByRole("button",{name:"Revisar e confirmar"}).click();
 const dialog=page.getByRole("alertdialog");
 await expect(dialog).toBeVisible();
 await dialog.getByRole("button",{name:"Cancelar"}).click();
 await expect(dialog).toBeHidden();
 await demo.getByRole("button",{name:"Revisar e confirmar"}).click();
 await dialog.getByRole("button",{name:"Confirmar simulação"}).click();
 await expect(demo.getByRole("status")).toContainText("Nenhum registro foi salvo");
});

test("T35: the proposal handles an additional multi-column corporate field without network",async({page})=>{
 const requests:string[]=[];
 page.on("request",request=>{if(["xhr","fetch"].includes(request.resourceType()))requests.push(request.url());});
 await page.goto("/?screen=criador-interfaces");
 const wizard=page.getByTestId("requirements-wizard");
 await wizard.getByRole("checkbox",{name:"Empresa"}).check();
 await wizard.getByLabel("Como organizar os campos?").selectOption("two-columns");
 await wizard.getByLabel("O cadastro será demonstrativo ou salvará no servidor?").selectOption("local-demo");
 await wizard.getByRole("button",{name:"Gerar prévia JSON"}).click();
 const demo=page.getByTestId("registration-flow-demo");
 await expect(demo.getByLabel(/^Empresa/)).toBeVisible();
 await expect(demo.locator("form .sm\\:grid-cols-2")).toHaveCount(1);
 await demo.getByLabel(/^Nome/).fill("Ana");
 await demo.getByLabel(/^E-mail/).fill("ana@exemplo.com");
 await demo.getByLabel(/^Senha/).fill("senha");
 await demo.getByRole("button",{name:"Concluir demonstração"}).click();
 await expect(demo.getByRole("status")).toContainText("Nenhum registro foi salvo");
 expect(requests).toEqual([]);
});
