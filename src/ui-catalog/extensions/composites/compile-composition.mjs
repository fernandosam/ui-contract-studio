/** Pure and side-effect-free transform of reviewed JSON templates.
 * All callers must validate the returned spec through the Zod catalog.
 */
export function compileComposition(template,props={}){
 const elements={};let metric=false,action=false,input=false,chart=false;
 for(const [key,node] of Object.entries(template.elements)){
  const currentProps={...node.props};
  if(key===template.root){
   if(props.title!==undefined)currentProps.title=props.title;
   if(props.description!==undefined)currentProps.description=props.description;
  }
  if(node.type==='Metric'&&!metric&&props.metricValue!==undefined){currentProps.value=props.metricValue;metric=true;}
  if(node.type==='Button'&&!action&&props.primaryActionLabel!==undefined){currentProps.label=props.primaryActionLabel;action=true;}
  if(node.type==='Input'&&!input&&props.inputValue!==undefined){currentProps.value=props.inputValue;input=true;}
  if((node.type==='LineGraph'||node.type==='BarGraph')&&!chart&&props.chartTitle!==undefined){currentProps.title=props.chartTitle;chart=true;}
  for(const field of ['title','description','label','text','content','placeholder','trigger']){
   const candidate=props.content?.[`${key}.${field}`];
   if(candidate!==undefined&&typeof currentProps[field]==='string'&&
     !(key===template.root&&((field==='title'&&props.title!==undefined)||(field==='description'&&props.description!==undefined))))currentProps[field]=candidate;
  }
  // Bounded overrides are checked against a generated per-component Zod schema
  // in the parent catalog. Never accept type/children/slots/on/action fields.
  const nodeOverrides=props.nodeProps?.[key];
  if(nodeOverrides && typeof nodeOverrides==='object' && !Array.isArray(nodeOverrides)){
   for(const [field,value] of Object.entries(nodeOverrides)){
    // Editable properties must already exist in the reviewed template.
    if(!Object.hasOwn(node.props,field))continue;
    if(['name','href','src','sourceId','checks','on','bindings','action','handler','id'].includes(field))continue;
    if(field.startsWith('$')||field.startsWith('on'))continue;
    currentProps[field]=value;
   }
  }
  if(key===template.root){
   if(props.title!==undefined)currentProps.title=props.title;
   if(props.description!==undefined)currentProps.description=props.description;
  }
  elements[key]={...node,props:currentProps};
 }
 return {root:template.root,elements};
}
