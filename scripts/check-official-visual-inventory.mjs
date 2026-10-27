#!/usr/bin/env node
import {readFileSync} from "node:fs";
import {validateOfficialVisualInventory} from "./lib/official-visual-inventory.mjs";
const read=path=>JSON.parse(readFileSync(path,"utf8"));
const report=validateOfficialVisualInventory(
 read("shadcn-plan.json"),
 read("scripts/official-component-examples.json"),
 read("pi-catalog/contracts.json"),
);
if(process.argv.includes("--json"))console.log(JSON.stringify(report,null,2));
else {
 console.log(`Auditoria shadcn/ui: ${report.statistics.selected} selecionadas, ${report.statistics.pendingReview} pendentes, ${report.statistics.installed} instaladas; ${report.statistics.comparable} com par local.`);
 for(const error of report.errors)console.error("✗ "+error);
 if(report.ok)console.log("✓ Inventário reconciliado. Fidelidade visual ainda exige evidências e revisão humana.");
}
if(!report.ok)process.exitCode=1;
