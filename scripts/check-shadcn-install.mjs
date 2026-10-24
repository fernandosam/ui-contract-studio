#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { items, plan, projectRoot } from "./shadcn-plan.mjs";

const strict = process.argv.includes("--strict");
const silent = process.argv.includes("--silent");
const config = JSON.parse(readFileSync(resolve(projectRoot, "components.json"), "utf8"));
const errors = [];
const expectedAliases = { components: "@/components", ui: "@/components/ui", utils: "@/lib/utils", lib: "@/lib", hooks: "@/hooks" };
for (const [name, target] of Object.entries(expectedAliases)) {
  if (config.aliases?.[name] !== target) errors.push(`Alias ${name} deve ser ${target}`);
}
if (config.tailwind?.css !== "src/globals.css") errors.push("A fonte de verdade do tema deve ser src/globals.css");
if (Object.keys(config.registries ?? {}).length) errors.push("Registries externos não são permitidos neste projeto.");
if (plan.primitiveBase !== "base-ui") errors.push("Plano sem base de primitivas coerente (base-ui).");
if (new Set(items.map(item => item.name)).size !== items.length) errors.push("Componente duplicado no plano.");

const status = items.map(item => ({...item, installed: existsSync(resolve(projectRoot, `src/components/ui/${item.name}.tsx`))}));
if (!silent) {
  for (const group of plan.groups) {
    const selected = status.filter(item => item.group === group.id);
    console.log(`\n${group.label} (${selected.filter(i=>i.installed).length}/${selected.length})`);
    for (const item of selected) console.log(`  ${item.installed ? "✓" : "○"} ${item.name} — ${item.integration}`);
  }
  console.log(`\nInstalação oficial: ${status.filter(i => i.installed).length}/${items.length}. As primitivas não são contratos json-render automáticos.`);
}
if (strict) for(const item of status.filter(item=>!item.installed)) errors.push(`${item.name}: arquivo oficial ausente (src/components/ui/${item.name}.tsx)`);
if (errors.length) {
  for (const error of errors) console.error(`✗ ${error}`);
  process.exitCode = 1;
} else if (!silent) console.log("✓ Configuração shadcn verificada.");
export { status };
