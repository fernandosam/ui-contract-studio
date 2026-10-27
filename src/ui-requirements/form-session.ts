import type {RequirementSpec} from "./schema";
import {evaluateValue,type FieldRule} from "./behavior";

/** Pure, non-network local form state; it is NOT a Pi-admitted save action. */
export type FormSession={
 phase:"editing"|"confirming"|"complete";
 values:Record<string,string>;
 errors:Record<string,string[]>;
 submitted:number;
};
export function newFormSession():FormSession{
 return {phase:"editing",values:{},errors:{},submitted:0};
}
function rulesFor(spec:RequirementSpec,name:string):FieldRule[]{
 const field=spec.fields.find(f=>f.name===name);
 if(!field||spec.answers.validation==="none")return [];
 const rules:FieldRule[]=[];
 if(field.required)rules.push({kind:"required"});
 if(field.type==="email")rules.push({kind:"email"});
 return rules;
}
export function validateForm(spec:RequirementSpec,values:Record<string,string>):Record<string,string[]>{
 const errors:Record<string,string[]>={};
 for(const f of spec.fields){
  const found=evaluateValue(values[f.name]??"",rulesFor(spec,f.name));
  if(found.length)errors[f.name]=found;
 }
 return errors;
}
export function changeFormField(spec:RequirementSpec,session:FormSession,name:string,value:string):FormSession{
 if(session.phase==="complete"||!spec.fields.some(x=>x.name===name))return session;
 const values={...session.values,[name]:value};
 const errors={...session.errors};
 delete errors[name];
 return {...session,values,errors,phase:"editing"};
}
export function blurFormField(spec:RequirementSpec,session:FormSession,name:string):FormSession{
 if(session.phase!=="editing"||!spec.fields.some(x=>x.name===name))return session;
 const errors={...session.errors};
 const found=evaluateValue(session.values[name]??"",rulesFor(spec,name));
 if(found.length)errors[name]=found;else delete errors[name];
 return {...session,errors};
}
export function beginLocalSubmit(spec:RequirementSpec,session:FormSession):FormSession{
 if(session.phase!=="editing"||spec.answers.persistence!=="local-demo"||spec.missing.length)return session;
 const errors=validateForm(spec,session.values);
 if(Object.keys(errors).length)return {...session,errors};
 return spec.answers.confirmation===true?
  {...session,errors:{},phase:"confirming"}:
  {...session,errors:{},phase:"complete",submitted:session.submitted+1};
}
export function cancelLocalSubmit(session:FormSession):FormSession{
 return session.phase==="confirming"?{...session,phase:"editing"}:session;
}
export function confirmLocalSubmit(session:FormSession):FormSession{
 return session.phase==="confirming"?{...session,phase:"complete",submitted:session.submitted+1}:session;
}
