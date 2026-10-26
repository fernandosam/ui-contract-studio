/** Requires npm-installed Zod 4. Produces actual, full JSON Schemas from the authoritative contract definitions. */
import { mkdirSync,writeFileSync,readFileSync } from 'node:fs';
import { z } from 'zod';
import { unifiedComponentDefinitions,actionDefinitions } from '../src/ui-catalog/catalog';
const types:Record<string,unknown>={};
for(const [name,component] of Object.entries(unifiedComponentDefinitions)){
  types[name]=z.toJSONSchema(component.props,{target:'draft-2020-12',io:'input',unrepresentable:'any'});
}
const actions:Record<string,unknown>={};
for(const [name,action] of Object.entries(actionDefinitions)){
  actions[name]=z.toJSONSchema(action.params,{target:'draft-2020-12',unrepresentable:'any'});
}
const pkg=JSON.parse(readFileSync('package.json','utf8'));
const manifest=JSON.parse(readFileSync('pi-catalog/contracts.json','utf8'));
if(manifest.schemaVersion!==3||!Array.isArray(manifest.components))throw new Error('Manifesto Pi v3 inválido');
if(Object.keys(types).length!==manifest.components.length)throw new Error('Schemas não cobrem catálogo unificado');
for(const item of manifest.components)if(!types[item.type])throw new Error('Schema ausente: '+item.type);
const events=Object.fromEntries(Object.entries(unifiedComponentDefinitions).map(([name,item])=>[name,'events' in item?item.events:[]]));
mkdirSync('pi-catalog',{recursive:true});
writeFileSync('pi-catalog/props-json-schema.json',JSON.stringify({schemaVersion:3,projectVersion:pkg.version,types,actions,events},null,2)+'\n');
console.log(`JSON Schemas reais exportados para ${Object.keys(types).length} componentes e ${Object.keys(actions).length} ações.`);
