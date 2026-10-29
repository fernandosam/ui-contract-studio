/** Read-only discovery over existing reviewed contracts. Never used as admission policy. */
export type DiscoveryEntry = {
 name:string;
 description?:string;
 purpose?:string;
 whenUse?:string[];
 maturity?:string;
 piAvailable:boolean;
};
export const functionalGroups=[
 'Formulários e entrada','Confirmação e feedback','Navegação e organização',
 'Dados e visualização','Identidade e comunicação','Layouts e estrutura','Outros',
] as const;
export type FunctionalGroup=typeof functionalGroups[number];
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').trim();
export function functionalGroup(name:string):FunctionalGroup {
 const n=normalize(name);
 if(/(alertdialog|dialog|alert|toast|sonner|confirm|notification|progress|skeleton|spinner|badge)/.test(n.replaceAll(' ','')))return 'Confirmação e feedback';
 if(/(form|input|field|select|checkbox|radio|switch|slider|textarea|signup|login|date.?picker|calendar|onboarding)/.test(n.replaceAll(' ','')))return 'Formulários e entrada';
 if(/(menu|sidebar|nav|breadcrumb|tabs|pagination|accordion|collapsible|dropdown|command|popover|tooltip|hovercard|contextmenu)/.test(n.replaceAll(' ','')))return 'Navegação e organização';
 if(/(chart|graph|table|metric|rating|stats|dashboard|distribution|data)/.test(n.replaceAll(' ','')))return 'Dados e visualização';
 if(/(avatar|member|chat|message|profile|user|team|contact|share)/.test(n.replaceAll(' ','')))return 'Identidade e comunicação';
 if(/(card|grid|stack|separator|layout|carousel|scroll|aspect|container)/.test(n.replaceAll(' ','')))return 'Layouts e estrutura';
 return 'Outros';
}
export function semanticScore(entry:DiscoveryEntry,query:string):number {
 const terms=normalize(query).split(' ').filter(Boolean);
 if(!terms.length)return 1;
 const name=normalize(entry.name);
 const description=normalize(entry.description??'');
 const intent=normalize([entry.purpose,...(entry.whenUse??[])].join(' '));
 // Every query term must match a verified positive field; not avoid/unsupported capabilities.
 if(!terms.every(term=>name.includes(term)||description.includes(term)||intent.includes(term)))return 0;
 return terms.reduce((sum,term)=>sum+(name===term?10:name.startsWith(term)?6:name.includes(term)?4:description.includes(term)?2:1),0);
}
export function discoverContracts(entries:DiscoveryEntry[],options:{query?:string;group?:string;maturity?:string;pi?:string}={}) {
 const query=options.query??'';
 return entries.map(entry=>({entry,group:functionalGroup(entry.name),score:semanticScore(entry,query)}))
  .filter(result=>result.score>0&&(options.group==='all'||!options.group||result.group===options.group)
    &&(options.maturity==='all'||!options.maturity||result.entry.maturity===options.maturity)
    &&(options.pi!=='available'||result.entry.piAvailable)
    &&(options.pi!=='unavailable'||!result.entry.piAvailable))
  .sort((a,b)=>b.score-a.score||functionalGroups.indexOf(a.group)-functionalGroups.indexOf(b.group)||a.entry.name.localeCompare(b.entry.name,'pt-BR'));
}
