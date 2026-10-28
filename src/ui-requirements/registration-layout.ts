import profile from "./registration-layout.json";
import type {RequirementField} from "./schema";

/**
 * Semantic layout decision for registration; it is not a Pi schema, new prop,
 * permission or executable form contract. Component names are already admitted.
 */
export type RegistrationLayoutGroup={
 id:string;label:string;fieldIndexes:number[];columns:1|2;
};
export type RegistrationLayoutPlan={
 id:"registration";container:{maxWidth:"md";centered:true};
 groups:RegistrationLayoutGroup[];mobileColumns:1;gap:"md";
};

// Fail closed when a reviewed mapping is accidentally corrupted.
const identifiers=new Set<string>();
const names=new Set<string>();
if(profile.schemaVersion!==1||profile.id!=="registration"||profile.status!=="semantic-guidance"||
 profile.admission!=="does-not-authorize-pi-contracts-actions-or-permissions"||
 profile.container.maxWidth!=="md"||profile.container.centered!==true||
 profile.responsive.mobileColumns!==1||profile.responsive.desktopMaxColumns!==2||
 profile.responsive.desktopMinFields!==2||profile.responsive.gap!=="md"||
 profile.responsive.preserveDomReadingOrder!==true)
 throw Error("Invalid semantic registration layout profile");
for(const group of profile.groups){
 if(!/^[a-z]+$/.test(group.id)||identifiers.has(group.id)||!group.label.trim())
  throw Error("Duplicate or invalid semantic registration group");
 identifiers.add(group.id);
 for(const name of ("fields" in group?group.fields:[])??[]){
  if(names.has(name))throw Error("Ambiguous semantic registration field mapping");
  names.add(name);
 }
}
if(!identifiers.has("additional")||
 profile.groups.filter(group=>"prefix" in group).length!==1||
 profile.groups.at(-1)?.id!=="additional")
 throw Error("Registration layout requires a final fallback group");

export function planRegistrationLayout(fields:readonly RequirementField[],preferred:unknown):RegistrationLayoutPlan{
 if(preferred!=="single"&&preferred!=="two-columns")throw Error("Invalid registration layout choice");
 const collected=new Map<string,number[]>();
 profile.groups.forEach(group=>collected.set(group.id,[]));
 for(const [index,field] of fields.entries()){
  if(!/^[a-z][a-zA-Z0-9]*$/.test(field.name))throw Error("Invalid registration field name");
  const found=profile.groups.find(group=>"fields" in group&&group.fields?.includes(field.name));
  const id=found?.id??"additional";
  collected.get(id)!.push(index);
 }
 return {
  id:"registration",container:{maxWidth:"md",centered:true},
  mobileColumns:1,gap:"md",
  groups:profile.groups.flatMap(group=>{
   const fieldIndexes=collected.get(group.id)!;
   return fieldIndexes.length?[{
    id:group.id,label:group.label,fieldIndexes,
    columns:(preferred==="two-columns"&&fieldIndexes.length>=profile.responsive.desktopMinFields?2:1) as 1|2
   }]:[];
  })
 };
}
