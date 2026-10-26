#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { summarizeShadcnBlockSources, gitBlobSha } from "./lib/shadcn-block-sources.mjs";

const args = process.argv.slice(2);
const arg = key => args.find(x=>x.startsWith(key+"="))?.slice(key.length+1);
const slug=arg("--block"), all=args.includes("--all");
const revision=arg("--ref");
const local=arg("--source-dir");
const inventory=JSON.parse(readFileSync("src/ui-catalog/block-source-inventory.json","utf8"));
if ((Boolean(slug) === Boolean(all)) || !/^[0-9a-f]{40}$/.test(revision??"")) {
  console.error("Usage: node scripts/sync-shadcn-block-sources.mjs --block=login-01 --ref=<40-character SHA> [--source-dir=<upstream checkout>] (or --all)");
  process.exit(1);
}
const selected=all?inventory.blocks:inventory.blocks.filter(x=>x.name===slug);
if(!selected.length)throw new Error("Unregistered block: "+slug);
const prefix="apps/v4/registry/bases/base/blocks/";
const pinFile="src/ui-catalog/shadcn-block-source-pins.json";
const pins=JSON.parse(readFileSync(pinFile,"utf8"));
if(pins.schemaVersion!==2)throw new Error("Unsupported source pin schema");
for(const block of selected){
  const sources=[];
  for(const path of block.sourceFiles){
    if(!path.startsWith(prefix+block.name+"/") || !/^[a-z0-9/_.-]+$/.test(path))
      throw new Error("Invalid upstream path "+path);
    let content;
    if(local){
      const full=resolve(local,path);
      if(!full.startsWith(resolve(local)+sep))throw new Error("Source path escapes checkout");
      content=readFileSync(full,"utf8");
    }else{
      const url="https://raw.githubusercontent.com/shadcn-ui/ui/"+revision+"/"+path;
      const response=await fetch(url,{headers:{"User-Agent":"ui-contract-studio-source-audit"}});
      if(!response.ok)throw new Error("Source fetch failed: "+response.status+" "+path);
      content=await response.text();
    }
    sources.push({path,content});
  }
  const evidence=summarizeShadcnBlockSources(block,sources,revision);
  for(const {path,content} of sources){
    const file="audits/upstream/shadcn-blocks/"+path.slice(prefix.length);
    mkdirSync(dirname(file),{recursive:true});
    writeFileSync(file,content);
    pins.sourceBlobs[path]=gitBlobSha(content);
  }
  pins.pins[block.name]=revision;
  console.log("✓ "+block.name+": "+sources.length+" official files, "+evidence.dependencies.length+
    " primitive dependencies, pinned revision "+revision.slice(0,12));
}
writeFileSync(pinFile,JSON.stringify(pins,null,2)+"\n");
console.log("Pinned source snapshots updated. Review the source diff and the block decision before publishing any new Pi contract.");
