import {test,expect,type Page} from "@playwright/test";
import {mkdirSync,writeFileSync,readFileSync} from "node:fs";
import {join} from "node:path";

/** Independent runtime E2E protocol; screenshots alone never certify this contract. */
const candidateId="form-declarative";
const entry=JSON.parse(readFileSync("src/ui-catalog/admission-engine/entries.json","utf8")).entries
 .find((item:{id:string})=>item.id===candidateId);
const protocol=JSON.parse(readFileSync("src/ui-catalog/admission-engine/protocols.json","utf8")).candidates[candidateId];
const cases=[
 "required-errors-and-focus",
 "confirmation-cancel-reopen",
 "keyboard-accessibility",
 "responsive-optional-fields",
 "no-validation-local-only",
] as const;
if(!entry||!protocol||protocol.target!==entry.type)throw Error("Form admission protocol mismatch");
if(JSON.stringify(protocol.cases)!==JSON.stringify(cases))throw Error("Form E2E protocol cases must match tests");

function requestsAfter(page:Page){
 const requests:string[]=[];
 page.on("request",req=>{
  if(["fetch","xhr"].includes(req.resourceType()))requests.push(req.url());
 });
 return requests;
}
async function catalogPreview(page:Page){
 await page.goto("/?screen=catalogo-pi");
 const catalog=page.getByTestId("admission-catalog");
 await expect(catalog).toBeVisible();
 await catalog.getByLabel("Buscar componente").fill(entry.type);
 await catalog.getByRole("button",{name:new RegExp(entry.type)}).click();
 await catalog.getByLabel("Canal Pi").selectOption("experimental");
 const preview=catalog.getByRole("region",{name:"Prévia do contrato"});
 const form=preview.getByTestId("registration-flow-demo");
 await expect(form).toBeVisible();
 return form;
}
async function wizardPreview(page:Page,options:{confirmation?:boolean;twoColumns?:boolean;optionalFields?:boolean;noValidation?:boolean}={}){
 await page.goto("/?screen=criador-interfaces");
 const wizard=page.getByTestId("requirements-wizard");
 if(options.confirmation)await wizard.getByLabel("Mostrar confirmação antes de salvar?").check();
 if(options.twoColumns)await wizard.getByLabel("Como organizar os campos?").selectOption("two-columns");
 if(options.optionalFields){
  await wizard.getByRole("checkbox",{name:"Empresa"}).check();
  await wizard.getByRole("checkbox",{name:"Telefone"}).check();
 }
 if(options.noValidation)await wizard.getByLabel("Qual nível de validação?").selectOption("none");
 await wizard.getByLabel("O cadastro será demonstrativo ou salvará no servidor?").selectOption("local-demo");
 await wizard.getByRole("button",{name:"Gerar prévia JSON"}).click();
 const form=wizard.getByTestId("registration-flow-demo");
 await expect(form).toBeVisible();
 return form;
}
async function fillRequired(form:ReturnType<Page["getByTestId"]>){
 await form.getByLabel(/^Nome/).fill("Teste local");
 await form.getByLabel(/^E-mail/).fill("teste@example.org");
 await form.getByLabel(/^Senha/).fill("senha-ficticia");
}
test.afterEach(async({page},info)=>{
 const caseId=info.title.split(" :: ")[0];
 if(!protocol.cases.includes(caseId))return;
 const dir=join(protocol.evidenceRoot,info.project.name);
 mkdirSync(dir,{recursive:true});
 let screenshotStatus="unavailable";
 try{
  await page.screenshot({path:join(dir,caseId+".png"),animations:"disabled",fullPage:true});
  screenshotStatus=info.status==="passed"?"captured":"captured-failure";
 }catch{ /* Missing evidence is an explicit certification failure. */ }
 writeFileSync(join(dir,caseId+".json"),JSON.stringify({
  schemaVersion:1,scenarioId:candidateId,target:entry.type,
  sourceDigest:entry.sourceDigest,protocol:protocol.protocol,
  project:info.project.name,caseId,status:info.status,
  expectedStatus:info.expectedStatus,retry:info.retry,
  screenshotStatus,errors:info.errors.map(error=>error.message??"unknown")
 },null,2)+"\n");
});

test("required-errors-and-focus :: submit reports errors and never completes before valid data",async({page})=>{
 const form=await catalogPreview(page);
 const network=requestsAfter(page);
 const submit=form.getByRole("button",{name:"Concluir demonstração"});
 await submit.click();
 const name=form.getByLabel(/^Nome/);
 await expect(name).toBeFocused();
 await expect(name).toHaveAttribute("aria-invalid","true");
 const describedby=await name.getAttribute("aria-describedby");
 expect(describedby).toBeTruthy();
 await expect(form.locator("[id="+JSON.stringify(describedby)+"]")).toHaveText("Campo obrigatório");
 await expect(form.getByRole("alert")).toHaveCount(3);
 await name.fill("Teste local");
 await form.getByLabel(/^E-mail/).fill("invalido");
 await submit.click();
 await expect(form.getByText("E-mail inválido")).toBeVisible();
 await expect(form.getByLabel(/^E-mail/)).toBeFocused();
 await fillRequired(form);
 await submit.click();
 await expect(form.getByRole("status")).toContainText("Conclusões locais: 1");
 await expect(form.getByRole("status")).toContainText("Nenhum registro foi salvo");
 await form.getByRole("button",{name:"Reiniciar demonstração"}).click();
 await expect(name).toHaveValue("");
 expect(network).toEqual([]);
});

test("confirmation-cancel-reopen :: Escape, Cancel and keyboard confirmation never persist data",async({page})=>{
 const form=await wizardPreview(page,{confirmation:true});
 const network=requestsAfter(page);
 await fillRequired(form);
 const submit=form.getByRole("button",{name:"Revisar e confirmar"});
 await submit.click();
 const dialog=page.getByRole("alertdialog");
 await expect(dialog).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(dialog).toBeHidden();
 await expect(form.getByRole("status")).toHaveCount(0);
 await expect(form.getByLabel(/^Nome/)).toHaveValue("Teste local");
 await submit.click();
 await dialog.getByRole("button",{name:"Cancelar"}).click();
 await expect(dialog).toBeHidden();
 await submit.click();
 const confirm=dialog.getByRole("button",{name:"Confirmar simulação"});
 await confirm.focus();
 await page.keyboard.press("Enter");
 await expect(dialog).toBeHidden();
 await expect(form.getByRole("status")).toContainText("Conclusões locais: 1");
 await expect(form.getByRole("status")).toContainText("Nenhum registro foi salvo");
 expect(network).toEqual([]);
});

test("keyboard-accessibility :: labels, tab order and error focus work without a mouse",async({page})=>{
 const form=await catalogPreview(page);
 const network=requestsAfter(page);
 const name=form.getByLabel(/^Nome/),email=form.getByLabel(/^E-mail/),password=form.getByLabel(/^Senha/);
 await name.focus();
 await page.keyboard.press("Tab");
 await expect(email).toBeFocused();
 await page.keyboard.press("Tab");
 await expect(password).toBeFocused();
 await page.keyboard.press("Tab");
 await expect(form.getByRole("button",{name:"Concluir demonstração"})).toBeFocused();
 await page.keyboard.press("Enter");
 await expect(name).toBeFocused();
 await expect(name).toHaveAttribute("aria-invalid","true");
 await expect(form.getByRole("alert").first()).toBeVisible();
 expect(network).toEqual([]);
});

test("responsive-optional-fields :: configured fields fit desktop and mobile and remain optional",async({page},info)=>{
 const form=await wizardPreview(page,{twoColumns:true,optionalFields:true});
 const network=requestsAfter(page);
 await expect(form.getByLabel(/^Empresa/)).toBeVisible();
 await expect(form.getByLabel(/^Telefone/)).toBeVisible();
 const grid=form.locator("form > div.grid");
 await expect(grid).toBeVisible();
 const columns=await grid.evaluate(node=>getComputedStyle(node).gridTemplateColumns.trim().split(/\s+/).length);
 expect(columns).toBe(info.project.name==="desktop"?2:1);
 const rect=await grid.boundingBox(),vp=page.viewportSize();
 expect(rect).not.toBeNull();
 expect(vp).not.toBeNull();
 expect(rect!.x).toBeGreaterThanOrEqual(-1);
 expect(rect!.x+rect!.width).toBeLessThanOrEqual(vp!.width+1);
 await fillRequired(form);
 await form.getByRole("button",{name:"Concluir demonstração"}).click();
 await expect(form.getByRole("status")).toContainText("Nenhum registro foi salvo");
 expect(network).toEqual([]);
});

test("no-validation-local-only :: optional validation is explicit and never calls a backend",async({page})=>{
 const form=await wizardPreview(page,{noValidation:true});
 const network=requestsAfter(page);
 await form.getByRole("button",{name:"Concluir demonstração"}).click();
 await expect(form.getByRole("alert")).toHaveCount(0);
 await expect(form.getByRole("status")).toContainText("Conclusões locais: 1");
 await expect(form.getByRole("status")).toContainText("Nenhum registro foi salvo");
 expect(network).toEqual([]);
});
