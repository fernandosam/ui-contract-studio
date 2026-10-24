import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));
export const plan = JSON.parse(readFileSync(resolve(projectRoot, "shadcn-plan.json"), "utf8"));
export const items = plan.groups.flatMap(group => group.items.map(item => ({ ...item, group: group.id })));
export const groups = new Set(plan.groups.map(group => group.id));

export function requiredItems(group) {
  if (group && !groups.has(group)) {
    throw new Error(`Grupo desconhecido: ${group}. Use: ${[...groups].join(", ")}`);
  }
  return group ? items.filter(item => item.group === group) : items;
}
