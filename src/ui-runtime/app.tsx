import { SpecScreen } from './spec-screen';
import { PreviewThemeSelector } from '../ui-theme/preview-theme';
import { PageShell } from './layout';
import { navigation, screens } from './screen-registry';
import { lazy, Suspense } from 'react';

// Tools are lazy-loaded: active catalog examples are loaded only in explorer routes.
const PatternWizard=lazy(()=>import('./pattern-wizard').then(m=>({default:m.PatternWizard})));
const RequirementsWizard=lazy(()=>import('./requirements-wizard').then(m=>({default:m.RequirementsWizard})));
const PrimitiveExplorer=lazy(()=>import('./catalog-explorer').then(m=>({default:m.PrimitiveExplorer})));
const CompositeExplorer=lazy(()=>import('./catalog-explorer').then(m=>({default:m.CompositeExplorer})));
const ReuiGallery=lazy(()=>import('./catalog-explorer').then(m=>({default:m.ReuiGallery})));
const ExamplesExplorer=lazy(()=>import('./catalog-explorer').then(m=>({default:m.ExamplesExplorer})));

const explorerEntries=[
 {slug:'criador-padroes',title:'Criar padrões',subtitle:'Busca, login, listas e dashboards gerados com contratos existentes.',section:'Ferramentas',order:986,icon:'layers',spec:null},
 {slug:'criador-interfaces',title:'Criar interface',subtitle:'Levantamento de requisitos e prévia com contratos Pi autorizados.',section:'Ferramentas',order:987,icon:'layers',spec:null},
 {slug:'reui',title:'ReUI',subtitle:'Exemplos ReUI agrupados por componente, com filtro e carregamento progressivo.',section:'Exemplos',order:202,icon:'layers',spec:null},
 {slug:'explorador-primitivos',title:'Primitivas',subtitle:'Componentes base, propriedades e comportamento isolado.',section:'Ferramentas',order:990,icon:'layers',spec:null},
 {slug:'explorador-compostos',title:'Compostos',subtitle:'Padrões com identidade e comportamento próprios.',section:'Ferramentas',order:991,icon:'layers',spec:null},
 {slug:'explorador-exemplos',title:'Exemplos',subtitle:'Telas completas e padrões JSON com inspeção de cada nó.',section:'Ferramentas',order:992,icon:'layers',spec:null},
];
export function App() {
  const query = new URLSearchParams(window.location.search).get('screen');
  const requested = query === 'galeria-3' ? 'reui' : query === 'catalogo-pi' ? 'explorador-compostos' : (query ?? 'reui');
  const tool=explorerEntries.find(x=>x.slug===requested);
  const entry = tool ?? (screens[requested] ?? explorerEntries.find(item=>item.slug==='reui') ?? navigation[0]);
  if (!entry) return <main role="alert">Nenhuma tela cadastrada.</main>;
  return <PageShell title={entry.title} subtitle={entry.subtitle} section={entry.section} navigation={[...navigation,...explorerEntries]} current={entry.slug}>
    {tool ? <Suspense fallback={<p role="status">Carregando explorador…</p>}>{tool.slug==='criador-padroes'?<PatternWizard/>:tool.slug==='criador-interfaces'?<RequirementsWizard/>:tool.slug==='explorador-primitivos'?<PrimitiveExplorer/>:tool.slug==='explorador-compostos'?<CompositeExplorer/>:tool.slug==='reui'?<ReuiGallery/>:<ExamplesExplorer/>}</Suspense> : <div className="space-y-3"><div className="flex flex-wrap justify-end"><PreviewThemeSelector /></div><SpecScreen spec={entry.spec} /></div>}
  </PageShell>;
}
