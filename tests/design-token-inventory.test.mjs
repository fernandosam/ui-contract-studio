import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = path => readFileSync(resolve(root, path), "utf8");
const cli = resolve(root, "scripts/inventory-design-tokens.mjs");
const snapshot = read("docs/design-token-inventory.json");
const run = (...args) => execFileSync(process.execPath, [cli, ...args], { cwd: root, encoding: "utf8" });
const inventory = JSON.parse(snapshot);

test("E06 snapshot is deterministic and synchronized with CSS and components", () => {
  assert.equal(run(), snapshot, "run node scripts/inventory-design-tokens.mjs --write");
  const checked = spawnSync(process.execPath, [cli, "--check"], { cwd: root, encoding: "utf8" });
  assert.equal(checked.status, 0, checked.stderr || checked.stdout);
});

test("E06 inventories complete light/dark semantic colors and separate local values", () => {
  const semantic = inventory.colors.semantic;
  assert.equal(Object.keys(semantic).length, 32);
  assert.deepEqual(Object.keys(inventory.colors.local).sort(), ["--success", "--warning"]);
  for (const [name, data] of Object.entries(semantic)) {
    assert.match(data.light, /^oklch\(/, name);
    assert.match(data.dark, /^oklch\(/, name);
    assert.equal(inventory.colors.tailwindAliases[data.tailwindAlias], `var(${name})`);
  }
  assert.equal(inventory.colors.tailwindAliases["--color-success"], undefined);
});

test("E06 covers seven categories without defining a new density contract", () => {
  for (const name of ["colors", "typography", "spacing", "borders", "radii", "shadows", "density"]) {
    assert.ok(inventory[name] && Object.keys(inventory[name]).length, name);
  }
  assert.equal(Object.keys(inventory.shadows).length, 8);
  assert.deepEqual(inventory.spacing.declarativeGaps, { none: "0", sm: ".625rem", md: "1rem", lg: "1.5rem" });
  assert.equal(inventory.radii.base, "0.5rem");
  assert.equal(inventory.density.globalDensityToken, null);
  assert.deepEqual(inventory.density.localResponsiveMaxWidthsPx, [639, 850, 520]);
  assert.equal(inventory.spacing.card.default, "--spacing(6)");
  assert.equal(inventory.spacing.card.sm, "--spacing(4)");
});

test("E06 documentation traces all semantic names and non-goals", () => {
  const pt = read("docs/design-token-inventory.pt-BR.md");
  const en = read("docs/design-token-inventory.md");
  for (const name of Object.keys(inventory.colors.semantic)) {
    assert.ok(pt.includes(`\`${name}\``), `Portuguese inventory missing ${name}`);
  }
  for (const name of ["--success", "--warning", "--radius", "--shadow", "--font-sans"]) {
    assert.ok(pt.includes(name), name);
  }
  for (const doc of [pt, en]) {
    assert.match(doc, /semantic:check/);
    assert.match(doc, /semantic:report/);
    assert.match(doc, /Zod/);
    assert.match(doc, /design-token-inventory\.json/);
  }
});
