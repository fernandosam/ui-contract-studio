import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync,writeFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {join} from "node:path";
import {createHash} from "node:crypto";

const script="scripts/generate-composition-proposals.mjs";
const recipes=JSON.parse(readFileSync("scripts/composition-codegen/recipes.json","utf8")).recipes;
const hash=s=>createHash("sha256").update(s).digest("hex");
const run=(...flags)=>spawnSync(process.execPath,[script,...flags],{encoding:"utf8",maxBuffer:2_000_000});
test("closed recipe generator audits without writing and refuses non-candidate/reuse/remote scenarios",()=>{
  const result=run("--check");
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/Approval|No Pi lock/);
  assert.equal(recipes.length,4);
  for(const id of ["alert-simple","alert-remote","accordion-faq","button-loading","unknown","../unsafe"]){
    const denied=run("--id="+id);
    assert.notEqual(denied.status,0,id);
  }
  assert.notEqual(run("--all","--id=alert-typed").status,0);
  assert.notEqual(run("--out=src/").status,0);
});
test("generator emits audited, reproducible React + strict Zod schemas and executable schema tests",()=>{
  const before=readFileSync("src/ui-catalog/contracts.lock.json","utf8");
  const result=run("--all");
  assert.equal(result.status,0,result.stderr);
  const files=["manifest.json","REVIEW.md"];
  for(const recipe of recipes){
    const root=join("reports/composition-proposals",recipe.id);
    assert.ok(existsSync(join(root,recipe.componentFile)));
    assert.ok(existsSync(join(root,recipe.schemaFile)));
    for(const name of files)assert.ok(existsSync(join(root,name)));
    const manifest=JSON.parse(readFileSync(join(root,"manifest.json"),"utf8"));
    assert.equal(manifest.admission,"review-required");
    assert.equal(manifest.registryChannel,"experimental");
    assert.equal(manifest.target,recipe.target);
    assert.ok(manifest.tests.every(x=>x.status==="planned-not-executed"));
    for(const [name,digest] of Object.entries(manifest.fileSha256))
      assert.equal(hash(readFileSync(join(root,name),"utf8")),digest);
    const node=spawnSync(join("node_modules",".bin","tsx"),[
      "--test",join(root,recipe.target+".schema.test.ts")
    ],{encoding:"utf8",maxBuffer:2_000_000});
    assert.equal(node.status,0,node.stdout+"\n"+node.stderr);
    assert.match(readFileSync(join(root,"REVIEW.md"),"utf8"),/REVISÃO OBRIGATÓRIA/);
  }
  assert.equal(readFileSync("src/ui-catalog/contracts.lock.json","utf8"),before);
  const repeated=run("--all");
  assert.equal(repeated.status,0,repeated.stderr);
});
test("codegen fails closed when a reviewer edits a previously generated artifact",()=>{
  const id="alert-typed",file="reports/composition-proposals/alert-typed/TypedConfirmationDialog.schema.ts";
  const original=readFileSync(file,"utf8");
  try{
    writeFileSync(file,original+"\n// deliberately edited proposal\n");
    const attempt=run("--id="+id);
    assert.notEqual(attempt.status,0);
    assert.match(attempt.stderr,/Refusing to overwrite/);
  }finally{
    writeFileSync(file,original);
  }
  assert.equal(run("--id="+id).status,0);
});
test("the generated sources stay outside the approved runtime and are explicitly not Pi imports",()=>{
  for(const recipe of recipes){
    const path="scripts/composition-codegen/recipes/"+recipe.id+".component.tsx.txt";
    const code=readFileSync(path,"utf8");
    assert.match(code,/PROPOSAL ONLY/);
    assert.doesNotMatch(code,/dangerouslySetInnerHTML|fetch\(|eval\(|@\/ui-catalog\/registry/);
    assert.match(code,/from "@\/components\/ui\//);
  }
});
