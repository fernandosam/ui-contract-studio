export type CompositeTemplateNode = { type:string; props:Record<string,unknown>; children?:string[]; on?:Record<string,unknown> };
export type CompositeTemplate = {root:string;elements:Record<string,CompositeTemplateNode>};
export type CompositeOverrides = {
  title?:string; description?:string; metricValue?:string; primaryActionLabel?:string;
  inputValue?:string; chartTitle?:string; content?:Record<string,string|undefined>;
  nodeProps?:Record<string,Record<string,unknown>>;
};
export declare function compileComposition(template:CompositeTemplate,props?:CompositeOverrides):CompositeTemplate;
