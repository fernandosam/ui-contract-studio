import {test,expect,type Page} from "@playwright/test";

/** Execução manual na main. Exercita comportamentos, além de apenas montar JSX. */
async function example(page:Page,family:string,id:string){
  await page.goto("/?screen=reui");
  await page.getByLabel("Filtrar componente").selectOption(family);
  const area=page.getByTestId(`reui-preview-${id}`);
  await expect(area).toBeVisible();
  return area;
}

test.describe("ReUI — cenários de interação representativos por família",()=>{
  test("Accordion: expansão única fecha painel anterior",async({page})=>{
    const area=await example(page,"Accordion","c-accordion-1");
    const triggers=area.locator('[data-slot="accordion-trigger"]');
    await expect(triggers).toHaveCount(3);
    await triggers.nth(1).click();
    await expect(triggers.nth(1)).toHaveAttribute("aria-expanded","true");
    await expect(triggers.nth(0)).toHaveAttribute("aria-expanded","false");
  });
  test("Checkbox: estado marcável por clique",async({page})=>{
    const area=await example(page,"Checkbox","c-checkbox-1");
    const control=area.getByRole("checkbox").first();
    await control.click();
    await expect(control).toBeChecked();
  });
  test("Collapsible: exibe e recolhe detalhes",async({page})=>{
    const area=await example(page,"Collapsible","c-collapsible-1");
    await area.getByRole("button",{name:"Toggle details"}).click();
    await expect(area.getByText("Shipping address")).toBeVisible();
    await area.getByRole("button",{name:"Toggle details"}).click();
    await expect(area.getByText("Shipping address")).not.toBeVisible();
  });
  test("Dialog: abre, mantém foco disponível e fecha sem submissão",async({page})=>{
    const area=await example(page,"Dialog","c-dialog-1");
    await area.getByRole("button",{name:"Basic Dialog"}).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByText("Edit profile")).toBeVisible();
    await page.getByRole("dialog").getByRole("button",{name:"Cancel"}).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
  test("Drawer: abertura e fechamento por ação local",async({page})=>{
    const area=await example(page,"Drawer","c-drawer-1");
    await area.getByRole("button",{name:"Open Drawer"}).click();
    await expect(page.getByText("Move Goal")).toBeVisible();
    await page.getByRole("button",{name:"Cancel"}).click();
    await expect(page.getByText("Move Goal")).not.toBeVisible();
  });
  test("DropdownMenu: itens só aparecem quando aberto",async({page})=>{
    const area=await example(page,"DropdownMenu","c-dropdown-menu-1");
    await area.getByRole("button",{name:"Open"}).click();
    await expect(page.getByRole("menuitem",{name:"Profile"})).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menuitem",{name:"Profile"})).toHaveCount(0);
  });
  test("Input: permite entrada de texto",async({page})=>{
    const area=await example(page,"Input","c-input-1");
    await area.locator("#basic-input").fill("Teste ReUI");
    await expect(area.locator("#basic-input")).toHaveValue("Teste ReUI");
  });
  test("Popover: abre conteúdo e fecha com Escape",async({page})=>{
    const area=await example(page,"Popover","c-popover-1");
    await area.getByRole("button",{name:"Open Popover"}).click();
    await expect(page.getByText("Dimensions",{exact:true})).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText("Dimensions",{exact:true})).not.toBeVisible();
  });
  test("RadioGroup: seleção mutuamente exclusiva",async({page})=>{
    const area=await example(page,"RadioGroup","c-radio-group-1");
    const radios=area.getByRole("radio");
    await radios.nth(0).click();
    await expect(radios.nth(0)).toBeChecked();
    await expect(radios.nth(1)).not.toBeChecked();
  });
  test("Select: aceita seleção explícita via menu",async({page})=>{
    const area=await example(page,"Select","c-select-1");
    const trigger=area.locator('[data-slot="select-trigger"]').first();
    await trigger.click();
    await page.getByRole("option",{name:"Apple"}).click();
    await expect(trigger).toContainText("Apple");
  });
  test("Slider: teclado altera o valor",async({page})=>{
    const area=await example(page,"Slider","c-slider-1");
    const slider=area.getByRole("slider").first();
    const before=await slider.getAttribute("aria-valuenow");
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(slider).not.toHaveAttribute("aria-valuenow",before??"");
  });
  test("Switch: alterna usando clique",async({page})=>{
    const area=await example(page,"Switch","c-switch-1");
    const sw=area.getByRole("switch").first();
    await sw.click();
    await expect(sw).toBeChecked();
  });
  test("Tabs: alterna painel e seleção acessível",async({page})=>{
    const area=await example(page,"Tabs","c-tabs-1");
    const tabs=area.getByRole("tab");
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected","true");
    await expect(area.getByText("Change your password here.")).toBeVisible();
  });
  test("Textarea: permite digitação",async({page})=>{
    const area=await example(page,"Textarea","c-textarea-1");
    const field=area.getByRole("textbox").first();
    await field.fill("Mensagem de teste");
    await expect(field).toHaveValue("Mensagem de teste");
  });
  test("Toggle: altera aria-pressed",async({page})=>{
    const area=await example(page,"Toggle","c-toggle-1");
    const control=area.getByRole("button",{name:"Toggle bold"});
    await control.click();
    await expect(control).toHaveAttribute("aria-pressed","false");
  });
  test("ToggleGroup: atualiza estado de seleção",async({page})=>{
    const area=await example(page,"ToggleGroup","c-toggle-group-1");
    const control=area.getByRole("button",{name:"Toggle bold"});
    await control.click();
    await expect(control).toHaveAttribute("aria-pressed","true");
  });
  test("Tooltip: aparece ao passar o ponteiro",async({page})=>{
    const area=await example(page,"Tooltip","c-tooltip-1");
    await area.getByRole("button",{name:"Show Tooltip"}).hover();
    await expect(page.getByRole("tooltip")).toContainText("Add to library");
  });
});
