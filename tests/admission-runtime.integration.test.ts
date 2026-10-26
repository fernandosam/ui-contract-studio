import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {catalog,experimentalCatalog,certifiedExperimentalNames,unifiedComponentDefinitions} from "../src/ui-catalog/catalog";
import {experimentalComponentImplementations} from "../src/ui-catalog/registry";

const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const manifest=read("pi-catalog/contracts.json");
const examples=manifest.components.filter((entry:{tier:string})=>entry.tier==="experimental") as Array<{type:string;example:string;sourceDigest:string;lifecycle:string}>;

test("experimental contracts have real strict Zod schemas and executable registry adapters",()=>{
 for(const item of examples){
  const component=unifiedComponentDefinitions[item.type as keyof typeof unifiedComponentDefinitions];
  assert.ok(component?.props,"schema missing: "+item.type);
  assert.equal(typeof experimentalComponentImplementations[item.type as keyof typeof experimentalComponentImplementations],"function","adapter missing: "+item.type);
  const spec=read(item.example);
  assert.equal(experimentalCatalog.validate(spec).success,true,item.type);
  assert.equal(catalog.validate(spec).success,certifiedExperimentalNames.has(item.type),"default mode leak: "+item.type);
  const malicious=structuredClone(spec);
  malicious.elements.example.props.onConfirm="alert(1)";
  assert.equal(experimentalCatalog.validate(malicious).success,false,"unexpected prop accepted: "+item.type);
  assert.equal(item.lifecycle==="stable",certifiedExperimentalNames.has(item.type));
 }
});
