/** Deterministic offline demo adapter; same pagination semantics as backend. */
const fixtures=Array.from({length:57},(_,i)=>({id:`PROC-${String(i+1).padStart(3,'0')}`,values:{
 processo:`PROC-${String(i+1).padStart(3,'0')}`,unidade:['STI','SGP','SGE'][i%3],
 situacao:['Em análise','Concluído','Pendente'][i%3],criadoEm:`2026-10-${String(i%28+1).padStart(2,'0')}`,
}}));
export function queryDemoData(query){
 const needle=query.search.toLocaleLowerCase('pt-BR');
 const filtered=fixtures.filter(row=>Object.values(row.values).some(v=>v.toLocaleLowerCase('pt-BR').includes(needle)));
 if(query.sortKey)filtered.sort((a,b)=>{
   const n=(a.values[query.sortKey]??'').localeCompare(b.values[query.sortKey]??'','pt-BR',{numeric:true});
   return query.sortDesc?-n:n;
 });
 const start=query.page*query.pageSize;
 return {rows:filtered.slice(start,start+query.pageSize),total:filtered.length};
}
