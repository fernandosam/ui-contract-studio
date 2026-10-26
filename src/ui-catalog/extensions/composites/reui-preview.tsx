import {lazy, Suspense, type ComponentType} from 'react';

/** Registro sob demanda das composições ReUI homologadas em arquivos separados.
 * Os módulos são estáticos, resolvidos no build pelo Vite: nunca executa JSX vindo de JSON.
 * Componentes Accordion, Button e Separator continuam com seus registros auditados.
 */
const reuiModules = import.meta.glob<{default: ComponentType}>('./reui-*.tsx');
const additionalPatterns: Record<string, ComponentType> = Object.fromEntries(
 Object.entries(reuiModules).map(([path, load]) => [path, lazy(load)])
);

import { reuiButtonPatterns } from './reui-button-index';
import {AccordionPattern1} from './reui-accordion-1';
import {AccordionPattern2} from './reui-accordion-2';
import {AccordionPattern3} from './reui-accordion-3';
import {AccordionPattern4} from './reui-accordion-4';
import {AccordionPattern5} from './reui-accordion-5';
import {AccordionPattern6} from './reui-accordion-6';
import {AccordionPattern7} from './reui-accordion-7';
import {AccordionPattern8} from './reui-accordion-8';
import {AccordionPattern9} from './reui-accordion-9';
import {AccordionPattern10} from './reui-accordion-10';
import {AccordionPattern11} from './reui-accordion-11';
import {SeparatorPattern1} from './reui-separator-1';
import {SeparatorPattern2} from './reui-separator-2';
import {SeparatorPattern3} from './reui-separator-3';
import {SeparatorPattern4} from './reui-separator-4';
import {SeparatorPattern5} from './reui-separator-5';
import {SeparatorPattern6} from './reui-separator-6';
const separators=[SeparatorPattern1,SeparatorPattern2,SeparatorPattern3,SeparatorPattern4,SeparatorPattern5,SeparatorPattern6];
const accordions=[AccordionPattern1,AccordionPattern2,AccordionPattern3,AccordionPattern4,AccordionPattern5,AccordionPattern6,AccordionPattern7,AccordionPattern8,AccordionPattern9,AccordionPattern10,AccordionPattern11];
/**
 * Renderização pura da composição, sem largura/margens da demonstração.
 * Os componentes mantêm suas interações e imports estáticos/lazy originais.
 */
export function ReuiPattern({kind,id}:{kind:string;id:string}){
 const index=Number(id.split('-').at(-1));
 if(!Number.isInteger(index)||index<1) return null;
 // Preserve the existing reviewed adapters, but allow newly registered ReUI
 // patterns in these families to load through the same static Vite glob.
 const Specialized=kind==='Accordion' ? accordions[index-1]
  : kind==='Separator' ? separators[index-1]
    : kind==='Button' ? reuiButtonPatterns[index-1] : undefined;
 if(Specialized)return <Specialized/>;
 const slug=kind.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase();
 const Pattern=additionalPatterns['./reui-'+slug+'-'+index+'.tsx'];
 return Pattern ? <Suspense fallback={<span className="text-xs text-muted-foreground">Carregando exemplo…</span>}><Pattern/></Suspense> : null;
}

/** Layout exclusivo da prévia da Galeria 3, não parte do componente reutilizável. */
export function ReuiPreview({kind,id}:{kind:string;id:string}){
 const index=Number(id.split('-').at(-1));
 if(kind==='Accordion') {
  return <div className="mx-auto mb-auto w-full max-w-lg" data-reui-accordion-example={index}><ReuiPattern kind={kind} id={id}/></div>;
 }
 if(kind==='Alert' && index>=12 && index<=20) {
  return <div className="mx-auto mb-auto w-full max-w-lg" data-reui-example={id}><ReuiPattern kind={kind} id={id}/></div>;
 }
 if(kind==='Separator') {
  return <div className="flex w-full max-w-lg items-center justify-center" data-reui-separator-example={index}><ReuiPattern kind={kind} id={id}/></div>;
 }
 if(kind==='Button') {
  return <div className="flex w-full max-w-lg items-center justify-center" data-reui-button-example={index}><ReuiPattern kind={kind} id={id}/></div>;
 }
 return <div className="flex w-full max-w-lg items-center justify-center" data-reui-example={id}><ReuiPattern kind={kind} id={id}/></div>;
}
