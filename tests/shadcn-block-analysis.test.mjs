import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { analyzeShadcnBlocks } from "../scripts/lib/analyze-shadcn-blocks.mjs";
import { summarizeShadcnBlockSources, validateShadcnSourceEvidence, gitBlobSha } from "../scripts/lib/shadcn-block-sources.mjs";

const upstream="apps/v4/registry/bases/base/blocks/example-01/page.tsx";
const revision="0123456789abcdef0123456789abcdef01234567";
const source='import { Button } from "@/registry/bases/base/ui/button"\nimport { Badge } from "@/registry/bases/base/ui/badge"\nexport default function Example(){return <Button><Badge>Demo</Badge></Button>}\n';
const block={id:"Example01",name:"example-01",family:"example",sourceFiles:[upstream]};
const write=(root,path,content)=>{
  const full=join(root,path);
  mkdirSync(dirname(full),{recursive:true});
  writeFileSync(full,content);
};
const newFixture=()=>{
  const root=mkdtempSync(join(tmpdir(),"shadcn-block-audit-"));
  const path="audits/upstream/shadcn-blocks/example-01/page.tsx";
  write(root,path,source);
  const inputs={
    root,inventory:{schemaVersion:1,blocks:[block]},
    pins:{schemaVersion:2,pins:{"example-01":revision},sourceBlobs:{[upstream]:gitBlobSha(source)}},
    reviews:{schemaVersion:1,baselineBlockIds:[],entries:[{
      blockId:"Example01",blockSlug:"example-01",implementation:"declarative",
      reviewStatus:"review-required",reason:"Needs human review",
    }]},
    manifest:{components:[]},contracts:[],approved:new Set(),
  };
  return {root,inputs,path};
};

test("official shadcn TSX is parsed without execution and retains provenance",()=>{
  const analyzed=summarizeShadcnBlockSources(block,[{path:upstream,content:source}],revision);
  assert.deepEqual(analyzed.dependencies,["Badge","Button"]);
  assert.equal(analyzed.suggestedImplementation,"declarative-composite-candidate");
  assert.equal(analyzed.sourceFiles.length,1);
  assert.match(analyzed.sourceFiles[0].sha256,/^[0-9a-f]{64}$/);
  assert.deepEqual(validateShadcnSourceEvidence(block,analyzed),[]);
  assert.throws(()=>summarizeShadcnBlockSources(block,[],revision),/must match/);
});

test("new shadcn block is analyzed but never published without explicit review",()=>{
  const {root,inputs}=newFixture();
  try{
    let result=analyzeShadcnBlocks(inputs);
    assert.deepEqual(result.errors,[]);
    assert.equal(result.blocks[0].reviewStatus,"review-required");
    assert.equal(result.blocks[0].exposedToPi,false);
    assert.deepEqual(result.blocks[0].upstreamDependencies,["Badge","Button"]);
    assert.equal(result.blocks[0].suggestedImplementation,"declarative-composite-candidate");

    inputs.approved=new Set(["Example01"]);
    result=analyzeShadcnBlocks(inputs);
    assert.ok(result.errors.some(e=>e.includes("blocked publication")));
    assert.ok(result.errors.some(e=>e.includes("generated composition")));
    inputs.manifest.components.push({name:"Example01",blockSlug:"example-01",template:"example.json"});
    inputs.contracts.push({name:"Example01",dependencies:["Button"]});
    inputs.reviews.entries[0].reviewStatus="reviewed";
    result=analyzeShadcnBlocks(inputs);
    assert.ok(result.errors.some(e=>e.includes("requires reviewer")));
    Object.assign(inputs.reviews.entries[0],{
      reviewer:"reviewer-account",reviewedOn:"2026-10-26",reviewReference:"https://github.com/example/repo/pull/1",
    });
    result=analyzeShadcnBlocks(inputs);
    assert.deepEqual(result.errors,[]);
    assert.deepEqual(result.blocks[0].absentFromAdaptation,["Badge"]);
    assert.equal(result.blocks[0].exposedToPi,true);

    inputs.reviews.entries[0].reviewStatus="existing-approved";
    result=analyzeShadcnBlocks(inputs);
    assert.ok(result.errors.some(e=>e.includes("cannot claim legacy approval")));
  }finally{rmSync(root,{recursive:true,force:true})}
});

test("original source integrity, missing snapshots, and orphan decisions block audits",()=>{
  const {root,inputs,path}=newFixture();
  try{
    write(root,path,source+"\n// modified without new source hash\n");
    assert.ok(analyzeShadcnBlocks(inputs).errors.some(e=>e.includes("Git blob integrity mismatch")));
    inputs.pins.sourceBlobs[upstream]=gitBlobSha(source+"\n// modified without new source hash\n");
    inputs.reviews.entries.push({...inputs.reviews.entries[0],blockId:"Other01"});
    assert.ok(analyzeShadcnBlocks(inputs).errors.some(e=>e.includes("orphan shadcn decision")));
    inputs.reviews.entries.pop();
    rmSync(join(root,path));
    assert.ok(analyzeShadcnBlocks(inputs).errors.some(e=>e.includes("missing official upstream source snapshot")));
  }finally{rmSync(root,{recursive:true,force:true})}
});
