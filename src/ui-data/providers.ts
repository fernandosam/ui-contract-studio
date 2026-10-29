/** Approved source IDs are resolved to code-owned adapters, NEVER to AI supplied URLs.
 * The demo adapter performs the same query contract as a server without a backend.
 * The API adapter requires an authenticated server at /api/ui-data/processos.
 */
import { z } from 'zod';
import { queryDemoData } from './demo-query.mjs';
import { canReadDataSource } from './source-policy.mjs';
import type { DataAccessCapabilities } from './data-access-context';
export type DataRow = {id:string;values:Record<string,string>};
export type PageQuery = { page:number; pageSize:number; search:string; sortKey?:string; sortDesc?:boolean };
export type PageResult = { rows:DataRow[]; total:number };
export type SourceId = 'demo-processos' | 'processos-api';
const responseSchema = z.object({
  rows: z.array(z.object({id:z.string(),values:z.record(z.string(),z.string())})).max(100),
  total: z.number().int().min(0),
}).strict();
export async function loadDataPage(sourceId:SourceId,query:PageQuery,signal?:AbortSignal,capabilities?:DataAccessCapabilities):Promise<PageResult>{
 if(signal?.aborted) throw new DOMException('Aborted','AbortError');
 if(!Number.isSafeInteger(query.page)||query.page<0||!Number.isSafeInteger(query.pageSize)||query.pageSize<1||query.pageSize>100||query.search.length>160) throw new Error('Consulta inválida');
 if(sourceId==='demo-processos') return queryDemoData(query);
 if(sourceId!=='processos-api') throw new Error('Fonte de dados não aprovada');
 // A spec's sourceId is data, never an authorization to contact a server.
 if(!canReadDataSource(sourceId, capabilities)) throw new Error('Integração externa não habilitada pelo hospedeiro');
 const params=new URLSearchParams({page:String(query.page),pageSize:String(query.pageSize),search:query.search});
 if(query.sortKey) {params.set('sortKey',query.sortKey);params.set('sortDesc',String(Boolean(query.sortDesc)));}
 const response=await fetch(`/api/ui-data/processos?${params.toString()}`,{
    signal,credentials:'same-origin',headers:{Accept:'application/json'},redirect:'error',cache:'no-store',
 });
 if(!response.ok) throw new Error(`Falha ao carregar dados (HTTP ${response.status})`);
 return responseSchema.parse(await response.json());
}
