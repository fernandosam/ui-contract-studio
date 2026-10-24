import ts from 'typescript';

export type PreviewTextCatalog = Record<string, string>;
export type PreviewTextResult = {code: string; messages: string[]; missing: string[]; replacements: number};

const visibleAttributes = new Set(['alt','title','placeholder','aria-label','aria-description','aria-placeholder','aria-valuetext','label','description','message','helperText','hint','caption','emptyMessage','buttonLabel','tooltip','text','heading','subtitle']);
const visibleProperties = new Set(['label','title','description','content','trigger','message','placeholder','helperText','hint','caption','heading','subtitle','question','answer','text','emptyMessage','tooltip','buttonLabel','statusLabel','notification','summary','badgeText','ariaLabel']);
const visibleVariables = /(?:label|title|description|message|placeholder|hint|caption|heading|subtitle|text|question|answer|tooltip|names|options|steps|choices|statuses|days|months)$/i;

export function normalizePreviewText(value: string): string {
  return value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();
}
function isHumanText(value: string): boolean {
  if(!/[A-Za-z]/.test(value)||value.length<2)return false;
  if(/^(https?:\/\/|mailto:|@\/|\.\/|\/|#|--|data:|var\(|#[0-9a-f]{3,}|[a-z]+:\/\/)/i.test(value))return false;
  if(/^[a-z0-9_-]+(?:\/[a-z0-9_-]+)+$/i.test(value))return false;
  if(/^[A-Z]{1,3}$/.test(value))return false;
  return true;
}
type TextPart={start:number;end:number;value:string;kind:'jsx'|'string'};
const attrName=(node:ts.JsxAttribute)=>node.name.getText();
function inVisibleJsxContext(node:ts.Node):boolean{
 let child:ts.Node=node;
 for(let parent=node.parent;parent;child=parent,parent=parent.parent){
  if(ts.isJsxAttribute(parent))return visibleAttributes.has(attrName(parent));
  if(ts.isJsxExpression(parent))return true;
  if(ts.isCallExpression(parent)&&child!==parent.expression)return false;
  if(ts.isArrowFunction(parent)||ts.isFunctionExpression(parent))return false;
 }
 return false;
}
function isVisibleString(node:ts.StringLiteral,source:ts.SourceFile):boolean{
 const parent=node.parent;
 if(ts.isJsxAttribute(parent))return visibleAttributes.has(attrName(parent));
 if(ts.isPropertyAssignment(parent)&&parent.initializer===node){
  const name=parent.name.getText(source).replace(/^['"]|['"]$/g,'');
  return visibleProperties.has(name);
 }
 if(ts.isVariableDeclaration(parent)&&parent.initializer===node)return visibleVariables.test(parent.name.getText(source));
 if(ts.isArrayLiteralExpression(parent)){
  let ancestor:ts.Node|undefined=parent.parent;
  while(ancestor&&!ts.isVariableDeclaration(ancestor)&&!ts.isPropertyAssignment(ancestor)&&!ts.isJsxExpression(ancestor))ancestor=ancestor.parent;
  if(ancestor&&ts.isVariableDeclaration(ancestor))return visibleVariables.test(ancestor.name.getText(source));
  if(ancestor&&ts.isPropertyAssignment(ancestor))return visibleProperties.has(ancestor.name.getText(source));
 }
 return inVisibleJsxContext(node);
}
export function isReuiExampleModule(filename:string):boolean{
 return /(?:^|[/\\])reui-[a-z0-9-]+-\d+\.tsx(?:\?.*)?$/.test(filename);
}
function getVisibleParts(code:string,filename:string):TextPart[]{
 if(!isReuiExampleModule(filename))return [];
 const source=ts.createSourceFile(filename,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const parts:TextPart[]=[];
 function add(start:number,end:number,raw:string,kind:TextPart['kind']){
  const value=normalizePreviewText(raw);
  if(isHumanText(value))parts.push({start,end,value,kind});
 }
 const visit=(node:ts.Node)=>{
  if(ts.isJsxText(node))add(node.pos,node.end,code.slice(node.pos,node.end),'jsx');
  else if(ts.isStringLiteral(node)&&isVisibleString(node,source))add(node.getStart(source),node.end,node.text,'string');
  ts.forEachChild(node,visit);
 };
 visit(source);
 return parts.sort((a,b)=>a.start-b.start);
}
export function extractPreviewTexts(code:string,filename:string):string[]{
 return [...new Set(getVisibleParts(code,filename).map(p=>p.value))];
}
function localizedJsx(raw:string,translated:string){
 const lead=raw.match(/^\s*/)?.[0]??'';
 const trail=raw.match(/\s*$/)?.[0]??'';
 return lead+translated.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+trail;
}
export function transformReuiPreviewText(code:string,filename:string,catalog:PreviewTextCatalog,strict=false):PreviewTextResult{
 const parts=getVisibleParts(code,filename);
 const missing:string[]=[];
 const edits:{start:number;end:number;text:string}[]=[];
 for(const part of parts){
  const translation=catalog[part.value];
  if(!translation?.trim()){missing.push(part.value);continue;}
  const text=part.kind==='jsx'?localizedJsx(code.slice(part.start,part.end),translation):JSON.stringify(translation);
  edits.push({start:part.start,end:part.end,text});
 }
 if(strict&&missing.length)throw new Error(filename+': '+missing.length+' textos sem tradução: '+[...new Set(missing)].slice(0,8).join(' | '));
 let result=code;
 for(const edit of edits.reverse())result=result.slice(0,edit.start)+edit.text+result.slice(edit.end);
 return {code:result,messages:[...new Set(parts.map(p=>p.value))],missing:[...new Set(missing)],replacements:edits.length};
}