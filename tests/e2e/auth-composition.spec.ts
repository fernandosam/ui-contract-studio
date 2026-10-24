import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const blocks = (JSON.parse(readFileSync("src/ui-catalog/block-source-inventory.json", "utf8")) as {
  blocks: Array<{name:string;family:string}>
}).blocks.filter(b => b.family === "login" || b.family === "signup");

for (const block of blocks) {
  test(`@auth-composition ${block.name}: dedicated layout, controls and responsive grid`, async ({page}, info) => {
    const mobile = info.project.name === "mobile";
    await page.setViewportSize(mobile ? {width:390,height:844} : {width:1440,height:900});
    await page.goto(`/?screen=${block.family === "login" ? "blocos-login" : "blocos-signup"}`);
    const root = page.locator(`[data-shadcn-block="${block.name}"]`);
    const layout = root.locator(`[data-auth-layout="${block.name}"]`);
    await expect(layout).toBeVisible();
    await expect(layout.locator("form")).toHaveCount(1);
    await expect(layout.getByRole("button").first()).toBeVisible();
    const fields = layout.locator('input:not([type="hidden"])');
    expect(await fields.count()).toBeGreaterThan(0);
    const slug = Number(block.name.split("-")[1]);
    const split = [2,4,5].includes(slug);
    const panel = layout.locator('div[aria-hidden="true"].bg-muted');
    await expect(panel).toHaveCount(split ? 1 : 0);
    if (split) {
      if (mobile) await expect(panel).toBeHidden();
      else await expect(panel).toBeVisible();
    }
    const fieldBoxes = await fields.evaluateAll(list => list.map(el => {
      const r = el.getBoundingClientRect();
      return {x:r.left,right:r.right,width:r.width,height:r.height};
    }));
    for(const rect of fieldBoxes) {
      expect(rect.width).toBeGreaterThan(90);
      expect(rect.height).toBeGreaterThanOrEqual(30);
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.right).toBeLessThanOrEqual(mobile ? 392 : 1442);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
}
