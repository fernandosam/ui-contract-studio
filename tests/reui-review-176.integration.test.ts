import {test} from "node:test"
import assert from "node:assert/strict"
import {readFileSync} from "node:fs"
import {extensionDefinitions} from "../src/ui-catalog/extensions/catalog"
import {catalog} from "../src/ui-catalog/catalog"

const read=(f:string)=>JSON.parse(readFileSync(f,"utf8"))

function validSpec(type:string,props:unknown){
 return {root:"root",elements:{root:{type,props,children:[]}}}
}

test("RatingDistribution valida contagens de 5 categorias, sem média fornecida pelo agente",()=>{
 const schema=extensionDefinitions.RatingDistribution.props
 for(const counts of [[1,0,0,4,10],[0,0,0,0,2]]){
  assert.equal(schema.safeParse({counts}).success,true)
  assert.equal(catalog.validate(validSpec("RatingDistribution",{counts})).success,true)
 }
 for(const candidate of [
  {counts:[0,0,0,0,0]}, {counts:[1,2,3,4]}, {counts:[1,2,3,4,5,6]},
  {counts:[1,0,-1,0,0]}, {counts:[1,0,0,0,1.5]}, {counts:[1,2,3,4,5],percentage:95},
  {counts:[1,2,3,4,5],className:"hacked"}
 ]){
  assert.equal(schema.safeParse(candidate).success,false,JSON.stringify(candidate))
  assert.equal(catalog.validate(validSpec("RatingDistribution",candidate)).success,false)
 }
 const example=read("pi-catalog/examples/RatingDistribution.json")
 assert.equal(catalog.validate(example).success,true)
})

test("CharacterCountTextarea valida nome, limite, limiar, initialValue e proibição de JSX",()=>{
 const schema=extensionDefinitions.CharacterCountTextarea.props
 const p={label:"Descrição",name:"description",maxLength:280,initialValue:"Texto",warningThreshold:20}
 assert.equal(schema.safeParse(p).success,true)
 assert.equal(catalog.validate(validSpec("CharacterCountTextarea",p)).success,true)
 for(const candidate of [
  {...p,maxLength:0}, {...p,maxLength:5001}, {...p,initialValue:"x".repeat(281)},
  {...p,warningThreshold:281}, {...p,name:"onClick('bad')"}, {...p,children:"<div/>"},
  {...p,html:"<script/>"}, {...p,defaultValue:"fake"}
 ]){
  assert.equal(schema.safeParse(candidate).success,false,JSON.stringify(candidate).slice(0,100))
  assert.equal(catalog.validate(validSpec("CharacterCountTextarea",candidate)).success,false)
 }
 assert.equal(catalog.validate(read("pi-catalog/examples/CharacterCountTextarea.json")).success,true)
})
