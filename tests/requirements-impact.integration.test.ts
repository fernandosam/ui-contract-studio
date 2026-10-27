import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assessChangeImpact,measureStaticCoverage} from "../src/ui-requirements/impact";
const fixture=JSON.parse(readFileSync("tests/fixtures/requirements-scenarios.json","utf8"));
test("T34: contract changes flag all dependent patterns and independent browser checks",()=>{
 const result=assessChangeImpact(["src/ui-catalog/contracts.lock.json"]);
 assert.equal(result.impacts.length,5);
 assert.ok(result.impacts.every(x=>x.requiredChecks.includes("browser-review")));
 assert.ok(result.impacts.every(x=>x.advice.includes("API")));
});
test("T34: isolated pattern and knowledge changes have targeted impact",()=>{
 const onlySearch=assessChangeImpact(["src/ui-patterns/search-and-filters.json"]);
 assert.deepEqual(onlySearch.impacts.map(x=>x.family),["search"]);
 const input=assessChangeImpact(["src/ui-catalog/knowledge/input.json"]);
 assert.deepEqual(input.impacts.map(x=>x.family),["registration","login"]);
 const unknown=assessChangeImpact(["docs/roadmap.md"]);
 assert.equal(unknown.impacts.length,0);
 assert.deepEqual(unknown.unmapped,["docs/roadmap.md"]);
 assert.throws(()=>assessChangeImpact(["../../not-allowed"]),/inválido/);
});
test("T34: measure first-pass static acceptance and contract reuse with reproducible fingerprints",()=>{
 const result=measureStaticCoverage(fixture.scenarios);
 assert.equal(result.eligible,20);
 assert.equal(result.expectedBlocked,4);
 assert.equal(result.firstPassValid,20);
 assert.equal(result.firstPassRate,1);
 assert.equal(result.newContractsNeededForAcceptedSpecs,0);
 assert.equal(result.runtimeTests,"not-executed");
 assert.equal(result.samples.length,20);
 assert.ok(result.samples.every(x=>/^[a-f0-9]{64}$/.test(x.fingerprint)));
});
test("T34: impact fingerprints change when fields change, without manufacturing runtime passes",()=>{
 const initial=measureStaticCoverage(fixture.scenarios);
 const modified=structuredClone(fixture.scenarios);
 modified[0].answers.layout="two-columns";
 const next=measureStaticCoverage(modified);
 assert.notEqual(initial.samples[0].fingerprint,next.samples[0].fingerprint);
 assert.ok(next.samples.every(x=>x.runtimeEvidence==="not-executed"));
});
