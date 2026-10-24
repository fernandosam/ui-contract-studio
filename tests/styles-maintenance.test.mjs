import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const globals=read('src/globals.css');
const adapters=read('src/index.css');
const components=read('components.json');

test('shadcn uses a single Tailwind v4 palette and semantic @theme inline mapping',()=>{
  assert.equal((globals.match(/@import "tailwindcss"/g)||[]).length,1);
  assert.match(globals,/@theme inline \{/);
  assert.match(globals,/@custom-variant dark \(&:is\(\.dark-theme \*\)\)/);
  assert.match(globals,/--color-card: var\(--card\)/);
  assert.match(globals,/--color-sidebar: var\(--sidebar\)/);
  assert.match(globals,/--radius-lg: var\(--radius\)/);
  assert.ok(JSON.parse(components).tailwind.css==='src/globals.css');
  assert.doesNotMatch(adapters,/@import\s+["']tailwindcss/);
});
test('global styles do not override native shadcn Card, Sidebar, Buttons or typography',()=>{
  for (const selector of ['.sidebar {','.shell {','.ui-card {','.pg-button {','.pg-card {','html::-webkit-scrollbar','pre code {','button { cursor: pointer']) {
    assert.ok(!globals.includes(selector)&&!adapters.includes(selector),`obsolete global rule: ${selector}`);
  }
  assert.doesNotMatch(globals,/@theme \{\s*--breakpoint-sm/);
  assert.doesNotMatch(globals,/--shadow-x:/);
  assert.equal((globals.match(/--font-sans:/g)||[]).length,1);
});
test('needed catalog-specific layout, metrics and responsive rules remain',()=>{
  for(const selector of ['.pg-stack {','.pg-grid {','.pg-field {','.pg-graph {','.pg-rating {','.pg-pagination {','.pg-heading--h2 {','.pg-card--md {']) assert.ok(adapters.includes(selector),selector);
  assert.match(adapters,/max-width: 520px/);
});
