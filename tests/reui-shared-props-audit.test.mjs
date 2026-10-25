import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("todos os 559 exemplos ReUI são reavaliados por família e propriedade",()=>{
  const result=spawnSync(process.execPath,["scripts/audit-reui-primitives.mjs","--check","--summary-json"],{
    encoding:"utf8",maxBuffer:8*1024*1024
  });
  assert.equal(result.status,0,result.stderr||result.stdout);
  const report=JSON.parse(result.stdout);
  assert.equal(report.count,559);
  assert.equal(report.familiesCount,31);
  assert.equal(report.families.reduce((sum,f)=>sum+f.examples,0),559);
  for(const family of report.families){
    assert.ok(family.examples>0,family.family);
    assert.ok(Array.isArray(family.observedProps),family.family);
    assert.deepEqual(family.sharedProps,family.observedProps.filter(p=>p.examples>=2),family.family);
    for(const prop of family.sharedProps){
      assert.ok(prop.examples<=family.examples, family.family+":"+prop.property);
      assert.equal(prop.coveragePercent,Math.round(prop.examples*100/family.examples));
      assert.equal(typeof prop.inApprovedContract,"boolean");
    }
  }
  assert.ok(report.families.some(f=>f.sharedProps.length>0),"atributos comuns não extraídos");
});
