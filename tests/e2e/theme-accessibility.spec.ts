import {test,expect,type Page} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function openButton(page:Page) {
  await page.goto("/?screen=explorador-primitivos");
  await page.getByLabel("Buscar componente").fill("Button");
  await page.locator('[aria-label="Componentes registrados"] button[aria-label="Button"]').click();
  await expect(page.getByTestId("catalog-live-preview")).toBeVisible();
}
for (const mode of ["light","dark"] as const) {
  test("E06: "+mode+" interactive states, real preview contrast and persistence",async({page})=>{
    await openButton(page);
    const selector=page.getByTestId("preview-theme-selector").first();
    const button=page.getByTestId("catalog-live-preview").getByRole("button",{name:"Testar ação local"});
    await selector.selectOption("studio@1.0.0:"+mode);
    await expect(page.locator("html")).toHaveClass(new RegExp(mode+"-theme"));
    expect(await page.locator("html").evaluate(el=>getComputedStyle(el).colorScheme)).toBe(mode);
    await expect(button).toBeEnabled();

    const before=await button.evaluate(el=>getComputedStyle(el).backgroundColor);
    await button.hover();
    await expect.poll(()=>button.evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe(before);

    // Keyboard modality: focus-visible ring must be visibly present on host selector.
    await page.keyboard.press("Tab");
    await selector.focus();
    await expect.poll(()=>selector.evaluate(el=>parseFloat(getComputedStyle(el).outlineWidth))).toBeGreaterThan(0);

    await page.getByLabel(/^disabled · boolean/).selectOption("true");
    await expect(button).toBeDisabled();
    await selector.selectOption("studio@1.0.0:"+(mode==="light"?"dark":"light"));
    await expect(button).toBeDisabled();
    await selector.selectOption("studio@1.0.0:"+mode);
    await expect(page.locator("html")).toHaveClass(new RegExp(mode+"-theme"));

    const axe=await new AxeBuilder({page}).include('[data-testid="catalog-live-preview"]')
      .withRules(["color-contrast"]).analyze();
    expect(axe.violations,JSON.stringify(axe.violations,null,2)).toEqual([]);
    await page.reload();
    await expect(page.getByTestId("preview-theme-selector").first())
      .toHaveValue("studio@1.0.0:"+mode);
  });
}
test("E06: no page overflow or inaccessible theme selector across viewports",async({page})=>{
  for(const width of [390,600,800,1440]){
    await page.setViewportSize({width,height:850});
    for(const screen of ["explorador-primitivos","explorador-compostos","explorador-exemplos"]){
      await page.goto("/?screen="+screen);
      const selector=page.getByTestId("preview-theme-selector").first();
      await expect(selector).toBeVisible();
      for(const mode of ["light","dark"]){
        await selector.selectOption("studio@1.0.0:"+mode);
        await expect(page.locator("html")).toHaveClass(new RegExp(mode+"-theme"));
        const rect=await selector.boundingBox();
        expect(rect,screen+" "+mode+" @"+width+"px").not.toBeNull();
        expect(rect!.width).toBeGreaterThan(0);
        expect(rect!.x).toBeGreaterThanOrEqual(-1);
        expect(rect!.x+rect!.width).toBeLessThanOrEqual(width+1);
        const overflow=await page.evaluate(()=>
          document.documentElement.scrollWidth-document.documentElement.clientWidth);
        expect(overflow,screen+" "+mode+" @"+width+"px").toBeLessThanOrEqual(1);
      }
    }
  }
});
