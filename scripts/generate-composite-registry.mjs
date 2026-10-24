#!/usr/bin/env node
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/** Reviewed declarative manifest is source of truth; no arbitrary code is evaluated. */
const manifestPath='src/ui-catalog/extensions/composites/generated-manifest.json';
const output='src/ui-catalog/extensions/generated/composite-implementations.tsx';
const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
const rows=[...manifest.components].sort((a,b)=>a.name.localeCompare(b.name));
const errors=[];
const validIdentifier=/^[A-Za-z][A-Za-z0-9]*$/;
const validTemplate=/^[a-z0-9-]+\.json$/;
const names=new Set(),templates=new Set();
for(const row of rows){
 if(!validIdentifier.test(row.name)||!validTemplate.test(row.template))errors.push(`Invalid entry: ${JSON.stringify(row)}`);
 if(names.has(row.name)||templates.has(row.template))errors.push(`Duplicate name/template: ${row.name}`);
 names.add(row.name);templates.add(row.template);
 if(row.blockSlug&&!/^[a-z0-9-]+$/.test(row.blockSlug))errors.push(`Invalid block slug for ${row.name}`);
 if(!existsSync(`src/ui-catalog/extensions/composites/templates/${row.template}`))errors.push(`${row.name}: missing template`);
}
if(rows.length<1)errors.push("The reviewed registry may not be empty");
if(errors.length){errors.forEach(e=>console.error('✗ '+e));process.exit(1)}
const imports=rows.map((row,i)=>`import template${i} from '../composites/templates/${row.template}';`).join('\n');
const mapping=rows.map((row,i)=>`  ${row.name}: createComposite<z.infer<typeof extensionDefinitions.${row.name}.props>>(template${i}, '${row.name}'${row.blockSlug?`, '${row.blockSlug}'`:''}),`).join('\n');
const content=`/* AUTO-GENERATED; DO NOT EDIT. Modify ${manifestPath} then run npm run composites:generate. */
import type { z } from 'zod';
import type { extensionDefinitions } from '../catalog';
import { createComposite } from '../composites/create-composite';
${imports}

/** Exact contracts inferred from approved Zod schemas. UI implementations are shared. */
export const compositeImplementations = {
${mapping}
};
`;
if(process.argv.includes('--check')){
 if(!existsSync(output)||readFileSync(output,'utf8')!==content){console.error('✗ Gerado desatualizado. Execute npm run composites:generate.');process.exit(1)}
 console.log(`✓ ${rows.length} composições geradas e sincronizadas`);
}else{
 mkdirSync(dirname(output),{recursive:true});writeFileSync(output,content);console.log(`✓ ${rows.length} componentes declarativos gerados em ${output}`);
}
