import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,existsSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';

const root=process.cwd();
const fixture='tests/fixtures/contract-migrations/';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const run=(args)=>spawnSync(process.execPath,['scripts/migrate-contract-spec.mjs',...args],{
 cwd:root,encoding:'utf8',maxBuffer:1024*1024
});
const output=()=> 'reports/contract-migrations/e07-test-'+randomUUID().replaceAll('-','')+'.json';
const siblings=out=>[out,out.replace(/\.json$/,'.versions.json'),out.replace(/\.json$/,'.report.json')];
const source=read(fixture+'legacy-reui-spec.json');
const historical=read(fixture+'legacy-reui-versions.json');
const cleanup=paths=>{for(const path of paths)rmSync(path,{force:true,recursive:true});};
const scratch=()=>mkdtempSync(join(tmpdir(),'e07-compat-'));

test('CLI migrates historical specs with real stable-channel Zod and remains idempotent and recoverable',()=>{
 const out=output(),backup=output(),again=output();
 const created=[...siblings(out),backup,...siblings(again)];
 const originalSpecBytes=readFileSync(fixture+'legacy-reui-spec.json','utf8');
 const originalVersionBytes=readFileSync(fixture+'legacy-reui-versions.json','utf8');
 try{
  const first=run(['--file='+fixture+'legacy-reui-spec.json',
   '--versions='+fixture+'legacy-reui-versions.json','--out='+out]);
  assert.equal(first.status,0,first.stdout+'\n'+first.stderr);
  assert.deepEqual(read(out),source);
  const migratedManifest=read(siblings(out)[1]);
  const report=read(siblings(out)[2]);
  assert.equal(report.valid,true);
  assert.deepEqual(report.changedTypes,['Badge','Card','Input']);
  assert.equal(report.steps.length,3);
  assert.deepEqual(report.operations,[]);
  const snapshot=run(['--file='+out,'--snapshot','--out='+backup]);
  assert.equal(snapshot.status,0,snapshot.stdout+'\n'+snapshot.stderr);
  assert.deepEqual(read(backup),migratedManifest);
  const replay=run(['--file='+out,'--versions='+siblings(out)[1],'--out='+again]);
  assert.equal(replay.status,0,replay.stdout+'\n'+replay.stderr);
  assert.deepEqual(read(again),read(out));
  assert.deepEqual(read(siblings(again)[1]),migratedManifest);
  assert.deepEqual(read(siblings(again)[2]).steps,[]);
  assert.equal(readFileSync(fixture+'legacy-reui-spec.json','utf8'),originalSpecBytes);
  assert.equal(readFileSync(fixture+'legacy-reui-versions.json','utf8'),originalVersionBytes);
  assert.deepEqual(read(fixture+'legacy-reui-versions.json'),historical,
   'original version manifest remains available for a manual rollback');
 }finally{cleanup(created);}
});

test('CLI fails closed with invalid Zod props, missing provenance and malformed graph; writes no output',()=>{
 const dir=scratch();
 try{
  const invalidZod=structuredClone(source);
  invalidZod.elements.badge.props.variant='not-a-supported-variant';
  const invalidGraph=structuredClone(source);
  invalidGraph.elements.root.children.push('missing-node');
  const invalidVersion=structuredClone(historical);
  invalidVersion.contracts.Input.fingerprint='0'.repeat(64);
  const cases=[
   ['invalid-zod.json',invalidZod,historical,/current Zod validation failed/],
   ['invalid-graph.json',invalidGraph,historical,/invalid spec/],
   ['invalid-version.json',source,invalidVersion,/unsupported source release/]
  ];
  for(const [filename,spec,versions,expected] of cases){
   const file=join(dir,filename),versionFile=join(dir,'versions-'+filename);
   writeFileSync(file,JSON.stringify(spec)+'\n');
   writeFileSync(versionFile,JSON.stringify(versions)+'\n');
   const specBefore=readFileSync(file,'utf8'),versionsBefore=readFileSync(versionFile,'utf8');
   const out=output();
   try{
    const outcome=run(['--file='+file,'--versions='+versionFile,'--out='+out]);
    assert.notEqual(outcome.status,0,filename);
    assert.match(outcome.stderr,expected,filename);
    assert.equal(siblings(out).some(existsSync),false,filename);
    assert.equal(readFileSync(file,'utf8'),specBefore);
    assert.equal(readFileSync(versionFile,'utf8'),versionsBefore);
   }finally{cleanup(siblings(out));}
  }
  const missing=run(['--file='+fixture+'legacy-reui-spec.json']);
  assert.equal(missing.status,2,'implicit provenance inference is prohibited');
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('CLI output bundle refuses overwrite and leaves existing artifacts untouched',()=>{
 const dir=scratch(),out=output();
 const [result,manifest,report]=siblings(out);
 try{
  mkdirSync(resolve('reports/contract-migrations'),{recursive:true});
  const sentinel='pre-existing reviewed manifest\n';
  writeFileSync(manifest,sentinel,{flag:'wx'});
  const status=run(['--file='+fixture+'legacy-reui-spec.json',
   '--versions='+fixture+'legacy-reui-versions.json','--out='+out]);
  assert.notEqual(status.status,0);
  assert.match(status.stderr,/refuse to overwrite/);
  assert.equal(existsSync(result),false);
  assert.equal(existsSync(report),false);
  assert.equal(readFileSync(manifest,'utf8'),sentinel);
 }finally{cleanup([result,manifest,report]);rmSync(dir,{recursive:true,force:true});}
});

test('CLI rolls back a partially published bundle after an injected second-file failure',()=>{
 const dir=scratch(),out=output(),files=siblings(out);
 try{
  const preload=join(dir,'fail-second-publish.mjs');
  // Test-only fault injection into the Node built-in, before the CLI module loads.
  // The first link publishes the spec; the second link fails deterministically.
  writeFileSync(preload,[
   "import fs from 'node:fs';",
   "import {syncBuiltinESMExports} from 'node:module';",
   "const link=fs.linkSync;",
   "let writes=0;",
   "fs.linkSync=(...args)=>{if(++writes===2)throw Error('injected second link failure');return link(...args)};",
   "syncBuiltinESMExports();"
  ].join('\\n')+'\\n');
  const outcome=spawnSync(process.execPath,[
   '--import='+preload,'scripts/migrate-contract-spec.mjs',
   '--file='+fixture+'legacy-reui-spec.json',
   '--versions='+fixture+'legacy-reui-versions.json','--out='+out
  ],{cwd:root,encoding:'utf8',maxBuffer:1024*1024});
  assert.notEqual(outcome.status,0);
  assert.match(outcome.stderr,/injected second link failure/);
  assert.equal(files.some(existsSync),false,'no partly published artifacts survive rollback');
  assert.deepEqual(read(fixture+'legacy-reui-spec.json'),source);
  assert.deepEqual(read(fixture+'legacy-reui-versions.json'),historical);
 }finally{cleanup(files);rmSync(dir,{recursive:true,force:true});}
});
