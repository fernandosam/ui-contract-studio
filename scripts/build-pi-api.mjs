#!/usr/bin/env node
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const lock=read('src/ui-catalog/contracts.lock.json');const sources=read('src/ui-catalog/sources.json');
const configs=read('src/ui-catalog/composite-content-fields.json').components;
const semanticGuidance=read('src/ui-catalog/semantic-contract-guidance.json').contracts;
const composed=read('src/ui-catalog/extensions/composites/generated-manifest.json').components;
const templates=new Map(composed.map(e=>[e.name,read('src/ui-catalog/extensions/composites/templates/'+e.template)]));
const allowedNodeProps=new Set(['title','description','label','text','placeholder','content','trigger','value','defaultValue','defaultChecked','checked','disabled','required','readOnly','options','columns','rows','data','sections','active','footer','heading','items','variant','orientation','size','min','max','step','prefix','suffix','change','changeType','caption','alt','width','height','open','defaultOpen','maxWidth','centered','gap','direction','align','justify','tabs','type','level','color','rounded','invalid','pressed','defaultPressed','collapsible','side','decorative','minDate','maxDate']);
const sourceByName=new Map(sources.components.map(x=>[x.name,x]));
function semanticContentFields(fields){
  const seen = new Map();
  return fields.map(field=>{
    const [,property='value']=field.path.split('.');
    const words=String(field.default??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean).slice(0,6);
    const stem=words.map((w,i)=>i? w[0].toUpperCase()+w.slice(1).toLowerCase() : w[0].toLowerCase()+w.slice(1)).join('') || 'field';
    const suffix=property[0].toUpperCase()+property.slice(1);
    const key=stem.toLowerCase().endsWith(property.toLowerCase())?stem:stem+suffix;
    const nth=(seen.get(key)??0)+1;seen.set(key,nth);
    return {...field,semanticName:nth===1?key:`${key}${nth}`};
  });
}
const interactive=new Set(['SiteCardsActivityGoal','SiteCardsChat','SiteCardsCookieSettings','SiteCardsPaymentMethod','SiteCardsTeamMembers','BlockSidebar','DataTable','DatePicker','OnboardingChecklist','CharacterCountTextarea']);
const contracts=lock.components.map(c=>{
 const source=sourceByName.get(c.name);
 const config=configs[c.name];
 const template=templates.get(c.name);
 const editableNodes=template ? Object.entries(template.elements).map(([nodeId,node])=>({nodeId,type:node.type,properties:Object.keys(node.props??{}).filter(k=>allowedNodeProps.has(k)&&!(nodeId===template.root&&['title','description'].includes(k))).map(k=>({name:k,valueType:Array.isArray(node.props[k])?'array':node.props[k]===null?'nullable':typeof node.props[k],sample:node.props[k]}))})).filter(n=>n.properties.length) : [];
 return {
  type:c.name,version:c.version,tier:c.tier,sourceUrl:source?.sourceUrl??null,
  zodSource:c.tier==='base'?'src/ui-catalog/catalog.ts':'src/ui-catalog/extensions/catalog.ts',
  example:`pi-catalog/examples/${c.name}.json`,
  capability:interactive.has(c.name)?'local-interactive':config?'configurable-composition':c.tier==='base'?'declared-primitive':'approved-adapter',
  configuredContentFields:config?semanticContentFields(config.fields):[],
  configurableNodeProperties:editableNodes,
  nodePropsProperty:template?'nodeProps':null,
  contentProperty:config?'content':null,
  interactionBoundary:interactive.has(c.name)?'Ações locais, sem persistência remota':'Ações declaradas restritas; não presumir persistência ou backend',
  propsSourceOfTruth:'Consultar props Zod no zodSource; JSON de exemplo NÃO substitui schema',
  ...(semanticGuidance[c.name]?{semanticGuidance:semanticGuidance[c.name]}:{}),
  hasSemanticAPI:['SiteCardsActivityGoal','SiteCardsChat','SiteCardsCookieSettings','SiteCardsPaymentMethod','SiteCardsTeamMembers','OnboardingChecklist','RatingDistribution','CharacterCountTextarea'].includes(c.name),
  visualStatus:source?.notes?.includes('homologad')?'require-human-review':'not-certified',
 };
});
const experimentalEntries=read('src/ui-catalog/admission-engine/entries.json').entries;
const certificates=read('src/ui-catalog/admission-engine/certifications.json').components;
const experimentalContracts=experimentalEntries.map(entry=>{
  const cert=certificates[entry.type];
  const verified=Boolean(entry.e2eProtocol && cert?.status==='passed' &&
    cert?.sourceDigest===entry.sourceDigest && cert?.protocol===entry.e2eProtocol);
  return {type:entry.type,version:entry.version,tier:'composition',
    lifecycle:verified?'stable':'experimental',
    sourceUrl:null,zodSource:'src/ui-catalog/admission-engine/generated/'+entry.type+'.schema.ts',
    example:entry.example,capability:'local-interactive',
    sourceDigest:entry.sourceDigest,e2eProtocol:entry.e2eProtocol,
    validation:{static:'passed',e2e:verified?'passed':'pending'},
    interactionBoundary:'Somente UI local: sem chamadas remotas nem permissões adicionais'};
});
// A single authoritative collection: maturity is a property of each contract,
// never an implication of which array happens to contain it.
const components=[
  ...contracts.map(contract=>({...contract,lifecycle:'stable',
    validation:{static:'approved',e2e:'not-recorded'}})),
  ...experimentalContracts,
];
const names=components.map(c=>c.type);
if(new Set(names).size!==names.length)throw Error('Duplicated Pi component type');
const manifest={schemaVersion:3,projectVersion:read('package.json').version,
  policy:'O Pi pode criar APENAS specs JSON, usando Zod, exemplos e actionDefinitions. Content e nodeProps só podem editar chaves autorizadas do template; não alteram eventos, estilos arbitrários, URLs ou tipos de componentes.',
  defaultRoute:'/?screen=reui',
  sourceOfTruth:['src/ui-catalog/catalog.ts','src/ui-catalog/extensions/catalog.ts','src/ui-catalog/admission-engine/generated/definitions.ts','src/ui-catalog/registry.tsx'],
  actions:['setState','pushState','removeState','buttonClick','formSubmit','linkClick'],
  components};
const file='pi-catalog/contracts.json';const value=JSON.stringify(manifest,null,2)+'\n';
if(process.argv.includes('--write')){mkdirSync('pi-catalog',{recursive:true});writeFileSync(file,value)}
else if(!existsSync(file)||readFileSync(file,'utf8')!==value){console.error('Manifesto Pi ausente/desatualizado: npm run pi:api');process.exit(1)}
console.log(`✓ manifesto Pi v3: ${components.length} contratos, ${Object.keys(configs).length} composições configuráveis`);
