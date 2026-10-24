import { readFileSync, existsSync } from 'node:fs';
import { catalog, componentDefinitions, componentEventDescriptors, actionDefinitions } from '../src/ui-catalog/catalog';
import { graphErrors } from './lib/spec-invariants.mjs';

const read = (file: string) => JSON.parse(readFileSync(file, 'utf8'));
const inventory = read('src/ui-catalog/create-preview-inventory.json') as { previews: Array<{cards:Array<{id:string; sourcePath:string}>}> };
const reference = read('src/ui-catalog/create-reference-audit.json') as { cards: Array<{name:string; originalTitle:string; sourceStatus:string; visualStatus:string}> };
const reviewed = new Map(reference.cards.map(c=>[c.name,c]));
const version = read('src/ui-catalog/contracts.lock.json') as {components:Array<{name:string;status:string;tier:string}>};
const approved = new Set(version.components.filter(c=>c.status==='approved').map(c=>c.name));
const preexisting = new Set(version.components.filter(c=>c.tier==='base').map(c=>c.name).concat(['DataTable','DatePicker','Field']));
const declared = new Set(Object.keys(componentDefinitions));
const generatedManifest=read('src/ui-catalog/extensions/composites/generated-manifest.json') as {components:Array<{name:string;template:string}>};
const generatedNames = new Set(generatedManifest.components.map(x=>x.name));
const errors: string[]=[];
let count=0;
for (const preview of inventory.previews) for(const card of preview.cards){
  const name=card.id;
  if((card as {representation?:string}).representation==='inline-primitives'){
    const screen=inventory.previews.find(p=>p.cards.includes(card)) as unknown as {screen:string};
    const spec=read(`src/ui-screens/${screen.screen}.json`);
    const root=spec.elements[(card as unknown as {inlineRoot:string}).inlineRoot];
    if(root?.type!=='Card')errors.push(`${name}: demonstração inline não possui Card raiz`);
    count++;continue;
  }
  const slug=name.replace(/(?!^)(?=[A-Z])/g,'-').toLowerCase();
  const paths={ template:`src/ui-catalog/extensions/composites/templates/${slug}.json` };
  if(!generatedNames.has(name))errors.push(`${name}: registro gerado ausente`);
  if (!approved.has(name) || !declared.has(name)) errors.push(`${name}: componente não aprovado`);
  for(const [kind, path] of Object.entries(paths)) if(!existsSync(path))errors.push(`${name}: ${kind} ausente: ${path}`);
  if (!existsSync(paths.template))continue;
  const spec=read(paths.template);
  const issues=graphErrors(spec,[...preexisting],{allowedActions:Object.keys(actionDefinitions),allowedEvents:componentEventDescriptors});
  errors.push(...issues.map((issue:string)=>`${name}: ${issue}`));
  const checked=catalog.validate(spec);
  if(!checked.success)errors.push(`${name}: schema inválido: ${checked.error?.message ?? "Especificação inválida"}`);
  if(spec.elements[spec.root]?.type!=='Card')errors.push(`${name}: template sem Card na raiz`);
  if(spec.elements[spec.root]?.props?.title!==reviewed.get(name)?.originalTitle)errors.push(`${name}: título não corresponde ao registro da referência oficial`);
  if(reviewed.get(name)?.sourceStatus!=='read')errors.push(`${name}: exige leitura do código-fonte antes da composição`);
  count++;
}
if(count!==64)errors.push(`Esperadas 64 demonstrações, encontradas ${count}`);
if(errors.length){for(const e of errors)console.error(`✗ ${e}`);process.exit(1);}
console.log(`✓ ${count} demonstrações (composições aprovadas e primitivas inline) verificadas.`);
