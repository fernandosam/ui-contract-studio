import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const projectRoot = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, projectRoot), "utf8");
const css = read("src/globals.css");
const localCss = read("src/index.css");
const layout = read("src/ui-runtime/layout.tsx");
function block(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]+)\\}`, "m"));
  assert.ok(match, `Seletor ${selector} ausente`);
  return match[1];
}

test("base-vega/neutral com Lucide e globals.css",()=>{
 const c=JSON.parse(read("components.json"));
 assert.equal(c.style,"base-vega");
 assert.equal(c.tailwind.baseColor,"neutral");
 assert.equal(c.tailwind.css,"src/globals.css");
 assert.equal(c.iconLibrary,"lucide");
 assert.deepEqual(c.registries,{});
});
test("tokens informados para claro e escuro",()=>{
 const light=block(":root, .light-theme");
 const dark=block(".dark-theme");
 for(const [name,l,d] of [
  ["background", "0.9195 0.0169 88.0030", "0.1913 0 0"],
  ["foreground", "0.2350 0 0", "0.9173 0.0133 82.4015"],
  ["card", "0.9530 0.0156 86.4257", "0.2264 0 0"],
  ["primary", "0.3012 0 0", "0.8520 0.0205 100.6306"],
  ["border", "0.8434 0.0231 87.1621", "0.2931 0 0"],
  ["chart-1", "0.6863 0.1743 34.2614", "0.6863 0.1743 34.2614"],
  ["sidebar", "0.8985 0.0199 87.5195", "0.1730 0 0"],
 ]){
  assert.ok(light.includes(`--${name}: oklch(${l})`),`light/${name}`);
  assert.ok(dark.includes(`--${name}: oklch(${d})`),`dark/${name}`);
 }
 assert.match(light,/--shadow-2xl:/);assert.match(dark,/--shadow-2xl:/);
 assert.match(css,/@theme inline/);
 assert.doesNotMatch(css, /--font-sans:\s*var\(--font-sans\)/);
 assert.doesNotMatch(css, /--shadow-sm:\s*var\(--shadow-sm\)/);
});
test("fontes indicadas e modo escuro padrão",()=>{
 const pkg=JSON.parse(read("package.json"));
 for(const name of ["inter","jetbrains-mono","playfair-display"]){
  assert.ok(pkg.dependencies[`@fontsource-variable/${name}`]);
  assert.match(read("src/main.tsx"),new RegExp(`@fontsource-variable/${name}/wght\\.css`));
 }
 assert.doesNotMatch(read("src/main.tsx"),/fontsource-variable\/geist/);
 assert.match(css,/--font-sans: "Inter Variable"/);
 assert.match(css,/--font-mono: "JetBrains Mono Variable"/);
 assert.match(css,/--font-serif: "Playfair Display Variable"/);
 assert.match(read("index.html"),/class="dark-theme"/);
 assert.match(read("src/ui-theme/preview-theme.tsx"),/localStorage\.setItem\("ui-contract-studio-theme"/);
 assert.match(layout,/SidebarProvider/);
 assert.match(css,/--color-sidebar: var\(--sidebar\)/);
 assert.doesNotMatch(localCss,/\.sidebar\s*\{/);
});
