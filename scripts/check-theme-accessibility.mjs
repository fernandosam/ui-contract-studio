#!/usr/bin/env node
import {readFileSync} from "node:fs";
import {auditThemeContrast,auditResponsiveGrid} from "./lib/theme-accessibility.mjs";
const read = path => readFileSync(new URL("../"+path, import.meta.url),"utf8");
try {
  const checks=auditThemeContrast(read("src/globals.css"));
  const grids=auditResponsiveGrid(read("src/index.css"));
  for (const item of checks) {
    console.log((item.pass?"PASS":"FAIL")+" "+item.mode+" "+item.kind+" "+
      item.foreground+"/"+item.background+" "+item.ratio.toFixed(2)+":1 (min "+item.minimum+":1)");
  }
  for (const item of grids) console.log((item.pass?"PASS":"FAIL")+" grid @"+item.width+"px: "+item.actual);
  const failed=[...checks,...grids].filter(item=>!item.pass);
  if (failed.length) throw new Error(failed.length+" contrast/responsive failures");
  console.log("Theme accessibility: "+checks.length+" contrast pairs and "+grids.length+" responsive breakpoints passed.");
} catch (error) {
  console.error("Theme accessibility failed: "+error.message);
  process.exitCode=1;
}
