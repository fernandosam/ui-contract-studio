#!/usr/bin/env node
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {resolve,sep,dirname} from "node:path";
import {extractReuiMarkdown} from "./lib/extract-reui-markdown.mjs";

const args=process.argv.slice(2);
const option=name=>args.find(x=>x.startsWith(name+"="))?.slice(name.length+1);
const component=option("--component"), input=option("--file");
if(!component || !input || !/^[a-zA-Z0-9/_-]+\.md$/.test(input)){
  console.error("Usage: --component=AlertDialog --file=reports/reui-source/alert-dialog.md");
  process.exit(2);
}
const allowed=resolve("reports/reui-source"),path=resolve(input);
if(!path.startsWith(allowed+sep)){
  console.error("Source files must be saved under reports/reui-source/");
  process.exit(2);
}
const markdown=readFileSync(path,"utf8");
const slug=component.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();
const report=extractReuiMarkdown(markdown,component,"https://reui.io/components/"+slug);
const out="reports/composition-analysis/proposals/"+slug+".json";
mkdirSync(dirname(out),{recursive:true});
writeFileSync(out,JSON.stringify(report,null,2)+"\n");
console.log("✓ Draft only: "+out+". Human review required before any catalog/contract change.");
