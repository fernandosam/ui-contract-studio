import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const fixture = JSON.parse(read("tests/fixtures/theme-visual-tokens.json"));
const registry = JSON.parse(read("src/ui-theme/themes.json"));
const css = read("src/globals.css");
const normalize = value => value.replace(/-?(?:\d+\.\d+|\d+|\.\d+)/g, match =>
  String(Number(match))).replace(/\s+/g, "");

function declarations(selector) {
  const body = css.match(selector)?.[1];
  assert.ok(body, "Theme CSS rule missing: " + selector);
  return new Map([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) =>
    [name, value.trim()]));
}

test("E06: visual token references match the approved stylesheet in both modes", () => {
  assert.equal(fixture.schemaVersion, 1);
  assert.deepEqual(Object.keys(fixture.tokens).sort(), ["dark", "light"]);
  const [id, version] = fixture.theme.split("@");
  const registered = registry.themes.find(theme => theme.id === id && theme.version === version);
  assert.ok(registered, "Screenshot baseline must refer to an admitted version");
  const light = declarations(/:root,\s*\.light-theme\s*\{([^}]+)\}/);
  const dark = declarations(/\.dark-theme\s*\{([^}]+)\}/);
  for (const mode of ["light", "dark"]) {
    assert.ok(registered.modes.includes(mode));
    const tokens = fixture.tokens[mode];
    assert.ok(Object.keys(tokens).length >= 7, "Insufficient baseline coverage");
    for (const [token, expected] of Object.entries(tokens)) {
      assert.match(token, /^--[a-z][a-z-]*$/);
      const actual = (mode === "dark" ? dark.get(token) ?? light.get(token) : light.get(token));
      assert.ok(actual, mode + ": CSS token missing: " + token);
      assert.equal(normalize(actual), normalize(expected), mode + ": changed approved visual token " + token);
    }
  }
});

test("E06: browser regression matrix is wired into the existing focused workflow", () => {
  const spec = read("tests/e2e/theme-visual-regression.spec.ts");
  const workflow = read(".github/workflows/quality.yml");
  for (const screen of ["explorador-primitivos", "explorador-compostos", "explorador-exemplos"]) {
    assert.ok(spec.includes(screen), "Missing surface: " + screen);
  }
  for (const marker of ["light", "dark", "mobile", "desktop", ".equals(", "testInfo.attach("]) {
    assert.ok(spec.includes(marker), "Missing visual assertion/evidence: " + marker);
  }
  assert.ok(workflow.includes("tests/e2e/theme-visual-regression.spec.ts"));
  assert.ok(workflow.includes("test-results/"), "Playwright screenshot evidence must be retained");
});
