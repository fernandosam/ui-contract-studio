import {test,expect,type Page,type Locator} from "@playwright/test";
import {createHash} from "node:crypto";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {
  buildSemanticTestAutomation,loadSemanticTestRecords,semanticTestRecipes,
} from "../../scripts/lib/semantic-test-automation.mjs";

// Cases are discovered at load time from curated semantic knowledge. This suite
// never generates TS/JS from descriptions or executes unreviewed code.
const audit=buildSemanticTestAutomation(loadSemanticTestRecords());
if(audit.errors.length)throw new Error("Invalid semantic test recipes: "+audit.errors.join("; "));
const registered=audit.entries.filter(item=>item.status==="registered");

async function preview(page:Page,component:string) {
  await page.goto("/?screen=explorador-primitivos");
  await page.getByRole("button",{name:component,exact:true}).first().click();
  const container=page.getByTestId("catalog-live-preview");
  await expect(container).toBeVisible();
  return container;
}
function networkRequests(page:Page) {
  const requests:string[]=[];
  page.on("request",request=>{
    if(["xhr","fetch"].includes(request.resourceType()))requests.push(request.url());
  });
  return requests;
}
async function withinViewport(page:Page,element:Locator) {
  await element.scrollIntoViewIfNeeded();
  const rect=await element.boundingBox();
  const viewport=page.viewportSize();
  expect(rect).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(rect!.x).toBeGreaterThanOrEqual(-1);
  expect(rect!.x+rect!.width).toBeLessThanOrEqual(viewport!.width+1);
  expect(rect!.y).toBeGreaterThanOrEqual(-1);
  expect(rect!.y+rect!.height).toBeLessThanOrEqual(viewport!.height+1);
}
const recipes:Record<string,(page:Page)=>Promise<void>>={
  "dialog.cancel-without-confirm":async page=>{
    const container=await preview(page,"AlertDialog");
    const remote=networkRequests(page);
    const trigger=container.getByRole("button",{name:"Confirmar operação"});
    await trigger.click();
    const dialog=page.locator('[data-slot="alert-dialog-content"]');
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button",{name:"Cancelar"}).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(remote).toEqual([]);
    // Event counts are not exposed by this explorer. The semantic report marks
    // this as partial, not as proof of zero "confirm" emissions.
  },
  "button.press-disabled":async page=>{
    const container=await preview(page,"Button");
    const remote=networkRequests(page);
    const button=container.getByRole("button",{name:"Testar ação local"});
    await expect(button).toBeEnabled();
    await button.click();
    await page.locator("#property-Button-disabled").selectOption("true");
    await expect(button).toBeDisabled();
    await page.locator("#property-Button-disabled").selectOption("false");
    await page.locator("#property-Button-loading").selectOption("true");
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-busy","true");
    await expect(button.locator("svg.animate-spin")).toBeVisible();
    await page.locator("#property-Button-loading").selectOption("false");
    await expect(button).toBeEnabled();
    await button.focus();
    await page.keyboard.press("Enter");
    expect(remote).toEqual([]);
    // Press event counts are not observable here; this is partial coverage.
  },
  "accordion.single-multiple":async page=>{
    const container=await preview(page,"Accordion");
    const first=container.getByRole("button",{name:"O que é um catálogo fechado?"});
    const second=container.getByRole("button",{name:"E se faltar algum tipo?"});
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded","true");
    await second.click();
    await expect(first).toHaveAttribute("aria-expanded","false");
    await expect(second).toHaveAttribute("aria-expanded","true");
    await page.locator("#property-Accordion-type").selectOption("multiple");
    // Switching modes may reset which items are open; explicitly open both.
    // The invariant being tested is simultaneous expansion, not state carryover.
    for(const item of [first,second]){
      if(await item.getAttribute("aria-expanded")!=="true")await item.click();
    }
    await expect(first).toHaveAttribute("aria-expanded","true");
    await expect(second).toHaveAttribute("aria-expanded","true");
  },
  "checkbox.toggle-local":async page=>{
    const container=await preview(page,"Checkbox");
    const remote=networkRequests(page);
    const checkbox=container.getByRole("checkbox",{name:"Receber notificações"});
    await expect(checkbox).toBeChecked();
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
    await page.locator("#property-Checkbox-checked").selectOption("false");
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await withinViewport(page,checkbox);
    expect(remote).toEqual([]);
    // Binding propagation is not observable in this isolated catalog preview.
  },
  "checkbox.label-help":async page=>{
    const container=await preview(page,"Checkbox");
    await page.locator("#property-Checkbox-description").fill("Preferência local de notificações.");
    const checkbox=container.getByRole("checkbox",{name:"Receber notificações"});
    const id=await checkbox.getAttribute("id");
    expect(id).toBeTruthy();
    await expect(container.locator("label[for='"+id+"']")).toHaveText("Receber notificações");
    const help=await checkbox.getAttribute("aria-describedby");
    expect(help).toBeTruthy();
    await expect(container.locator("[id='"+help+"']")).toHaveText("Preferência local de notificações.");
    await container.locator("label[for='"+id+"']").click();
    await expect(checkbox).not.toBeChecked();
  },
  "checkbox.disabled-invalid":async page=>{
    const container=await preview(page,"Checkbox");
    const checkbox=container.getByRole("checkbox",{name:"Receber notificações"});
    const remote=networkRequests(page);
    await page.locator("#property-Checkbox-required").selectOption("true");
    await page.locator("#property-Checkbox-invalid").selectOption("true");
    await expect(checkbox).toHaveAttribute("aria-invalid","true");
    await page.locator("#property-Checkbox-disabled").selectOption("true");
    await expect(checkbox).toBeDisabled();
    await page.locator("#property-Checkbox-disabled").selectOption("false");
    await expect(checkbox).toBeEnabled();
    expect(remote).toEqual([]);
    // Required forwarding is checked statically; no real form submission here.
  },
  "input.change-enter":async page=>{
    const container=await preview(page,"Input");
    const remote=networkRequests(page);
    const input=container.getByRole("textbox",{name:"Nome"});
    await input.fill("Teste local");
    await expect(input).toHaveValue("Teste local");
    await input.focus();
    await page.keyboard.press("Enter");
    await input.blur();
    await expect(input).toHaveValue("Teste local");
    await withinViewport(page,input);
    expect(remote).toEqual([]);
    // The explorer does not expose change/focus/blur/submit event counts.
  },
  "input.label-help":async page=>{
    const container=await preview(page,"Input");
    await page.locator("#property-Input-description").fill("Informe o nome completo.");
    const input=container.getByRole("textbox",{name:"Nome"});
    await expect(input).toHaveAttribute("name","nome");
    const id=await input.getAttribute("id");
    expect(id).toBeTruthy();
    await expect(container.locator("label[for='"+id+"']")).toHaveText("Nome");
    const help=await input.getAttribute("aria-describedby");
    expect(help).toBeTruthy();
    await expect(container.locator("[id='"+help+"']")).toHaveText("Informe o nome completo.");
  },
  "input.native-states":async page=>{
    const container=await preview(page,"Input");
    const input=container.getByRole("textbox",{name:"Nome"});
    await page.locator("#property-Input-maxLength").fill("4");
    await expect(input).toHaveAttribute("maxlength","4");
    await page.locator("#property-Input-required").selectOption("true");
    await expect(input).toBeRequired();
    await page.locator("#property-Input-invalid").selectOption("true");
    await expect(input).toHaveAttribute("aria-invalid","true");
    await page.locator("#property-Input-readOnly").selectOption("true");
    await expect(input).toHaveAttribute("readonly","");
    await page.locator("#property-Input-disabled").selectOption("true");
    await expect(input).toBeDisabled();
    // Browser-native attributes do not prove business validation.
  },
  "select.simple-object-options":async page=>{
    const container=await preview(page,"Select");
    const remote=networkRequests(page);
    const trigger=container.locator('[data-slot="select-trigger"]');
    await expect(trigger).toContainText("Selecione o setor");
    await trigger.click();
    await page.locator('[data-slot="select-item"]').filter({hasText:"Tecnologia"}).click();
    await expect(trigger).toContainText("Tecnologia");
    const options=[
      {label:"Em análise",value:"pending"},
      {label:"Aprovado",value:"approved"},
    ];
    await page.locator("#property-Select-options").fill(JSON.stringify(options));
    await expect(trigger).toBeVisible();
    await trigger.click();
    await page.locator('[data-slot="select-item"]').filter({hasText:"Em análise"}).click();
    await expect(trigger).toContainText("Em análise");
    await withinViewport(page,trigger);
    expect(remote).toEqual([]);
    // The explorer does not publish a 'change' event counter.
  },
  "select.disabled-options":async page=>{
    const container=await preview(page,"Select");
    const trigger=container.locator('[data-slot="select-trigger"]');
    await page.locator("#property-Select-options").fill(JSON.stringify([
      {label:"Indisponível",value:"no",disabled:true},
      {label:"Permitido",value:"yes"},
    ]));
    await trigger.click();
    const blocked=page.locator('[data-slot="select-item"]').filter({hasText:"Indisponível"});
    await expect(blocked).toBeDisabled();
    await page.locator('[data-slot="select-item"]').filter({hasText:"Permitido"}).click();
    await expect(trigger).toContainText("Permitido");
    await page.locator("#property-Select-disabled").selectOption("true");
    await expect(trigger).toBeDisabled();
    await page.locator("#property-Select-disabled").selectOption("false");
    await expect(trigger).toBeEnabled();
    // Keyboard interaction and full screen reader behavior remain to review.
  },
  "dialog.trigger-content":async page=>{
    const container=await preview(page,"Dialog");
    const remote=networkRequests(page);
    const trigger=container.getByRole("button",{name:"Abrir: Ativar agente"});
    await trigger.click();
    const dialog=page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Ativar agente",{exact:true})).toBeVisible();
    await expect(dialog.getByText("Ativação demonstrativa; nenhuma conexão externa é realizada.")).toBeVisible();
    await expect(dialog.getByText("Confirme a ativação demonstrativa.")).toBeVisible();
    await expect(dialog.getByRole("button",{name:"Confirmar"})).toBeVisible();
    await withinViewport(page,dialog);
    await dialog.getByRole("button",{name:"Close"}).click();
    await expect(dialog).toBeHidden();
    expect(remote).toEqual([]);
  },
  "dialog.escape-close":async page=>{
    const container=await preview(page,"Dialog");
    const remote=networkRequests(page);
    const trigger=container.getByRole("button",{name:"Abrir: Ativar agente"});
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog=page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button",{name:"Close"}).click();
    await expect(dialog).toBeHidden();
    expect(remote).toEqual([]);
    // Backdrop dismissal and openChange event counts remain pending.
  },
  "tabs.select-panel":async page=>{
    const container=await preview(page,"Tabs");
    const overview=container.getByRole("tab",{name:"Visão geral"});
    const details=container.getByRole("tab",{name:"Detalhes"});
    await expect(overview).toHaveAttribute("aria-selected","true");
    await page.locator("#property-Tabs-tabs").fill(JSON.stringify([
      {label:"Visão geral",value:"overview",content:"Conteúdo de resumo"},
      {label:"Detalhes",value:"details",content:"Conteúdo de detalhes"},
      {label:"Configurações",value:"settings",content:"Conteúdo de ajustes"},
    ]));
    await details.click();
    await expect(details).toHaveAttribute("aria-selected","true");
    await expect(container.getByText("Conteúdo de detalhes")).toBeVisible();
    await expect(overview).toHaveAttribute("aria-selected","false");
    await page.locator("#property-Tabs-defaultValue").fill("settings");
    await expect(container.getByRole("tab",{name:"Configurações"})).toHaveAttribute("aria-selected","true");
    await page.locator("#property-Tabs-value").fill("overview");
    await expect(overview).toHaveAttribute("aria-selected","true");
    await withinViewport(page,overview);
    // Does not exercise real Pi bindings or duplicate IDs.
  },
  "tabs.disabled":async page=>{
    const container=await preview(page,"Tabs");
    await page.locator("#property-Tabs-tabs").fill(JSON.stringify([
      {label:"Visão geral",value:"overview",content:"Resumo"},
      {label:"Detalhes",value:"details",disabled:true,content:"Detalhes protegidos"},
      {label:"Configurações",value:"settings",content:"Ajustes"},
    ]));
    const blocked=container.getByRole("tab",{name:"Detalhes"});
    await expect(blocked).toBeDisabled();
    const settings=container.getByRole("tab",{name:"Configurações"});
    await settings.click();
    await expect(settings).toHaveAttribute("aria-selected","true");
    await expect(blocked).not.toHaveAttribute("aria-selected","true");
    await page.locator("#property-Tabs-disabled").selectOption("true");
    await expect(container.getByRole("tab",{name:"Visão geral"})).toBeDisabled();
    await expect(blocked).toBeDisabled();
    await expect(settings).toBeDisabled();
    // Keyboard accessibility and persistence are separate review requirements.
  },
};
for(const entry of registered) {
  if(!(entry.recipe in semanticTestRecipes)||!recipes[entry.recipe!])
    throw new Error("No reviewed Playwright implementation for "+entry.component+"/"+entry.id);
}

test.afterEach(async({page},info)=>{
  const entry=registered.find(item=>info.title==="semantic: "+item.component+"/"+item.id);
  if(!entry)return;
  const directory=join("reports/semantic-tests",info.project.name);
  mkdirSync(directory,{recursive:true});
  const digest=createHash("sha256").update(readFileSync(entry.source)).digest("hex");
  writeFileSync(join(directory,entry.component+"-"+entry.id+".json"),JSON.stringify({
    schemaVersion:1,component:entry.component,testId:entry.id,
    recipe:entry.recipe,source:entry.source,sourceSha256:digest,
    capabilities:entry.capabilities,coverage:entry.coverage,
    sourceRevision:process.env.GITHUB_SHA??null,
    project:info.project.name,pageUrl:page.url(),status:info.status,expectedStatus:info.expectedStatus,
    retry:info.retry,errors:info.errors.map(error=>error.message??"unknown"),
    certification:"not-granted",
  },null,2)+"\n");
});

for(const entry of registered) {
  test("semantic: "+entry.component+"/"+entry.id,async({page})=>{
    await recipes[entry.recipe!](page);
  });
}
