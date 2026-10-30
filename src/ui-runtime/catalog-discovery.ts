/** Read-only discovery over existing reviewed contracts. Never used as admission policy. */
import {createContractVersionedCache} from './contract-cache.mjs';
export type DiscoveryEntry = {
 name:string;
 description?:string;
 purpose?:string;
 whenUse?:string[];
 maturity?:string;
 piAvailable:boolean;
 /** Reviewed lock identity. Omitted/invalid metadata disables caching. */
 version?:string;
 fingerprint?:string;
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
type SearchIndexRow = {name:string;description:string;intent:string;group:FunctionalGroup};
const indexCache=createContractVersionedCache<SearchIndexRow[]>({maxEntries:8,ttlMs:5*60*1000});
const indexRow=(entry:DiscoveryEntry):SearchIndexRow=>({
 name:normalize(entry.name),
 description:normalize(entry.description??''),
 intent:normalize([entry.purpose,...(entry.whenUse??[])].join(' ')),
 group:functionalGroup(entry.name),
});

/**
 * Cache only the normalized PUBLIC catalog index. User-entered search terms,
 * filters and result sets are never cached. Every index depends on the reviewed
 * version/fingerprint of every contract and on the actual public guidance text.
 */
function prepareIndex(entries:DiscoveryEntry[]):SearchIndexRow[] {
 const key=JSON.stringify(entries.map(entry=>[
  entry.name,entry.description,entry.purpose,entry.whenUse,
  entry.maturity,entry.piAvailable,
 ]));
 const request={
  scope:'public-contract-derived' as const,namespace:'catalog-discovery',
  key,contracts:entries.map(entry=>({
   name:entry.name,version:entry.version??'',fingerprint:entry.fingerprint??'',
  })),
 };
 const hit=indexCache.get(request);
 if(hit && hit.length===entries.length)return hit;
 const built=entries.map(indexRow);
 indexCache.set(request,built); // Invalid/absent lock metadata fails closed.
 return built;
}

function scoreIndexed(row:SearchIndexRow,terms:string[]):number {
 if(!terms.length)return 1;
 const {name,description,intent}=row;
 if(!terms.every(term=>name.includes(term)||description.includes(term)||intent.includes(term)))return 0;
 return terms.reduce((sum,term)=>sum+(name===term?10:name.startsWith(term)?6:name.includes(term)?4:description.includes(term)?2:1),0);
}

export function semanticScore(entry:DiscoveryEntry,query:string):number {
 return scoreIndexed(indexRow(entry),normalize(query).split(' ').filter(Boolean));
}

export function discoverContracts(entries:DiscoveryEntry[],options:{query?:string;group?:string;maturity?:string;pi?:string}={}) {
 const terms=normalize(options.query??'').split(' ').filter(Boolean);
 const index=prepareIndex(entries);
 return entries.map((entry,i)=>({entry,group:index[i].group,score:scoreIndexed(index[i],terms)}))
  .filter(result=>result.score>0&&(options.group==='all'||!options.group||result.group===options.group)
    &&(options.maturity==='all'||!options.maturity||result.entry.maturity===options.maturity)
    &&(options.pi!=='available'||result.entry.piAvailable)
    &&(options.pi!=='unavailable'||!result.entry.piAvailable))
  .sort((a,b)=>b.score-a.score||functionalGroups.indexOf(a.group)-functionalGroups.indexOf(b.group)||a.entry.name.localeCompare(b.entry.name,'pt-BR'));
}
