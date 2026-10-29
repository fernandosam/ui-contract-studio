#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {checkMigrationRegistry} from './lib/contract-migrations.mjs';
const read=file=>JSON.parse(readFileSync(file,'utf8'));
try{
 const registry=read('src/ui-catalog/contract-migrations.json');
 const edges=checkMigrationRegistry(registry,read('src/ui-catalog/contracts.lock.json'));
 console.log('✓ '+edges.size+' reviewed, fingerprint-bound E07 migration edges');
}catch(error){
 console.error(error.message);
 process.exitCode=1;
}
