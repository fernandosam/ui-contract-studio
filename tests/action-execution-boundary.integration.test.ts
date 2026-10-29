import test from "node:test";
import assert from "node:assert/strict";
import {actionDefinitions} from "../src/ui-catalog/catalog";
import {graphErrors} from "../scripts/lib/spec-invariants.mjs";

const spec=(action:string,params:unknown)=>({
 root:"button",
 elements:{button:{type:"Button",props:{label:"Ação local"},children:[],
  on:{press:{action,params}}}}
});
const inspect=(action:string,params:unknown)=>
 graphErrors(spec(action,params),["Button"],{allowedEvents:{Button:{events:["press"]}}});

test("E09: runtime action schemas reject extra fields, remote links and invalid parameter shapes",()=>{
 assert.equal(actionDefinitions.buttonClick.params.safeParse({message:"Tudo certo"}).success,true);
 assert.equal(actionDefinitions.buttonClick.params.safeParse({message:"ok",execute:"curl"}).success,false);
 assert.equal(actionDefinitions.formSubmit.params.safeParse({formName:24}).success,false);
 assert.equal(actionDefinitions.formSubmit.params.safeParse({formName:"Teste",endpoint:"https://example.test"}).success,false);
 assert.equal(actionDefinitions.linkClick.params.safeParse({href:"javascript:alert(1)"}).success,false);
 assert.equal(actionDefinitions.linkClick.params.safeParse({href:"/dashboard"}).success,true);
});

test("E09: state actions cannot traverse prototype pollution paths",()=>{
 for(const path of ["__proto__.role","profile.constructor.prototype.admin","profile[__proto__]","profile.\u0000role"]){
  assert.ok(inspect("setState",{statePath:path,value:true}).some(e=>e.includes("statePath inválido")),path);
 }
 assert.ok(inspect("pushState",{statePath:"items",value:"ok",clearStatePath:"user.__proto__"})
   .some(e=>e.includes("clearStatePath inválido")));
 assert.deepEqual(inspect("setState",{statePath:"profile.name",value:"Ana"}),[]);
});

test("E09: unknown or remote actions never become executable from generated JSON",()=>{
 assert.ok(inspect("externalRequest",{url:"https://example.test"}).some(e=>e.includes("ação não permitida")));
});
