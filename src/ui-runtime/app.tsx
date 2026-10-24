import { SpecScreen } from './spec-screen';
import { PageShell } from './layout';
import { navigation, screens } from './screen-registry';
import { lazy, Suspense } from 'react';

// Tools are lazy-loaded: active catalog examples are loaded only in explorer routes.
const PrimitiveExplorer=lazy(()=>import('./catalog-explorer').then(m=>({default:m.PrimitiveExplorer})));
const CompositeExplorer=lazy(()=>import('./catalog-explorer').then(m=>({default:m.CompositeExplorer})));
const ReuiGallery=lazy(()=>import('./catalog-explorer').then(m=>({default:m.ReuiGallery})));
const ExamplesExplorer=lazy(()=>import('./catalog-explorer').then(m=>({default:m.ExamplesExplorer})));

const explorerEntries=[
 {slug:'reui',title:'ReUI',subtitle:'Exemplos ReUI agrupados por componente, com filtro e carregamento progressivo.',section:'Exemplos',order:202,icon:'layers',spec:null},
 {slug:'explorador-primitivos',title:'Primitivos shadcn',subtitle:'Componentes base, propriedades e comportamento isolado.',section:'Ferramentas',order:990,icon:'layers',spec:null},
 {slug:'explorador-compostos',title:'Componentes compostos',subtitle:'Padrões com identidade e comportamento próprios.',section:'Ferramentas',order:991,icon:'layers',spec:null},
 {slug:'explorador-exemplos',title:'Exemplos',subtitle:'Telas completas e padrões JSON com inspeção de cada nó.',section:'Ferramentas',order:992,icon:'layers',spec:null},
];
export function App() {
  const query = new URLSearchParams(window.location.search).get('screen');
  const requested = query === 'galeria-3' ? 'reui' : (query ?? 'reui');
  const tool=explorerEntries.find(x=>x.slug===requested);
  const entry = tool ?? (screens[requested] ?? explorerEntries[0] ?? navigation[0]);
  if (!entry) return <main role="alert">Nenhuma tela cadastrada.</main>;
  return <PageShell title={entry.title} subtitle={entry.subtitle} section={entry.section} navigation={[...navigation,...explorerEntries]} current={entry.slug}>
    {tool ? <Suspense fallback={<p role="status">Carregando explorador…</p>}>{tool.slug==='explorador-primitivos'?<PrimitiveExplorer/>:tool.slug==='explorador-compostos'?<CompositeExplorer/>:tool.slug==='reui'?<ReuiGallery/>:<ExamplesExplorer/>}</Suspense> : <SpecScreen spec={entry.spec} />}
  </PageShell>;
}
