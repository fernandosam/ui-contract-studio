import test from "node:test";
import assert from "node:assert/strict";
import {resolveAnswers} from "../src/ui-requirements/engine";
import {newFormSession,changeFormField,blurFormField,beginLocalSubmit,cancelLocalSubmit,confirmLocalSubmit,validateForm} from "../src/ui-requirements/form-session";

test("T30: required/email validation, correction and read-only error state",()=>{
 const spec=resolveAnswers({persistence:"local-demo"});
 let session=newFormSession();
 session=beginLocalSubmit(spec,session);
 assert.ok(session.errors.name?.length);
 assert.ok(session.errors.email?.length);
 assert.equal(session.submitted,0);
 session=changeFormField(spec,session,"email","not-an-email");
 session=blurFormField(spec,session,"email");
 assert.match(session.errors.email[0],/E-mail/);
 session=changeFormField(spec,session,"name","Ana");
 session=changeFormField(spec,session,"email","ana@example.com");
 session=changeFormField(spec,session,"password","local-password");
 assert.deepEqual(validateForm(spec,session.values),{});
 session=beginLocalSubmit(spec,session);
 assert.equal(session.phase,"complete");
 assert.equal(beginLocalSubmit(spec,session).submitted,1);
});
test("T31: confirmation is an explicit gate; cancellation never submits",()=>{
 const spec=resolveAnswers({persistence:"local-demo",confirmation:true});
 let s=newFormSession();
 for(const [k,v] of Object.entries({name:"Ana",email:"ana@example.com",password:"example"}))
  s=changeFormField(spec,s,k,v);
 s=beginLocalSubmit(spec,s);
 assert.equal(s.phase,"confirming");
 assert.equal(s.submitted,0);
 s=cancelLocalSubmit(s);
 assert.equal(s.phase,"editing");
 assert.equal(s.submitted,0);
 s=beginLocalSubmit(spec,s);
 s=confirmLocalSubmit(s);
 assert.equal(s.phase,"complete");
 assert.equal(s.submitted,1);
 assert.equal(confirmLocalSubmit(s).submitted,1);
});
test("T30/T31: no persistence under unauthorized requirements",()=>{
 const spec=resolveAnswers({persistence:"backend"});
 assert.equal(beginLocalSubmit(spec,newFormSession()).submitted,0);
 assert.equal(beginLocalSubmit(spec,newFormSession()).phase,"editing");
});
