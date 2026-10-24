import test from "node:test";
import assert from "node:assert/strict";
import { ratingStarFillPercent } from "../src/ui-catalog/rating-fill";

test("notas fracionárias preservam 25%, 50% e 75% da estrela seguinte",()=>{
 const fills=(value:number,max=5)=>Array.from({length:max},(_,i)=>ratingStarFillPercent(value,i,max));
 assert.deepEqual(fills(3.5),[100,100,100,50,0]);
 assert.deepEqual(fills(2.25),[100,100,25,0,0]);
 assert.deepEqual(fills(4.75),[100,100,100,100,75]);
 assert.deepEqual(fills(0),[0,0,0,0,0]);
 assert.deepEqual(fills(9,5),[100,100,100,100,100]);
 assert.deepEqual(fills(-1),[0,0,0,0,0]);
 assert.equal(ratingStarFillPercent(NaN,0,5),0);
});
