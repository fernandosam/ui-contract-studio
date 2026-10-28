import {test,expect,type Page} from "@playwright/test";

// T35: the SAME experimental Pi type renders three independently validated forms.
// Browser proof is not a certification or permission to publish a stable contract.
async function openVariant(page:Page,variant:"minimal"|"standard"|"corporate"){
 await page.goto("/?screen=catalogo-pi");
 const catalog=page.getByTestId("admission-catalog");
 await catalog.getByLabel("Buscar componente").fill("DeclarativeFormFlow");
 await catalog.getByRole("button",{name:/DeclarativeFormFlow/}).click();
 const preview=catalog.getByRole("region",{name:"Prévia do contrato"});
 await expect(preview.getByTestId("registration-flow-demo")).toHaveCount(0);
 await expect(preview.getByText("Selecione o canal experimental", {exact:false})).toBeVisible();
 await catalog.getByLabel("Canal Pi").selectOption("experimental");
 await catalog.getByLabel("Variação do formulário").selectOption(variant);
 const form=preview.getByTestId("registration-flow-demo");
 await expect(form).toBeVisible();
 return form;
}
const networkAfter=(page:Page)=>{
 const outbound:string[]=[];
 page.on("request",req=>{if(["xhr","fetch"].includes(req.resourceType()))outbound.push(req.url());});
 return outbound;
};

test("T35 minimal: one email field, required/format checks, no external effects",async({page})=>{
 const form=await openVariant(page,"minimal");
 const outbound=networkAfter(page);
 await expect(form.getByRole("textbox")).toHaveCount(1);
 await form.getByRole("button",{name:"Concluir demonstração"}).click();
 const email=form.getByLabel(/^E-mail/);
 await expect(email).toBeFocused();
 await email.fill("invalid");
 await form.getByRole("button",{name:"Concluir demonstração"}).click();
 await expect(form.getByText("E-mail inválido")).toBeVisible();
 await email.fill("ana@example.org");
 await form.getByRole("button",{name:"Concluir demonstração"}).click();
 await expect(form.getByRole("status")).toContainText("Conclusões locais: 1");
 expect(outbound).toEqual([]);
});

test("T35 standard: existing three-field Pi candidate is reused, not duplicated",async({page})=>{
 const form=await openVariant(page,"standard");
 const outbound=networkAfter(page);
 await form.getByRole("button",{name:"Concluir demonstração"}).click();
 await expect(form.getByRole("alert")).toHaveCount(3);
 await form.getByLabel(/^Nome/).fill("Ana");
 await form.getByLabel(/^E-mail/).fill("ana@example.org");
 await form.getByLabel(/^Senha/).fill("senha-ficticia");
 await form.getByRole("button",{name:"Concluir demonstração"}).click();
 await expect(form.getByRole("status")).toContainText("Nenhum registro foi salvo");
 expect(outbound).toEqual([]);
});

test("T35 corporate: five fields, blur/length validation, cancel, keyboard confirm, no network",async({page},info)=>{
 const form=await openVariant(page,"corporate");
 const outbound=networkAfter(page);
 await expect(form.locator("form input")).toHaveCount(5);
 const company=form.getByLabel(/^Empresa/),password=form.getByLabel(/^Senha/);
 await password.fill("123");
 await password.blur();
 await expect(form.getByText("Tamanho mínimo: 6")).toBeVisible();
 await form.getByLabel(/^Nome/).fill("Ana");
 await form.getByLabel(/^E-mail/).fill("ana@example.org");
 await password.fill("123456");
 await company.fill("Empresa de teste");
 await form.getByRole("button",{name:"Revisar e confirmar"}).click();
 const dialog=page.getByRole("alertdialog");
 await expect(dialog).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(dialog).toBeHidden();
 await expect(company).toHaveValue("Empresa de teste");
 await form.getByRole("button",{name:"Revisar e confirmar"}).click();
 const confirm=dialog.getByRole("button",{name:"Confirmar simulação"});
 await confirm.focus();
 await page.keyboard.press("Enter");
 await expect(dialog).toBeHidden();
 await expect(form.getByRole("status")).toContainText("Conclusões locais: 1");
 expect(outbound).toEqual([]);
 const bounds=await form.boundingBox(),viewport=page.viewportSize();
 expect(bounds).not.toBeNull();expect(viewport).not.toBeNull();
 expect(bounds!.x).toBeGreaterThanOrEqual(-1);
 expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(viewport!.width+1);
 expect(info.project.name).toMatch(/desktop|mobile/);
});
