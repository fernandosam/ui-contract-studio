#!/usr/bin/env node
/**
 * Instala APENAS as primitivas aprovadas do registro oficial shadcn/ui.
 * Nunca adiciona contratos ao json-render automaticamente.
 * A documentação e a política do Pi continuam obrigatórias.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { plan, projectRoot, requiredItems } from "./shadcn-plan.mjs";

const argv = process.argv.slice(2);
const mode = argv.includes("--apply") ? "apply" : argv.includes("--dry-run") ? "dry-run" : "list";
if (argv.includes("--apply") && argv.includes("--dry-run")) throw new Error("Use --apply OU --dry-run.");
const groupArg = argv.find(x=>x.startsWith("--group="));
const selected = requiredItems(groupArg?.split("=")[1]);
const names = selected.filter(item => !existsSync(resolve(projectRoot,`src/components/ui/${item.name}.tsx`))).map(item=>item.name);
const config = JSON.parse(readFileSync(resolve(projectRoot,"components.json"),"utf8"));
if (config.aliases?.ui !== "@/components/ui") throw new Error("components.json: alias ui deve ser @/components/ui.");
if (Object.keys(config.registries ?? {}).length !== 0) throw new Error("Somente registry oficial autorizado.");

console.log(`shadcn/ui | base desejada: ${plan.primitiveBase} | modo: ${mode}`);
for (const group of plan.groups) {
  const groupItems=selected.filter(item=>item.group===group.id);
  if(groupItems.length) console.log(`${group.label}: ${groupItems.map(x=>x.name).join(", ")}`);
}
if (mode==="list") {
  console.log("\nPara prévia: npm run shadcn:preview");
  console.log("Para instalar: npm run shadcn:install");
  process.exit(0);
}
if (!names.length) { console.log("Todos os itens selecionados já possuem arquivo no diretório shadcn."); process.exit(0); }

const protectedPaths = ["src/globals.css", "src/index.css", "components.json", "src/ui-catalog/catalog.ts", "src/ui-catalog/registry.tsx"];
const originals = Object.fromEntries(protectedPaths.map(path=>[path, readFileSync(resolve(projectRoot,path),"utf8")]));
console.log(`\nComando oficial: shadcn (versão fixa no package.json) add ${names.join(" ")} ${mode==="dry-run"?"--dry-run":"--yes"}\n`);
const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["exec", "--no", "--", "shadcn", "add", ...names, ...(mode==="dry-run" ? ["--dry-run"] : ["--yes"])], {
  cwd: projectRoot, stdio:"inherit", timeout:240000,
  env: { ...process.env, CI: mode==="apply" ? "true" : process.env.CI },
});
if(result.error) { console.error(result.error.message); process.exit(1); }
if(result.status!==0) {
  console.error(`Instalação não concluída (código ${result.status ?? "indeterminado"}). Confira a conexão ao npm e a configuração do CLI.`);
  process.exit(result.status ?? 1);
}
if(mode==="dry-run") {
  for(const path of protectedPaths) if(readFileSync(resolve(projectRoot,path),"utf8")!==originals[path]) throw new Error(`Dry-run alterou ${path}`);
  console.log("Prévia concluída; nenhuma alteração esperada.");
  process.exit(0);
}

// CSS/contratos não podem sofrer alterações silenciosas durante o bootstrap.
let protectedChanges = false;
for(const path of protectedPaths){
  const current=readFileSync(resolve(projectRoot,path),"utf8");
  if(current===originals[path]) continue;
  protectedChanges=true;
  mkdirSync(resolve(projectRoot,"docs/shadcn-cli-review"),{recursive:true});
  // Preserva o CSS editado pelo CLI para revisão, mas restaura o tema original.
  const review=resolve(projectRoot,`docs/shadcn-cli-review/${path.replaceAll("/","__")}.proposed`);
  writeFileSync(review,current);
  writeFileSync(resolve(projectRoot,path),originals[path]);
  console.warn(`ATENÇÃO: ${path} modificado pelo CLI; original restaurado; proposta em ${review}. Revise manualmente tokens/animações necessárias.`);
}
const remaining=names.filter(name=>!existsSync(resolve(projectRoot,`src/components/ui/${name}.tsx`)));
if(remaining.length){console.error(`Ausentes após CLI: ${remaining.join(", ")}`);process.exit(1);}
console.log("\nPrimitivas instaladas localmente. NÃO foram expostas ao catálogo json-render.");
console.log("Execute: npm run shadcn:verify && npm run validate && npm run build");
if(protectedChanges){
  console.warn("Revisão manual exigida dos arquivos CSS/config propostos em docs/shadcn-cli-review/. Não considere a instalação validada antes disso.");
  process.exitCode=2;
}
