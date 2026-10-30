import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {auditThemeContrast,auditResponsiveGrid,contrastRatio,gridColumnsAtWidth}
  from "../scripts/lib/theme-accessibility.mjs";
const read=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const css=read("src/globals.css"), adapters=read("src/index.css");

test("E06: 28 light/dark semantic text and focus checks pass WCAG AA",()=>{
 const checks=auditThemeContrast(css);
 assert.equal(checks.length,28);
 assert.deepEqual(checks.filter(item=>!item.pass),[]);
 assert.deepEqual([...new Set(checks.map(item=>item.mode))],["light","dark"]);
 assert.ok(contrastRatio("oklch(1 0 0)","oklch(0 0 0)")>20.9);
});
test("E06: fail closed on color drift or missing token",()=>{
 const broken=css.replace("--muted-foreground: oklch(0.4400","--muted-foreground: oklch(0.4688");
 assert.notEqual(broken,css,"Test must mutate actual source");
 assert.ok(auditThemeContrast(broken).some(item=>item.mode==="light"&&!item.pass));
 const missing=css.replace("--ring: oklch(0.3012 0 0);","--ring: transparent;");
 assert.throws(()=>auditThemeContrast(missing),/Missing light color/);
});
test("E06: ordered breakpoints preserve one column at 521-639px",()=>{
 assert.deepEqual(auditResponsiveGrid(adapters).filter(item=>!item.pass),[]);
 assert.equal(gridColumnsAtWidth(adapters,600),"minmax(0, 1fr)");
 const broken=adapters.replace("@media (max-width: 639px)","@media (max-width: 500px)");
 assert.ok(auditResponsiveGrid(broken).some(item=>!item.pass));
});
test("E06: standalone source audit executes without dependencies",()=>{
 const run=spawnSync(process.execPath,["scripts/check-theme-accessibility.mjs"],{
  cwd:new URL("../",import.meta.url),encoding:"utf8",
 });
 assert.equal(run.status,0,run.stdout+"\n"+run.stderr);
 assert.match(run.stdout,/28 contrast pairs and 5 responsive breakpoints passed/);
});
