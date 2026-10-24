import test from 'node:test';
import assert from 'node:assert/strict';
import { queryDemoData } from '../src/ui-data/demo-query.mjs';
import { parseIsoDate,toIsoDate,dateError } from '../src/ui-data/date-rules.mjs';
test('servidor demonstrativo pagina 57 registros corretamente',()=>{
 const one=queryDemoData({page:0,pageSize:10,search:''}),two=queryDemoData({page:1,pageSize:10,search:''});
 assert.equal(one.total,57);assert.equal(one.rows.length,10);assert.equal(two.rows[0].id,'PROC-011');
 assert.equal(queryDemoData({page:0,pageSize:10,search:'PROC-031'}).total,1);
 assert.equal(queryDemoData({page:0,pageSize:10,search:'inexistente'}).total,0);
});
test('ordenação invertida e paginação por chave conhecida',()=>{
 const a=queryDemoData({page:0,pageSize:10,search:'',sortKey:'processo',sortDesc:true});
 assert.equal(a.rows[0].id,'PROC-057');
});
test('validade ISO, ano bissexto, limites e obrigatório',()=>{
 assert.equal(parseIsoDate('2026-02-29'),undefined);
 assert.ok(parseIsoDate('2024-02-29'));
 assert.equal(toIsoDate(new Date(2026,9,20)),'2026-10-20');
 assert.equal(dateError(null,null,null,true),'Informe uma data.');
 assert.equal(dateError('2026-10-01','2026-11-01',null,false),'Data anterior ao mínimo permitido.');
 assert.equal(dateError('2026-12-01',null,'2026-11-01',false),'Data posterior ao máximo permitido.');
 assert.equal(dateError('2026-10-20','2026-10-01','2026-10-31',true),null);
});
