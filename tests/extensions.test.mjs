import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { graphErrors } from "../scripts/lib/spec-invariants.mjs";
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const catalog=read("../src/ui-catalog/extensions/catalog.ts");
const registry=read("../src/ui-catalog/extensions/registry.tsx");
const table=read("../src/ui-catalog/extensions/components/data-table.tsx");
const date=read("../src/ui-catalog/extensions/components/date-picker.tsx");
const sources=JSON.parse(read("../src/ui-catalog/sources.json"));
const spec=JSON.parse(read("./fixtures/extensoes.json"));
const allowed=["Stack","Heading","DataTable","DatePicker"];
test("DataTable e DatePicker são extensões registradas, não sobrescritas na base",()=>{
  for(const name of ["DataTable","DatePicker"]){
    assert.ok(catalog.includes(`${name}: {`),name);
    assert.ok(registry.includes(`${name}: (`),name);
    assert.equal(sources.components.filter(c=>c.name===name&&c.status==="approved").length,1);
  }
});
test("DataTable possui recursos TanStack e contrato sem código arbitrário",()=>{
  for(const symbol of ["getCoreRowModel","getFilteredRowModel","getSortedRowModel","getPaginationRowModel","onRowSelectionChange"]) {
    assert.match(table,new RegExp(symbol));
  }
  assert.doesNotMatch(catalog,/dangerouslySetInnerHTML|className:\s*z\.string/);
});
test("DatePicker usa Calendar + Popover e formato ISO local",()=>{
  for(const symbol of ["PopoverTrigger","PopoverContent","Calendar","toIsoDate","parseIsoDate","onSelect"])assert.ok(date.includes(symbol),symbol);
  assert.match(catalog,/minDate: isoDate/);
  assert.match(catalog,/maxDate: isoDate/);
});
test("tela demonstrativa de extensões é uma árvore autorizada",()=>{
  assert.deepEqual(graphErrors(spec,allowed,{allowedEvents:{DatePicker:{events:["change"]}}}),[]);
  assert.equal(spec.elements.table.props.rows.length,0);
  assert.equal(spec.elements.table.props.sourceId,"demo-processos");
  assert.equal(spec.elements.dates.props.value,"2026-10-20");
});
