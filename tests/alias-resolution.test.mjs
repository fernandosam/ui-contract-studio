import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
test("tsx e Vite compartilham o alias @/", () => {
  const rootConfig = JSON.parse(readFileSync(resolve(root, "tsconfig.json"), "utf8"));
  const appConfig = JSON.parse(readFileSync(resolve(root, "tsconfig.app.json"), "utf8"));
  assert.deepEqual(rootConfig.compilerOptions.paths["@/*"], ["./src/*"]);
  assert.deepEqual(appConfig.compilerOptions.paths["@/*"], ["./src/*"]);
});
test("validação do catálogo não carrega implementações React do shadcn", () => {
  const code = readFileSync(resolve(root, "scripts/check-ui-catalog.ts"), "utf8");
  assert.ok(code.includes("declaredObjectKeys("));
  assert.doesNotMatch(code, /import\s*\{[^}]*componentImplementations[^}]*\}\s*from/);
  assert.doesNotMatch(code, /import\s*\{[^}]*extensionImplementations[^}]*\}\s*from/);
});
