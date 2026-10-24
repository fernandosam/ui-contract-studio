/** Backend reference — deliberately NOT mounted by Vite.
 * Integrate into an authenticated server. NEVER grant permissions from client-supplied role headers.
 * The injected authenticate(request) must verify session/SSO and return a trusted principal.
 * The injected queryProcessos runs a tenant-scoped DB query using parameterized filters.
 */
export const POLICY = Object.freeze({
  'processos-api': Object.freeze({scopes:['processos:read'],roles:['analista','gestor'],maxPageSize:100,
    sortKeys:['processo','unidade','situacao','criadoEm']}),
});
export function normalizeQuery(url) {
  const qs=new URL(url,'http://internal.invalid').searchParams;
  const page=Number(qs.get('page')??0),pageSize=Number(qs.get('pageSize')??10);
  const sortKey=qs.get('sortKey')??undefined, sortDesc=qs.get('sortDesc')==='true';
  const search=qs.get('search')??'';
  if(!Number.isSafeInteger(page)||page<0||page>100000)throw new RangeError('page inválida');
  if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>POLICY['processos-api'].maxPageSize)throw new RangeError('pageSize inválido');
  if(search.length>160)throw new RangeError('pesquisa extensa');
  if(sortKey&&!POLICY['processos-api'].sortKeys.includes(sortKey))throw new RangeError('campo de ordenação não permitido');
  if(qs.get('sortDesc')!==null&&!['true','false'].includes(qs.get('sortDesc')))throw new RangeError('ordenação inválida');
  return {page,pageSize,search,sortKey,sortDesc};
}
export function authorizePrincipal(principal,sourceId='processos-api') {
  const policy=POLICY[sourceId];
  // Deny by default: identities, scopes and tenant must come from authenticated server session.
  return Boolean(policy&&principal?.authenticated===true&&typeof principal?.tenantId==='string'&&principal.tenantId.length>0&&
    Array.isArray(principal.roles)&&policy.roles.some(role=>principal.roles.includes(role))&&
    Array.isArray(principal.scopes)&&policy.scopes.every(scope=>principal.scopes.includes(scope)));
}
export function createProcessosHandler({authenticate,queryProcessos}){
  if(typeof authenticate!=='function'||typeof queryProcessos!=='function')throw new TypeError('Dependências seguras obrigatórias');
  return async function handle(request){
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Cookie'};
    const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
    if(request.method!=='GET')return reply(405,{error:'Método não permitido'});
    let principal;
    try{principal=await authenticate(request);}catch{return reply(401,{error:'Não autenticado'});}
    if(!principal?.authenticated)return reply(401,{error:'Não autenticado'});
    if(!authorizePrincipal(principal))return reply(403,{error:'Acesso negado'});
    let query;
    try{query=normalizeQuery(request.url);}catch{return reply(400,{error:'Parâmetros inválidos'});}
    try{
      // Query implementation MUST enforce tenantId in database WHERE (not merely in client UI).
      const data=await queryProcessos({...query,tenantId:principal.tenantId,principalId:principal.id});
      if(!Array.isArray(data?.rows)||data.rows.length>query.pageSize||!Number.isSafeInteger(data?.total)||data.total<0)throw new Error('resposta de dados inválida');
      return reply(200,{rows:data.rows,total:data.total});
    }catch{return reply(500,{error:'Falha interna na consulta'});}
  };
}
