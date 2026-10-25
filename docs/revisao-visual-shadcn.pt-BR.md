[English](revisao-visual-shadcn.md) | [Português](revisao-visual-shadcn.pt-BR.md)

# Fidelidade visual das composições shadcn/ui

A revisão visual aplica-se aos **blocos e composições ativos** do projeto. As Galerias 1 e 2 do shadcn/create foram retiradas e seus inventários e testes específicos não fazem parte da verificação corrente.

Para alterar uma composição, consulte as fontes oficiais em `src/ui-catalog/block-source-inventory.json` e `src/ui-catalog/site-compositions-audit.json`. Compare o comportamento renderizado e o JSX original, incluindo dimensões, hierarquia, responsividade, temas e estados interativos. Registre screenshots reais de referência e da implementação local, sem presumir equivalência visual.

Execute `npm run composites:check`, `npm run blocks:check`, `npm run validate` e `npm run build`. A auditoria de composições pode ser atualizada com `npm run composites:fidelity` e comparada por `npm run composites:compare`. A certificação visual não é automática.

O composto `Dashboard01` permanece disponível para reutilização e revisão individual, mesmo sem uma página Dashboard no menu.
