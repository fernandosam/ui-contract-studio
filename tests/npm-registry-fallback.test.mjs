import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('sandbox testa npm e espelhos por HTTPS, valida metadados e mantém TLS',()=>{
 const src=read('sandbox/registry-probe.mjs');
 for(const url of ['https://registry.npmjs.org','https://registry.npmmirror.com','https://registry.yarnpkg.com'])assert.ok(src.includes(url));
 assert.match(src,/u\.protocol === 'https:'/);
 assert.match(src,/\/react\/latest/);
 assert.match(src,/payload\?\.name === 'react'/);
 assert.match(src,/timeoutMs/);
 assert.match(src,/registryConfigChanged: false/);
 assert.doesNotMatch(src,/strict-ssl=false|rejectUnauthorized:\s*false/);
});
test('sandbox usa somente o registry selecionado e bloqueia falhas explícitas',()=>{
 const src=read('sandbox/run-all-tests.sh');
 assert.match(src,/registry="\$\(node sandbox\/registry-probe\.mjs --select\)"/);
 assert.match(src,/export npm_config_registry="\$registry"/);
 assert.match(src,/exit 25/);
 assert.doesNotMatch(src,/--strict-ssl=false/);
});
