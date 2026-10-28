import profiles from "./pattern-layouts.json";
import type {PatternRequirements} from "./patterns";

/**
 * Declarative visual planning only. All node types and props remain in the
 * existing admitted Pi catalog; this module cannot authorize an action.
 */
export type LayoutPattern="login"|"search"|"dashboard";
export type PatternLayoutPlan={
 flow:LayoutPattern;variant:string;root:string;container:"Card"|"Stack";
 regions:string[];mobileColumns:1;readingOrder:"dom";
 maxWidth?:"md";centered?:true;gridColumns?:2|4;
};
const allowed=new Set(["login","search","dashboard"]);
if(profiles.schemaVersion!==1||profiles.status!=="semantic-guidance"||
 profiles.admission!=="does-not-authorize-pi-contracts-actions-or-permissions"||
 profiles.responsive.mobileColumns!==1||profiles.responsive.preserveDomReadingOrder!==true)
 throw Error("Invalid semantic pattern-layout policy");

export function planPatternLayout(spec:PatternRequirements):PatternLayoutPlan|null{
 if(!allowed.has(spec.flow))return null;
 const a=spec.answers;
 if(spec.flow==="login"){
  const rule=profiles.flows.login;
  return {flow:"login",variant:"credentials",root:rule.root,container:"Card",
   regions:rule.order.filter(id=>id!=="help"||a.showHelp===true),
   maxWidth:"md",centered:true,mobileColumns:1,readingOrder:"dom"};
 }
 if(spec.flow==="search"){
  const rule=profiles.flows.search;
  return {flow:"search",variant:a.dateFilter===true?"filters":"results",
   root:rule.root,container:"Stack",
   regions:rule.order.filter(id=>id!=="filters"||a.dateFilter===true),
   mobileColumns:1,readingOrder:"dom"};
 }
 const isGraph=a.view==="graphs";
 const rule=isGraph?profiles.flows.dashboard.graphs:profiles.flows.dashboard.kpis;
 const density=isGraph?2:a.density==="2"?2:4;
 return {flow:"dashboard",variant:isGraph?"graphs":"kpis",root:rule.root,
  container:isGraph?"Card":"Stack",
  regions:rule.order.filter(id=>id!=="footnote"||a.showFootnote===true),
  mobileColumns:1,readingOrder:"dom",gridColumns:density};
}
