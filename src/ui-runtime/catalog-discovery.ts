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
 const n=normalize(name).replaceAll(' ','');
 if(/(alertdialog|dialog|alert|toast|sonner|confirm|notification|progress|skeleton|spinner|badge)/.test(n))return 'Confirmação e feedback';
 if(/(form|input|field|select|checkbox|radio|switch|slider|textarea|signup|login|date.?picker|calendar|onboarding)/.test(n))return 'Formulários e entrada';
 if(/(menu|sidebar|nav|breadcrumb|tabs|pagination|accordion|collapsible|dropdown|command|popover|tooltip|hovercard|contextmenu)/.test(n))return 'Navegação e organização';
 if(/(chart|graph|table|metric|rating|stats|dashboard|distribution|data)/.test(n))return 'Dados e visualização';
 if(/(avatar|member|chat|message|profile|user|team|contact|share)/.test(n))return 'Identidade e comunicação';
 if(/(card|grid|stack|separator|layout|carousel|scroll|aspect|container)/.test(n))return 'Layouts e estrutura';
 return 'Outros';
}

type SearchFields = Readonly<{name:string;description:string;intent:string}>;
export type IndexedDiscoveryEntry = Readonly<{entry:DiscoveryEntry;group:FunctionalGroup;fields:SearchFields}>;
function searchable(entry:DiscoveryEntry):SearchFields {
 return {
  name:normalize(entry.name),
  description:normalize(entry.description??''),
  intent:normalize([entry.purpose,...(entry.whenUse??[])].join(' ')),
 };
}
function scoreFields(fields:SearchFields,terms:readonly string[]):number {
 if(!terms.length)return 1;
 const {name,description,intent}=fields;
 // Only reviewed positive guidance is searchable; never turn exclusions into capabilities.
 if(!terms.every(term=>name.includes(term)||description.includes(term)||intent.includes(term)))return 0;
 return terms.reduce((sum,term)=>sum+(name===term?10:name.startsWith(term)?6:name.includes(term)?4:description.includes(term)?2:1),0);
}

/** Precompute normalized read-only evidence once per catalog revision. */
export function buildDiscoveryIndex(entries:readonly DiscoveryEntry[]):readonly IndexedDiscoveryEntry[] {
 return entries.map(entry=>({entry,group:functionalGroup(entry.name),fields:searchable(entry)}));
}

/** Preserve the public one-off scoring API for audit and callers outside the explorer. */
export function semanticScore(entry:DiscoveryEntry,query:string):number {
 return scoreFields(searchable(entry),normalize(query).split(' ').filter(Boolean));
}

type DiscoveryOptions={query?:string;group?:string;maturity?:string;pi?:string};
export function discoverIndexedContracts(index:readonly IndexedDiscoveryEntry[],options:DiscoveryOptions={}) {
 const terms=normalize(options.query??'').split(' ').filter(Boolean);
 return index.map(({entry,group,fields})=>({entry,group,score:scoreFields(fields,terms)}))
  .filter(result=>result.score>0&&(options.group==='all'||!options.group||result.group===options.group)
    &&(options.maturity==='all'||!options.maturity||result.entry.maturity===options.maturity)
    &&(options.pi!=='available'||result.entry.piAvailable)
    &&(options.pi!=='unavailable'||!result.entry.piAvailable))
  .sort((a,b)=>b.score-a.score||functionalGroups.indexOf(a.group)-functionalGroups.indexOf(b.group)||a.entry.name.localeCompare(b.entry.name,'pt-BR'));
}

/** Compatibility helper for callers with an ephemeral list. Interactive views reuse an index. */
export function discoverContracts(entries:readonly DiscoveryEntry[],options:DiscoveryOptions={}) {
 return discoverIndexedContracts(buildDiscoveryIndex(entries),options);
}
