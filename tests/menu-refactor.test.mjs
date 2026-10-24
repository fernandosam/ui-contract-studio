import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {graphErrors} from '../scripts/lib/spec-invariants.mjs';
const text=p=>readFileSync(p,'utf8');
const data=p=>JSON.parse(text(p));
const deleted=['dashboard','usuarios','catalogo','playground','extensoes','auditoria'];
test('menu possui grupos e opções desejadas, sem telas obsoletas',()=>{
 const screens=readdirSync('src/ui-screens').filter(n=>n.endsWith('.json')).sort();
 assert.deepEqual(screens,['blocos-dashboard.json','blocos-login.json','blocos-sidebar.json','blocos-signup.json','exemplo-01.json','exemplo-02.json']);
 for(const id of deleted)assert.ok(!screens.includes(id+'.json'));
 const titles=Object.fromEntries(screens.map(n=>[n.replace('.json',''),data('src/ui-screen-meta/'+n).title]));
 assert.equal(titles['exemplo-01'],'Galeria 1');assert.equal(titles['exemplo-02'],'Galeria 2');
 for(const [id,title] of [['blocos-dashboard','Dashboard'],['blocos-login','Login'],['blocos-signup','Cadastro'],['blocos-sidebar','Sidebars']]){
  assert.equal(titles[id],title);
  assert.equal(data(`src/ui-screen-meta/${id}.json`).section,'Blocos shadcn');
 }
 const layout=text('src/ui-runtime/layout.tsx');
 assert.match(layout,/label:"Blocos shadcn"/);assert.match(layout,/label:"Exemplos"/);assert.match(layout,/SidebarGroupLabel/);
});
test('explorador edita valores simples e complexos e valida specs por Zod antes de aprovar',()=>{
 const editor=text('src/ui-runtime/catalog-explorer.tsx');
 assert.match(editor,/z.ZodNumber/);assert.match(editor,/z.ZodBoolean/);assert.match(editor,/z.ZodEnum/);assert.match(editor,/z.ZodString/);
 assert.match(editor,/JSON.parse\(raw\)/);assert.match(editor,/safeParse\(next\)/);
 assert.match(editor,/catalog.validate\(candidate\)/);assert.match(editor,/setApproved\(parsed.data\)/);
 assert.match(editor,/Restaurar valores/);assert.match(editor,/SpecScreen/);
 assert.ok(readdirSync('src/ui-explorer-samples').includes('Carousel.json'));
 const allowed=data('src/ui-catalog/contracts.lock.json').components.map(x=>x.name);
 const previewTypes=new Set();
 for(const dir of ['src/ui-screens','src/ui-patterns','src/ui-catalog/extensions/composites/templates','src/ui-explorer-samples']){
  for(const file of readdirSync(dir).filter(f=>f.endsWith('.json')&&!f.endsWith('.meta.json'))){
   const spec=data(dir+'/'+file);
   for(const node of Object.values(spec.elements))previewTypes.add(node.type);
  }
 }
 assert.deepEqual(allowed.filter(t=>!previewTypes.has(t)),[]);

 for(const file of readdirSync('src/ui-explorer-samples')){
  const s=data('src/ui-explorer-samples/'+file);
  assert.equal(Object.keys(s.elements).length,1,file);
  assert.deepEqual(s.elements[s.root].children,[],file);
  assert.deepEqual(graphErrors(s,allowed),[],file);
 }
});
test('Carousel tem controles dentro da largura disponível sem offsets absolutos',()=>{
 const code=text('src/ui-catalog/components/playground.tsx');
 const carousel=code.split('  Carousel:')[1].split('  Table:')[0];
 assert.match(carousel,/overflow-hidden/);assert.match(carousel,/justify-end/);
 assert.match(carousel,/CarouselPrevious className="static inset-auto/);
 assert.match(carousel,/CarouselNext className="static inset-auto/);
 assert.doesNotMatch(carousel,/basis-3\/4 md:basis-1\/2/);
});
test('README contém somente uso e CHANGELOG registra evolução',()=>{
 const pkg=data('package.json');assert.match(pkg.version,/^0\.\d+\.\d+$/);
 assert.match(text('README.md'),/CHANGELOG.md/);
 const log=text('CHANGELOG.md');assert.match(log,/Initial independent snapshot/);assert.ok(log.includes(pkg.version));
 assert.doesNotMatch(text('README.md'),/## Histórico de versões anteriores/);
});
