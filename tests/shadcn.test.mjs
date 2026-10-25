import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { plan, items, projectRoot } from "../scripts/shadcn-plan.mjs";

const read = (path) => readFileSync(resolve(projectRoot,path),"utf8");
const config = JSON.parse(read("components.json"));

test("plano inclui 50 componentes oficiais com fundamentos ampliados e treze adicionais", () => {
  assert.equal(items.length, 50);
  assert.equal(new Set(items.map(x=>x.name)).size,50);
  assert.deepEqual(plan.groups.map(g=>[g.id,g.items.length]),[["foundation",25],["very-high",3],["high",3],["medium",7],["upstream-simple",4],["upstream-admitted",8]]);
  for(const name of ["button","card","input","table","field","popover","select","badge","checkbox","sidebar","calendar","combobox","command","breadcrumb","input-group","resizable","drawer","collapsible","toggle","toggle-group","button-group","carousel","accordion","tabs","radio-group","separator","alert","spinner","label","textarea"]) assert.ok(items.some(item=>item.name===name), name);
});

test("shadcn CLI escreve fora de ui-catalog, com aliases corretos",()=>{
  assert.equal(config.aliases.components,"@/components");
  assert.equal(config.aliases.ui,"@/components/ui");
  assert.equal(config.aliases.hooks,"@/hooks");
  assert.equal(config.aliases.utils,"@/lib/utils");
  assert.equal(config.tailwind.css,"src/globals.css");
  assert.deepEqual(config.registries,{});
  assert.ok(existsSync(resolve(projectRoot,"src/components/ui/.gitkeep")));
});

test("instalação CLI é separada de registro json-render",()=>{
  const base = read("src/ui-catalog/catalog.ts");
  const ext = read("src/ui-catalog/extensions/catalog.ts");
  assert.match(base,/export const playgroundDefinitions = \{/);
  assert.match(base,/\.\.\.extensionDefinitions/);
  assert.match(ext,/export const extensionDefinitions/);
  for(const item of items) if(item.integration==="existing-contract") assert.match(base,new RegExp(`^  ${item.catalogContract}: \\{`,"m"));
  assert.match(read("AGENTS.md"),/admission with a Zod schema \+ React component \+ registry/);
  assert.match(read("AGENTS.pt-BR.md"),/admissão com schema Zod \+ componente React \+ registry/);
});

test("instalador tem prévia, não usa overwrite e protege os arquivos",()=>{
  const src=read("scripts/install-shadcn.mjs");
  assert.match(src,/--dry-run/);
  assert.doesNotMatch(src,/"--overwrite"/);
  assert.match(src,/writeFileSync\(resolve\(projectRoot,path\),originals\[path\]\)/);
  assert.match(src,/src\/components\/ui\//);
});

test("status funciona sem npm e informa todos pendentes ou instalados",()=>{
  const r=spawnSync(process.execPath,["scripts/check-shadcn-install.mjs","--silent"],{cwd:projectRoot,encoding:"utf8"});
  assert.equal(r.status,0,r.stderr);
  const list=spawnSync(process.execPath,["scripts/install-shadcn.mjs","--list"],{cwd:projectRoot,encoding:"utf8"});
  assert.equal(list.status,0,list.stderr);
  assert.match(list.stdout,/sidebar, calendar, combobox/);
});

test("políticas não permitem JSX de telas fora do catálogo",()=>{
  const rule=read("AGENTS.md"),check=read("scripts/check-boundaries.ts");
  assert.match(rule,/Arbitrary JSX\/HTML is forbidden in screens/);
  assert.match(read("AGENTS.pt-BR.md"),/Proibido escrever JSX\/HTML arbitrário nas telas/);
  assert.match(check,/components\/ui\//);
  assert.match(check,/ui-catalog\/extensions\/components\//);
});
