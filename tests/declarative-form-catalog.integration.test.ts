import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {catalog,experimentalCatalog} from "../src/ui-catalog/catalog";
import {graphErrors} from "../scripts/lib/spec-invariants.mjs";
import {unifiedComponentDefinitions,experimentalComponentEventDescriptors,actionDefinitions} from "../src/ui-catalog/catalog";
const example=JSON.parse(readFileSync("pi-catalog/experimental-examples/DeclarativeFormFlow.json","utf8"));
test("T35: experimental Pi accepts typed form but stable catalog refuses it",()=>{
 assert.equal(experimentalCatalog.validate(example).success,true);
 assert.equal(catalog.validate(example).success,false);
 assert.deepEqual(graphErrors(example,Object.keys(unifiedComponentDefinitions),
  {allowedActions:Object.keys(actionDefinitions),allowedEvents:experimentalComponentEventDescriptors}),[]);
});
test("T35: experimental form never extends action permissions",()=>{
 const manifest=JSON.parse(readFileSync("pi-catalog/contracts.json","utf8"));
 const entry=manifest.components.find((c:{type:string})=>c.type==="DeclarativeFormFlow");
 assert.equal(entry.lifecycle,"experimental");
 assert.equal(entry.validation.e2e,"pending");
 assert.equal(entry.e2eProtocol,null);
 assert.equal(manifest.actions.includes("submitRemote"),false);
 assert.equal(entry.interactionBoundary.includes("sem chamadas remotas"),true);
 const unsafe=structuredClone(example);
 unsafe.elements.example.props.endpoint="https://unapproved.invalid";
 assert.equal(experimentalCatalog.validate(unsafe).success,false);
});
