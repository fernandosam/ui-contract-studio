import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
const strict=process.argv.includes("--strict");
const required=["button","card","field","input","table","popover","calendar","badge","checkbox","select","progress","dialog","drawer","tabs","accordion","separator","switch","slider","radio-group","tooltip","skeleton","spinner","textarea","label","avatar","dropdown-menu","collapsible","toggle","toggle-group","button-group","carousel"];
const missing=required.filter(item=>!existsSync(resolve("src/components/ui",item+".tsx")));
const catalog=readFileSync("src/ui-catalog/extensions/catalog.ts","utf8");
const registry=readFileSync("src/ui-catalog/extensions/registry.tsx","utf8");
for(const name of ["DataTable","DatePicker","Field"]){
  if(!catalog.includes(`${name}: {`) || !registry.includes(`${name}: (`)){
    console.error(`${name}: contrato ou adaptador ausente`);process.exit(1);
  }
}
console.log(`Integração das extensões declarada. Primitivas oficiais: ${required.length-missing.length}/${required.length}`);
if(missing.length){console.warn(`Pendentes de CLI shadcn: ${missing.join(", ")}`); if(strict)process.exitCode=1;}
