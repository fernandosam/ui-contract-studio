[English](official-component-visual-audit.md) | [Português](official-component-visual-audit.pt-BR.md)

# Comparação visual com exemplos oficiais shadcn/ui

O workflow manual independente [Auditoria visual oficial](../.github/workflows/official-visual-manual.yml) captura os exemplos reais da documentação shadcn/ui e as prévias correspondentes no Explorador de Primitivos. Não reinstala código-fonte. O [workflow de bootstrap](../.github/workflows/bootstrap-visual.yml) continua separado.

## Cobertura prioritária

O plano `shadcn-plan.json` declara **50 primitivas**. O inventário curado `scripts/official-component-examples.json` passou a selecionar **50 exemplos oficiais**: **41 com contrato Pi local** e **9 somente como referência oficial**. Existem **0 primitivas sem seleção**. O piso de 50 é verificado por `shadcn:official:inventory:check` e por testes de regressão; novos componentes precisam ser incluídos na auditoria ou registrados explicitamente como pendentes, sem redução desse piso.

As 12 referências prioritárias adicionadas foram `aspect-ratio`, `kbd`, `empty`, `scroll-area`, `alert-dialog`, `attachment`, `bubble`, `context-menu`, `hover-card`, `item`, `marker` e `message`. Todas já têm contrato e exemplo Pi; **nenhuma API, permissão Pi, admissão ou schema Zod foi ampliado**.

As antigas Galerias 1 e 2 foram removidas e suas 64 comparações são históricas. ReUI continua como biblioteca de composições React independente.

## Execução e evidências

Com dependências reais, Chromium e acesso à documentação oficial:

~~~bash
npm run shadcn:official:inventory:check
npm run test:offline
npm run shadcn:official:capture
python3 -m pip install Pillow==11.3.0
npm run shadcn:official:compare -- --strict
~~~

Alternativamente, executar **Actions → Official shadcn visual audit (manual)** na `main`. O Playwright captura a referência oficial e — quando existe contrato Pi — a prévia local em **desktop e mobile**. A matriz esperada é de **100 casos: 82 pares local/oficial e 18 casos somente oficiais**. Os arquivos `reports/official-components/comparison.json`, `index.html`, screenshots e proveniência são publicados no mesmo artefato, inclusive quando houver falha.

O inventário validado comprova somente o mapeamento das 50 referências. O comparador estrito exige capturas reais e rastreabilidade de origem, **não** equivalência visual. Exemplos oficiais e locais podem ter conteúdos, temas e estados diferentes; o percentual de diferença é diagnóstico, jamais limiar de aprovação. O campo `visualApproval` permanece `pending` enquanto o relatório real não estiver completo; depois sinaliza **revisão humana necessária**, nunca certificação automática.

## Revisão manual ainda necessária

Confrontar desktop/mobile e registrar divergências de espaçamento, tipografia, hierarquia, comportamento responsivo, recorte e estados de sobreposição (especialmente AlertDialog, ContextMenu e HoverCard). Capturas no estado inicial, isoladamente, não certificam interações nem acessibilidade. Aprovação de fidelidade exige decisão explícita de um revisor.

Consulte [desenvolvimento](development.pt-BR.md), [componentes](components.pt-BR.md) e [revisão de composições](revisao-visual-shadcn.pt-BR.md).
