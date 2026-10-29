#!/usr/bin/env node
// FASE 3 (E06): read-only inventory from existing theme and component sources.
// Does not create a new runtime token system, Zod schema, or Pi capability.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

function declarations(source, selector) {
  const prefix=selector+" {";
  const start=source.indexOf(prefix);
  if(start<0)throw new Error(`Missing CSS rule: ${selector}`);
  const end=source.indexOf("}",start+prefix.length);
  if(end<0)throw new Error(`Unclosed CSS rule: ${selector}`);
  const result={};
  for(const match of source.slice(start+prefix.length,end).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g))result[match[1]]=match[2].trim();
  return result;
}

function property(source,selector,name){
  const prefix=selector+" {";
  const start=source.indexOf(prefix);
  if(start<0)throw new Error(`Missing CSS selector: ${selector}`);
  const end=source.indexOf("}",start+prefix.length);
  const pattern=new RegExp("(?:^|[;\\n])\\s*"+name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\s*:\\s*([^;]+);");
  const match=source.slice(start+prefix.length,end).match(pattern);
  if(!match)throw new Error(`Missing ${name} in ${selector}`);
  return match[1].trim();
}

function collect(files){
 const globals=files["src/globals.css"],local=files["src/index.css"],card=files["src/components/ui/card.tsx"],button=files["src/components/ui/button.tsx"],main=files["src/main.tsx"],config=JSON.parse(files["components.json"]);
 const light=declarations(globals,":root, .light-theme"),dark=declarations(globals,".dark-theme"),theme=declarations(globals,"@theme inline");
 const aliases=Object.fromEntries(Object.entries(theme).filter(([k])=>k.startsWith("--color-")));
 const names=Object.values(aliases).map(v=>{const m=v.match(/^var\((--[\w-]+)\)$/);if(!m)throw new Error(`Unexpected color alias ${v}`);return m[1]});
 if(new Set(names).size!==names.length)throw new Error("Duplicate semantic colors");
 const colors={};
 for(const name of names){if(!light[name]||!dark[name])throw new Error(`Missing ${name} in a theme`);colors[name]={light:light[name],dark:dark[name],tailwindAlias:"--color-"+name.slice(2)};}
 const extra={};
 const extraLight=declarations(local,":root, .light-theme"),extraDark=declarations(local,".dark-theme");
 for(const name of Object.keys(extraLight)){if(!extraDark[name])throw new Error(`Missing local ${name}`);extra[name]={light:extraLight[name],dark:extraDark[name]};}
 const fontFamilies=Object.fromEntries(Object.entries(theme).filter(([k])=>k.startsWith("--font-")));
 const tracking={normal:light["--tracking-normal"],aliases:Object.fromEntries(Object.entries(theme).filter(([k])=>k.startsWith("--tracking-")))};
 const fontSizes={};
 for(const key of ["h1","h2","h3","h4"]){const selector=`.pg-heading--${key}`;fontSizes[key]={size:property(local,selector,"font-size"),lineHeight:property(local,selector,"line-height")};}
 const semanticGap={};for(const k of ["none","sm","md","lg"])semanticGap[k]=property(local,`.pg-gap--${k}`,"gap");
 const shadowNames=Object.keys(light).filter(n=>/^--shadow(?:-|$)/.test(n));
 const shadows={};for(const name of shadowNames){if(!dark[name])throw new Error(`Missing dark shadow ${name}`);shadows[name]={light:light[name],dark:dark[name]};}
 if(!card.includes("[--card-spacing:--spacing(6)]")||!card.includes("data-[size=sm]:[--card-spacing:--spacing(4)]"))throw new Error("Card spacing variants changed");
 const buttonSizes=["default","xs","sm","lg","icon","icon-xs","icon-sm","icon-lg"];
 for(const size of buttonSizes){if(!button.includes(size==="default"?"default:":"\""+size+"\":") && !button.includes(size+":"))throw new Error(`Button size ${size} missing`);}
 for(const name of ["inter","jetbrains-mono","playfair-display"])if(!main.includes(`@fontsource-variable/${name}/wght.css`))throw new Error(`Fontsource ${name} missing`);
 if(config.tailwind.css!=="src/globals.css"||config.tailwind.baseColor!=="neutral")throw new Error("Theme configuration changed");
 return {
  schemaVersion:1,
  snapshot:"2026-10-29",
  classification:"observed-source-inventory; no new contract or public API",
  sources:{theme:"src/globals.css",local:"src/index.css",fonts:"src/main.tsx",components:["src/components/ui/card.tsx","src/components/ui/button.tsx"],config:"components.json",quality:"src/ui-requirements/layout-quality.ts"},
  colors:{semantic:colors,local:extra,tailwindAliases:aliases},
  typography:{families:fontFamilies,tracking,localHeadingSizes:fontSizes,localTextSizes:{base:property(local,".pg-text","font-size"),caption:property(local,".pg-text--caption","font-size"),lead:property(local,".pg-text--lead","font-size")}},
  spacing:{source:"Tailwind CSS v4 scale (inherited, not redefined in src/globals.css)",declarativeGaps:semanticGap,gridFallback:"1rem",fieldGap:property(local,".pg-field","gap"),placeholderGap:property(local,".pg-placeholder","gap"),card:{default:"--spacing(6)",sm:"--spacing(4)"}},
  borders:{semanticColors:["--border","--input","--ring"],placeholder:property(local,".pg-placeholder","border"),graph:property(local,".pg-graph","border"),pagination:property(local,".pg-pagination button","border"),globalWidthToken:null},
  radii:{base:light["--radius"],aliases:Object.fromEntries(Object.entries(theme).filter(([k])=>k.startsWith("--radius-"))),placeholder:property(local,".pg-placeholder","border-radius"),componentExamples:{button:"rounded-md",card:"rounded-xl"}},
  shadows,
  density:{globalDensityToken:null,cardSizes:["default","sm"],buttonSizes,layoutGapNames:Object.keys(semanticGap),gridColumns:"--columns (default 1); schema comment documents up to 6",localResponsiveMaxWidthsPx:[639,850,520],note:"At widths 521–639px the later 850px query may override the earlier 639px one; requires separate responsive verification."}
 };
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const paths = ["src/globals.css","src/index.css","src/components/ui/card.tsx","src/components/ui/button.tsx","src/main.tsx","components.json"];
const files = Object.fromEntries(paths.map(path => [path, readFileSync(resolve(root, path), "utf8")]));
const inventory = collect(files);
const serialized = JSON.stringify(inventory, null, 2) + "\n";
const output = resolve(root, "docs/design-token-inventory.json");
if (process.argv.includes("--write")) {
  writeFileSync(output, serialized);
  console.log("Design token inventory updated");
} else if (process.argv.includes("--check")) {
  if (readFileSync(output, "utf8") !== serialized) {
    console.error("Design token inventory is stale; run: node scripts/inventory-design-tokens.mjs --write");
    process.exitCode = 1;
  } else {
    console.log("Design token inventory matches source files");
  }
} else {
  process.stdout.write(serialized);
}
