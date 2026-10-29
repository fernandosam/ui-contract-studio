import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {resolveTheme, validateThemeRegistry} from "../src/ui-theme/theme-policy.mjs";
import {fingerprintTheme, verifyThemeLock} from "../scripts/lib/theme-lock.mjs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const manifest = JSON.parse(read("src/ui-theme/themes.json"));
const lock = JSON.parse(read("src/ui-theme/themes.lock.json"));
const clone = value => structuredClone(value);

test("E06: host-owned themes are versioned and refer only to existing CSS classes", () => {
  const registry = validateThemeRegistry(manifest);
  assert.equal(registry.defaultTheme.id, "studio");
  assert.equal(registry.defaultTheme.version, "1.0.0");
  assert.equal(resolveTheme(registry.defaultTheme, manifest).className, "dark-theme");
  assert.equal(resolveTheme({id:"studio",version:"1.0.0",mode:"light"}, manifest).className, "light-theme");
  assert.equal(Object.isFrozen(registry.themes[0].tokens), true);
  const css = read("src/globals.css");
  for (const selector of [":root, .light-theme", ".dark-theme"]) assert.ok(css.includes(selector), selector);
  for (const variable of ["--background:", "--primary:", "--border:", "--shadow-sm:", "--radius:"]) {
    assert.ok(css.includes(variable), variable);
  }
  assert.match(read("src/ui-runtime/layout.tsx"), /resolveTheme/);
});

test("E06: unknown fields, CSS strings and unapproved design choices fail closed", () => {
  for (const attack of [
    value => {value.css = "body{display:none}";},
    value => {value.themes[0].css = "background:url(https://evil.example)";},
    value => {value.themes[0].className = "fixed inset-0";},
    value => {value.themes[0].tokens.style = {color:"red"};},
    value => {value.themes[0].tokens.color = "oklch(0 0 0)";},
    value => {value.themes[0].tokens.density = "calc(100vh)";},
    value => {value.themes[0].tokens.radius = "var(--user)";},
    value => {value.themes[0].modes.push("system");},
    value => {value.themes.push(clone(value.themes[0]));},
    value => {value.themes[0].version = "1.0.0-preview";},
    value => {value.defaultTheme.version = "2.0.0";},
    value => {value.schemaVersion = 2;},
  ]) {
    const candidate=clone(manifest); attack(candidate);
    assert.throws(() => validateThemeRegistry(candidate));
  }
  for (const selection of [
    {id:"studio",version:"99.0.0",mode:"dark"},
    {id:"missing",version:"1.0.0",mode:"dark"},
    {id:"studio",version:"1.0.0",mode:"dark",style:"color:red"},
    {id:"studio",version:"1.0.0",mode:"dark",className:"evil"},
    {id:"studio",version:"1.0.0",mode:"dark",css:"url(//evil)"},
    {id:"studio",version:"1.0.0",mode:"url(javascript:alert(1))"},
  ]) assert.throws(() => resolveTheme(selection, manifest));
});

test("E06: lock detects same-version drift and refuses mutation or deletion versus base", () => {
  assert.equal(verifyThemeLock(manifest, lock).checked, 1);
  const changed = clone(manifest);
  changed.themes[0].modes.reverse();
  assert.notEqual(fingerprintTheme(changed.themes[0]), lock.entries[0].fingerprint);
  assert.throws(() => verifyThemeLock(changed, lock), /Fingerprint/);
  const changedLock = clone(lock);
  changedLock.entries[0].fingerprint = fingerprintTheme(changed.themes[0]);
  assert.throws(() => verifyThemeLock(changed, changedLock, manifest), /não pode ser editada/);
  const newer = clone(manifest);
  newer.themes.push({...clone(newer.themes[0]), version:"1.1.0"});
  newer.defaultTheme.version = "1.1.0";
  const newerLock = clone(lock);
  newerLock.entries.push({id:"studio",version:"1.1.0",fingerprint:fingerprintTheme(newer.themes[1])});
  assert.equal(verifyThemeLock(newer, newerLock, manifest).checked, 2);
  assert.throws(() => verifyThemeLock(manifest, lock, newer), /não pode ser editada/);
});

test("E06: standalone offline gate succeeds on committed manifest and lock", () => {
  const result=spawnSync(process.execPath,["scripts/check-versioned-themes.mjs"],{
    cwd:new URL("../",import.meta.url),env:{...process.env,THEME_BASE_REF:""},encoding:"utf8"
  });
  assert.equal(result.status,0,result.stderr);
});
