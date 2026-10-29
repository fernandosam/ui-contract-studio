import { useContext, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import {
 flexRender,getCoreRowModel,getFilteredRowModel,getPaginationRowModel,getSortedRowModel,useReactTable,
 type ColumnDef,type RowSelectionState,type SortingState,type PaginationState,
} from '@tanstack/react-table';
import { useBoundProp } from '@json-render/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from '@/components/ui/table';
import { loadDataPage,type DataRow,type SourceId } from '@/ui-data/providers';
import { DataAccessContext } from '@/ui-data/data-access-context';

export type DataColumn = {key:string;label:string;sortable:boolean;type?:'text'|'number'|'date'|'status'};
export type DataTableProps = {
 caption:string|null;columns:DataColumn[];rows:DataRow[];pageSize:number|null;
 searchable:boolean|null;selectable:boolean|null;
 sourceId?:SourceId|null;selectedIds?:string[]|null;
};
export function DataTable({props,selectionPath,onSelectionChange,onPageChange,onSortChange}:{
 props:DataTableProps;selectionPath?:string;onSelectionChange?:()=>void;onPageChange?:()=>void;onSortChange?:()=>void;
}) {
 const {caption,columns:config,rows, pageSize, searchable, selectable, sourceId}=props;
 const capabilities=useContext(DataAccessContext);
 const remoteData=capabilities.remoteData;
 const remote=Boolean(sourceId);
 const [sorting,setSorting]=useState<SortingState>([]);
 const [query,setQuery]=useState('');
 const [debouncedQuery,setDebouncedQuery]=useState('');
 // Debounce only server requests; local rows remain responsive while typing.
 useEffect(()=>{const timeout=setTimeout(()=>setDebouncedQuery(query),300);return ()=>clearTimeout(timeout);},[query]);
 const [pagination,setPagination]=useState<PaginationState>({pageIndex:0,pageSize:pageSize??10});
 const [result,setResult]=useState<{rows:DataRow[],total:number}>({rows:[],total:0});
 const [pending,setPending]=useState(false);
 const [fetchError,setFetchError]=useState<string|null>(null);
 const [localSelection,setLocalSelection]=useState<RowSelectionState>({});
 const [boundIds,setBoundIds]=useBoundProp<string[]>(props.selectedIds??[],selectionPath);
 const selection=useMemo<RowSelectionState>(()=>selectionPath
  ? Object.fromEntries((boundIds??[]).map(id=>[id,true])) : localSelection,
  [selectionPath,boundIds,localSelection]);
 const firstSort=sorting[0];
 useEffect(()=>{
   if(!sourceId) return;
   const controller=new AbortController();
   setPending(true);setFetchError(null);
   loadDataPage(sourceId,{page:pagination.pageIndex,pageSize:pagination.pageSize,search:debouncedQuery,
     sortKey:firstSort?.id,sortDesc:firstSort?.desc},controller.signal,{remoteData})
    .then(next=>{if(!controller.signal.aborted)setResult(next);})
    .catch(error=>{if(!controller.signal.aborted)setFetchError(error instanceof Error?error.message:'Erro ao carregar dados');})
    .finally(()=>{if(!controller.signal.aborted)setPending(false);});
   return ()=>controller.abort();
 },[sourceId,remoteData,pagination.pageIndex,pagination.pageSize,debouncedQuery,firstSort?.id,firstSort?.desc]);
 const cols=useMemo<ColumnDef<DataRow>[]>(()=>[
   ...(selectable ? [{id:'selection',header:({table})=><input type="checkbox" aria-label="Selecionar todas as linhas desta página"
     checked={table.getIsAllPageRowsSelected()} onChange={e=>table.toggleAllPageRowsSelected(e.target.checked)}/>,
     cell:({row})=><input type="checkbox" aria-label={`Selecionar ${row.original.id}`}
     checked={row.getIsSelected()} onChange={e=>row.toggleSelected(e.target.checked)}/>,enableSorting:false} satisfies ColumnDef<DataRow>] : []),
   ...config.map((column):ColumnDef<DataRow>=>({id:column.key,accessorFn:row=>row.values[column.key]??'',
     header:({column:col})=>column.sortable?<Button variant="ghost" size="sm"
       onClick={()=>col.toggleSorting(col.getIsSorted()==='asc')} aria-label={`Ordenar por ${column.label}`}>
       {column.label}{col.getIsSorted()==='asc'?<ArrowUp className="size-4"/>:col.getIsSorted()==='desc'?<ArrowDown className="size-4"/>:<ArrowUpDown className="size-4 opacity-50"/>}
       </Button>:column.label,
     enableSorting:column.sortable,
     sortingFn:column.type==='number'?'alphanumeric':'auto',
     cell:({getValue})=><span className={column.type==='number'?'tabular-nums':''}>{String(getValue()??'')}</span>,
   })),
 ],[config,selectable]);
 const table=useReactTable({data:remote?result.rows:rows,columns:cols,
   state:{sorting,globalFilter:query,rowSelection:selection,pagination},
   onSortingChange:updater=>{setSorting(updater);setPagination(p=>({...p,pageIndex:0}));onSortChange?.();},
   onGlobalFilterChange:updater=>{setQuery(updater);setPagination(p=>({...p,pageIndex:0}));},
   onPaginationChange:updater=>{setPagination(updater);onPageChange?.();},
   onRowSelectionChange:updater=>{
     const next=typeof updater==='function'?updater(selection):updater;
     if(selectionPath)setBoundIds(Object.keys(next).filter(id=>next[id]));else setLocalSelection(next);
     onSelectionChange?.();
   },
   getRowId:row=>row.id,getCoreRowModel:getCoreRowModel(),
   ...(remote?{manualPagination:true,manualSorting:true,manualFiltering:true,
      pageCount:Math.max(1,Math.ceil(result.total/pagination.pageSize))}:
     {getFilteredRowModel:getFilteredRowModel(),getSortedRowModel:getSortedRowModel(),getPaginationRowModel:getPaginationRowModel()}),
   enableRowSelection:Boolean(selectable),
 });
 const count=remote?result.total:table.getFilteredRowModel().rows.length;
 return <section className="w-full space-y-3" aria-label={caption??'Tabela de dados'}>
  {searchable&&<div className="relative max-w-sm"><Search aria-hidden="true" className="absolute left-3 top-2.5 size-4 text-muted-foreground"/>
    <Input aria-label="Pesquisar linhas" className="pl-9" value={query} placeholder="Pesquisar..." onChange={e=>table.setGlobalFilter(e.target.value)}/></div>}
  {fetchError&&<p role="alert" className="text-sm text-destructive">{fetchError}</p>}
  <div className="overflow-x-auto rounded-md border border-border" aria-busy={pending}>
   <Table>{caption&&<caption className="sr-only">{caption}</caption>}
    <TableHeader>{table.getHeaderGroups().map(group=><TableRow key={group.id}>{group.headers.map(h=><TableHead key={h.id}>{h.isPlaceholder?null:flexRender(h.column.columnDef.header,h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
    <TableBody>{pending?<TableRow><TableCell colSpan={cols.length} className="py-8 text-center">Carregando dados...</TableCell></TableRow>:table.getRowModel().rows.length?table.getRowModel().rows.map(row=><TableRow key={row.id} data-state={row.getIsSelected()?'selected':undefined}>
     {row.getVisibleCells().map(cell=><TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell,cell.getContext())}</TableCell>)}</TableRow>):
     <TableRow><TableCell colSpan={cols.length} className="py-8 text-center text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>}</TableBody>
   </Table>
  </div>
  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
   <span>{count} registro(s){selectable?` · ${Object.keys(selection).filter(id=>selection[id]).length} selecionado(s)`:''}</span>
   <div className="flex items-center gap-2"><span>Página {pagination.pageIndex+1} de {Math.max(1,table.getPageCount())}</span>
    <Button variant="outline" size="sm" onClick={()=>table.previousPage()} disabled={pending||!table.getCanPreviousPage()}>Anterior</Button>
    <Button variant="outline" size="sm" onClick={()=>table.nextPage()} disabled={pending||!table.getCanNextPage()}>Próxima</Button>
   </div>
  </div>
 </section>;
}
