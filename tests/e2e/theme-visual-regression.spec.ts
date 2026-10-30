import {expect, test, type Page} from "@playwright/test";
import {readFileSync} from "node:fs";

// E06: real browser snapshots are compared within a deterministic A -> B -> A
// cycle. Cross-commit pixel fidelity is NOT claimed without approved PNG goldens.
type Mode = "light" | "dark";
const baseline = JSON.parse(readFileSync(new URL("../fixtures/theme-visual-tokens.json", import.meta.url), "utf8")) as {
  schemaVersion: number;
  theme: string;
  tokens: Record<Mode, Record<string, string>>;
};
const surfaces = [
  {id: "primitive-button", screen: "explorador-primitivos", selected: "Button"},
  {id: "composite-dashboard", screen: "explorador-compostos", selected: "Dashboard01"},
  {id: "json-example", screen: "explorador-exemplos", selected: null},
] as const;

// Browsers may canonicalize 1.0000 -> 1 and whitespace inside OKLCH values.
const normalized = (value: string) => value.replace(/-?(?:\d+\.\d+|\d+|\.\d+)/g, match =>
  String(Number(match))).replace(/\s+/g, "");

async function openSurface(page: Page, surface: (typeof surfaces)[number]) {
  await page.goto("/?screen=" + surface.screen);
  if (surface.selected) {
    await page.getByLabel("Buscar componente").fill(surface.selected);
    if (surface.screen === "explorador-primitivos") {
      await page.locator('[aria-label="Componentes registrados"] button[aria-label="Button"]').click();
    } else {
      await page.getByRole("button", {name: surface.selected, exact: true}).click();
    }
  }
  await expect(page.getByTestId("catalog-live-preview")).toBeVisible();
  await expect(page.getByTestId("preview-theme-selector").first()).toBeVisible();
  await page.evaluate(async () => { await document.fonts.ready; });
}

for (const surface of surfaces) {
  test("E06 visual regression: " + surface.id + " light/dark round-trip", async ({page}, testInfo) => {
    const mobile = testInfo.project.name === "mobile";
    await page.setViewportSize(mobile ? {width: 390, height: 844} : {width: 1280, height: 900});
    await openSurface(page, surface);
    const selector = page.getByTestId("preview-theme-selector").first();
    const preview = page.getByTestId("catalog-live-preview");

    async function capture(mode: Mode, attach: boolean) {
      await selector.selectOption(baseline.theme + ":" + mode);
      await expect(page.locator("html")).toHaveClass(new RegExp(mode + "-theme"));
      await expect.poll(() => page.locator("html").evaluate(el => getComputedStyle(el).colorScheme)).toBe(mode);
      const expected = baseline.tokens[mode];
      const actual = await page.locator("html").evaluate((el, keys) => {
        const style = getComputedStyle(el);
        return Object.fromEntries(keys.map(key => [key, style.getPropertyValue(key).trim()]));
      }, Object.keys(expected));
      for (const [key, value] of Object.entries(expected)) {
        expect(normalized(actual[key]), surface.id + " " + mode + " " + key).toBe(normalized(value));
      }
      const screenshot = await preview.screenshot({animations: "disabled", caret: "hide"});
      if (attach) {
        await testInfo.attach("E06-" + surface.id + "-" + mode, {body: screenshot, contentType: "image/png"});
      }
      return screenshot;
    }

    const light = await capture("light", true);
    const dark = await capture("dark", true);
    expect(light.equals(dark), surface.id + ": modes should paint differently").toBe(false);
    const lightAgain = await capture("light", false);
    expect(lightAgain.equals(light), surface.id + ": mode toggling must restore pixels").toBe(true);
    // Captures are review evidence, not an independent cross-commit golden baseline
    // and not a Pi/Admission Engine certification.
  });
}
