import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizePrincipal,normalizeQuery,createProcessosHandler} from '../server-example/processos-route.mjs';
const principal={id:'u1',authenticated:true,tenantId:'org-1',roles:['analista'],scopes:['processos:read']};
test('acesso à fonte somente com sessão, tenant, role e scope confiáveis',()=>{
 assert.equal(authorizePrincipal(principal),true);
 for(const p of [null,{...principal,authenticated:false},{...principal,tenantId:''},{...principal,roles:[]},{...principal,scopes:[]}])assert.equal(authorizePrincipal(p),false);
});
test('consulta rejeita valores não autorizados',()=>{
 for(const q of ['?page=-1','?pageSize=101','?sortKey=password','?sortDesc=maybe','?search='+ 'x'.repeat(161)]){
  assert.throws(()=>normalizeQuery('http://localhost/api/ui-data/processos'+q));
 }
});
test('handler bloqueia usuário não autorizado e não executa query',async()=>{
 let called=0;
 const handler=createProcessosHandler({authenticate:async()=>({...principal,scopes:[]}),queryProcessos:async()=>{called++;return {rows:[],total:0};}});
 const result=await handler(new Request('https://app.local/api/ui-data/processos'));
 assert.equal(result.status,403);assert.equal(called,0);
});
test('handler escopa consulta por tenant autenticado',async()=>{
 let received;
 const handler=createProcessosHandler({authenticate:async()=>principal,queryProcessos:async query=>{received=query;return{rows:[],total:0}}});
 const response=await handler(new Request('https://app.local/api/ui-data/processos?page=2&pageSize=5&sortKey=processo'));
 assert.equal(response.status,200);
 assert.deepEqual({tenant:received.tenantId,page:received.page,sortKey:received.sortKey},{tenant:'org-1',page:2,sortKey:'processo'});
 assert.equal(response.headers.get('Cache-Control'),'no-store');
});
