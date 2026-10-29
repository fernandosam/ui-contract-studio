#!/usr/bin/env node
/** Offline, explicit E07 migration. Never rewrites source specs or approvals. */
import {readFileSync,writeFileSync,existsSync,mkdirSync,mkdtempSync,rmSync,renameSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {snapshotContractVersions,migrateContractSpec} from './lib/contract-migrations.mjs';

const option=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
const input=option('file'),versionFile=option('versions'),output=option('out');
const snapshot=process.argv.includes('--snapshot');
const flags=process.argv.slice(2);
const error=message=>{console.error('Migration rejected: '+message);process.exit(1);};
if(flags.some(flag=>!/^--(file|versions|out)=/.test(flag) && flag!=='--snapshot') ||
   !input || !input.endsWith('.json') || input.includes('..') ||
   (snapshot && versionFile) || (!snapshot && (!versionFile || !versionFile.endsWith('.json') || versionFile.includes('..'))) ||
   (output && !/^reports\/contract-migrations\/[a-zA-Z0-9_-]+\.json$/.test(output))){
 console.error('Usage: node scripts/migrate-contract-spec.mjs --file=path/spec.json --snapshot [--out=reports/contract-migrations/versions.json]');
 console.error('   or: node scripts/migrate-contract-spec.mjs --file=path/spec.json --versions=path/versions.json [--out=reports/contract-migrations/result.json]');
 process.exit(2);
}
const read=path=>JSON.parse(readFileSync(resolve(path),'utf8'));
try{
 const spec=read(input),lock=read('src/ui-catalog/contracts.lock.json');
 const result=snapshot
   ? snapshotContractVersions(spec,lock)
   : migrateContractSpec({spec,versions:read(versionFile),
     registry:read('src/ui-catalog/contract-migrations.json'),lock});
 {
   const candidate=snapshot?spec:result.spec;
   // The final/current authoritative Zod catalog remains the approval boundary.
   // Validate the migrated JSON in isolation before publishing any output.
   mkdirSync('reports/contract-migrations',{recursive:true});
   const dir=mkdtempSync('reports/contract-migrations/.validate-');
   try{
     const stage=join(dir,'spec.json');
     writeFileSync(stage,JSON.stringify(candidate,null,2)+'\n');
     const validation=spawnSync(process.execPath,[
       resolve('node_modules/.bin/tsx'),resolve('scripts/validate-pi-spec.ts'),
       '--file='+stage,'--stdout'
     ],{encoding:'utf8',maxBuffer:1024*1024});
     if(validation.status!==0)throw new Error('current Zod validation failed: '+
       (validation.stdout||validation.stderr||validation.error?.message||'unknown').slice(0,4000));
     const verdict=JSON.parse(validation.stdout);
     if(verdict.valid!==true)throw new Error('current Zod validator returned invalid');
   }finally{rmSync(dir,{recursive:true,force:true});}
 }
 if(!output){
   process.stdout.write(JSON.stringify(result,null,2)+'\n');
 }else{
   const files=snapshot?[output]:[
     output,output.replace(/\.json$/,'.versions.json'),output.replace(/\.json$/,'.report.json')];
   if(files.some(path=>existsSync(path)))error('output exists; refuse to overwrite reports: '+files.join(', '));
   mkdirSync(dirname(output),{recursive:true});
   const values=snapshot?[result]:[result.spec,result.versions,result.report];
   // No in-place edits of screens, generated Pi contracts, lock or old files.
   const temporary=[];
   try{
     for(let i=0;i<files.length;i++){
       const temp=files[i]+'.tmp-'+process.pid;
       writeFileSync(temp,JSON.stringify(values[i],null,2)+'\n',{flag:'wx'});
       temporary.push(temp);
     }
     for(let i=0;i<files.length;i++)renameSync(temporary[i],files[i]);
   }finally{for(const temp of temporary)if(existsSync(temp))rmSync(temp);}
   console.log('Created: '+files.join(', '));
 }
}catch(e){error(e.message);}
