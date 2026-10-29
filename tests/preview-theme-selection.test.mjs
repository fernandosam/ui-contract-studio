import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  PREVIEW_THEME_STORAGE_KEY, listPreviewThemes, restorePreviewTheme,
  selectPreviewTheme, serializePreviewTheme,
} from "../src/ui-theme/preview-theme-policy.mjs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const manifest = JSON.parse(read("src/ui-theme/themes.json"));

test("E06 preview: options are derived only from registered versions and modes", () => {
  const options = listPreviewThemes(manifest);
  assert.deepEqual(options.map(option => option.value), [
    "studio@1.0.0:light", "studio@1.0.0:dark",
  ]);
  assert.equal(Object.isFrozen(options), true);
  assert.equal(Object.isFrozen(options[0].selection), true);
  assert.equal(selectPreviewTheme(options[0].value, manifest).className, "light-theme");
  assert.equal(selectPreviewTheme(options[1].value, manifest).className, "dark-theme");
});

test("E06 preview: reject unknown versions, arbitrary CSS, malformed or forged values", () => {
  for (const attack of [
    "studio@1.0.1:light", "studio@1.0.0:system", "studio@1.0.0:light;display:none",
    "evil@1.0.0:light", "light-theme", "{\"style\":\"color:red\"}",
    "", null, {}, ["studio@1.0.0:light"],
  ]) assert.throws(() => selectPreviewTheme(attack, manifest));
  assert.throws(() => serializePreviewTheme({
    id:"studio",version:"1.0.0",mode:"dark",css:"*{display:none}",
  },manifest));
});

test("E06 preview: storage is versioned, validated and falls back safely", () => {
  assert.equal(PREVIEW_THEME_STORAGE_KEY, "ui-contract-studio-preview-theme");
  const saved = serializePreviewTheme({id:"studio",version:"1.0.0",mode:"light"},manifest);
  assert.deepEqual(JSON.parse(saved), {id:"studio",version:"1.0.0",mode:"light"});
  assert.equal(restorePreviewTheme(saved,manifest,"dark").mode, "light");
  for (const stored of [
    "not JSON", "{}", "{\"id\":\"studio\",\"version\":\"2.0.0\",\"mode\":\"dark\"}",
    "{\"id\":\"studio\",\"version\":\"1.0.0\",\"mode\":\"light\",\"style\":\"evil\"}",
    "x".repeat(201),
  ]) {
    assert.equal(restorePreviewTheme(stored,manifest,"dark").mode, "dark");
    assert.equal(restorePreviewTheme(stored,manifest,"light").mode, "light");
  }
  assert.equal(restorePreviewTheme(null,manifest).mode, "dark");
});

test("E06 preview: all intended host surfaces share selection without changing JSON specs", () => {
  for (const path of [
    "src/ui-runtime/catalog-explorer.tsx",
    "src/ui-runtime/reui-composite-explorer.tsx",
    "src/ui-runtime/admission-explorer.tsx",
    "src/ui-runtime/typed-confirmation-pilot.tsx",
    "src/ui-runtime/app.tsx",
    "src/ui-runtime/requirements-wizard.tsx",
    "src/ui-runtime/pattern-wizard.tsx",
    "src/ui-runtime/tree-patch-workbench.tsx",
  ]) assert.match(read(path), /<PreviewThemeSelector\b/, path);
  assert.match(read("src/ui-runtime/layout.tsx"), /<PreviewThemeProvider>/);
  const ui = read("src/ui-theme/preview-theme.tsx");
  assert.match(ui, /classList\.add\(selection\.className\)/);
  assert.match(ui, /localStorage\.setItem\(PREVIEW_THEME_STORAGE_KEY/);
  assert.doesNotMatch(ui, /setProperty|innerHTML|cssText|style=|eval\(/);
  assert.doesNotMatch(read("src/ui-runtime/spec-screen.tsx"), /PreviewThemeSelector|themeSelection|themeId/);
});
