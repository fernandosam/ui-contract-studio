export type PageQuery={page:number;pageSize:number;search:string;sortKey?:string;sortDesc?:boolean};
export type DataRow={id:string;values:Record<string,string>};
export type PageResult={rows:DataRow[];total:number};
export declare function queryDemoData(query:PageQuery):PageResult;
