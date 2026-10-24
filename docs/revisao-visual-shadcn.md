# Fidelidade visual dos componentes compostos

## Revisão obrigatória antes de criar uma composição (shadcn/create)

**Nunca gere composições a partir do nome do card ou da categoria.** Para cada novo componente composto:

1. Abra o arquivo TSX oficial indicado por `src/ui-catalog/create-preview-inventory.json` e leia JSX, imports, dados, estados, funções, classes de layout e responsividade. Confirme a API de cada primitiva em https://ui.shadcn.com/docs/components.
2. **Inspecione o exemplo renderizado** em https://ui.shadcn.com/create em ambos os temas e no desktop/mobile. Registre captura de referência, largura, hierarquia, espaçamentos, componentes e interações. Captura local: `npm run reference:capture` (galerias); guarde capturas do site oficial fora do código e compare lado a lado.
3. Identifique as primitivas que faltam no catálogo. Para cada nova primitiva: instale no plano shadcn e registre schema Zod estrito, implementação React, origem, versão/fingerprint, teste e revisão antes de usá-la.
4. Escreva/atualize o **template JSON fechado** usando apenas tipos aprovados, mantendo estado local e sem JSX externo. Preserve características essenciais do card original, não substitua componentes específicos por placeholders genéricos silenciosamente.
5. Revise o título visível, conteúdo e acessibilidade. O nome técnico `ShippingAddress` pertence ao contrato; o título visível é "Shipping Address" ou tradução aprovada.
6. Atualize `create-reference-audit.json` com URL, estrutura, status da revisão visual, diferenças conhecidas e evidência. Regenere `compositionHash` no `contracts.lock.json` após aprovação.
7. Execute `npm run reference:check`, `npm run composites:check`, `npm run validate`, `npm run build`, `npm run reference:capture` e compare visualmente. `reference:strict` **deve falhar** se houver cartões sem screenshots/revisão visual concluídos. Nunca declare equivalência visual antes disso.

**Estado da revisão v0.13:** o código-fonte dos 64 exemplos foi analisado para orientar os templates e textos. A inspeção de layout foi baseada no JSX/CSS e em referência visual de galeria relacionada; **não houve verificação por screenshot de todos os cards renderizados no site oficial**. O arquivo de auditoria marca os 64 como `browser-screenshot-pending`, e a verificação visual estrita falha intencionalmente até ser concluída no navegador.

**Limites conhecidos:** QR Code funcional, waveform de microfone, ilustrações/fotos e gráficos especializados não têm equivalência visual/comportamental plena nos contratos atuais; precisam de primitiva aprovada ou implementação dedicada antes de reivindicar reprodução fiel.

## Comparação lado a lado

1. Execute `npm run reference:capture` para salvar os cards locais em `reports/visual-review/local/desktop/` e `.../mobile/`.
2. Capture manualmente cada card renderizado em shadcn/create (a mesma variante Base UI e tema), salvando arquivos em `reports/visual-review/reference/<NomeDoComponente>.png`.
3. Execute `npm run reference:compare` e abra `reports/visual-review/compare.html`. Inspecione hierarquia, espaçamento, tipografia, imagens, estados e interações.
4. Registre os caminhos das duas evidências em `visualEvidence` do respectivo card e altere `visualStatus` para `browser-reviewed` **somente após comparar**. Execute `npm run reference:strict` como bloqueio de aprovação visual.

O comando de comparação **não avalia pixels nem semelhança automaticamente**. Sua finalidade é facilitar a revisão humana e impedir aprovação sem evidências.
