/** Declarative browser case manifest; safe to import from Playwright's Node runtime. */
export const patternEvidenceCases=[
 {id:"login-default",flow:"login",answers:{},checked:["identifier","remember","showHelp"]},
 {id:"login-user",flow:"login",answers:{identifier:"username",remember:true,showHelp:true},checked:["identifier","remember","showHelp"]},
 {id:"search-default",flow:"search",answers:{},checked:["dateFilter"]},
 {id:"search-dates",flow:"search",answers:{dateFilter:true},checked:["dateFilter"]},
 {id:"list-default",flow:"list",answers:{},checked:["title","compact","showSummary"]},
 {id:"list-compact",flow:"list",answers:{title:"Clientes",compact:true,showSummary:true},checked:["title","compact","showSummary"]},
 {id:"dashboard-kpis",flow:"dashboard",answers:{view:"kpis"},checked:["view","density","showFootnote"]},
 {id:"dashboard-graphs",flow:"dashboard",answers:{view:"graphs",showFootnote:true},checked:["view","showFootnote"]}
] as const;
export type PatternEvidenceCase=(typeof patternEvidenceCases)[number];
export const patternEvidenceRoot="reports/requirements-browser";
export const browserProjects=["desktop","mobile"] as const;
