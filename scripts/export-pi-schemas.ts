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
const lock=JSON.parse(readFileSync('src/ui-catalog/contracts.lock.json','utf8'));
const experiments=JSON.parse(readFileSync('src/ui-catalog/admission-engine/entries.json','utf8')).entries;
if(Object.keys(types).length!==lock.components.length+experiments.length)throw new Error('Schemas não cobrem todo o catálogo unificado');
for(const item of lock.components)if(!types[item.name])throw new Error('Schema ausente: '+item.name);
const events=Object.fromEntries(Object.entries(componentDefinitions).map(([name,item])=>[name,'events' in item?item.events:[]]));
mkdirSync('pi-catalog',{recursive:true});
writeFileSync('pi-catalog/props-json-schema.json',JSON.stringify({schemaVersion:2,projectVersion:pkg.version,catalogSize:lock.components.length,experimentalCatalogSize:experiments.length,types,actions,events},null,2)+'\n');
console.log(`JSON Schemas reais exportados para ${Object.keys(types).length} componentes e ${Object.keys(actions).length} ações.`);
