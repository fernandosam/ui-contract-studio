import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
const text=readFileSync('.github/workflows/bootstrap-visual.yml','utf8');
test('CI executa instalação e build reais, sem desabilitar TLS',()=>{
 for(const clause of ['npm install --include=dev','npm ci --no-audit','npm run shadcn:verify','npm run validate','npm run build','playwright install --with-deps chromium'])
   assert.ok(text.includes(clause),`Falta ${clause}`);
 assert.ok(text.includes("npm_config_strict_ssl: 'true'"));
 assert.ok(!text.includes('strict-ssl=false'));
});
test('CI não confunde screenshots locais com baselines originais',()=>{
 assert.ok(!text.includes('gallery:visual:capture'));
 assert.ok(text.includes('shadcn:official:capture'));
 assert.ok(text.includes('shadcn:official:compare'));
 assert.ok(text.includes('build-ci-visual-evidence.mjs --strict'));
 assert.ok(text.includes('comparação não foi concluída'));
});
test('CI preserva origem e artefatos de revisão',()=>{
 assert.ok(text.includes('permissions:'));
 assert.ok(text.includes('contents: read'));
 assert.ok(text.includes('actions/upload-artifact@v4'));
 assert.ok(text.includes('projeto-bootstrap.tar.gz'));
 assert.ok(existsSync('scripts/build-ci-visual-evidence.mjs'));
});
