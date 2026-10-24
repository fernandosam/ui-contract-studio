# Auditoria de cobertura ReUI: 31 famílias / 559 exemplos locais

**Escopo:** exemplos TSX efetivamente versionados em `src/ui-catalog/extensions/composites/reui-<familia>-<n>.tsx`; schemas Zod em `src/ui-catalog/catalog.ts` e `src/ui-catalog/extensions/catalog.ts`; renderizadores em `src/ui-catalog/components/playground.tsx` e `src/ui-catalog/extensions/registry.tsx`. A coleção no site upstream é dinâmica e maior do que este recorte local.

**Evidência:** `src/ui-catalog/reui-primitive-source-baseline.json` contém **559 registros individuais**, SHA Git dos arquivos, contrato associado e propósito do exemplo. `scripts/audit-reui-primitives.mjs` lê **o conteúdo dos 559 arquivos**, confere o hash exato e deriva uma análise detalhada, inclusive detecção estática de estado, eventos, inputs, mídia remota, autoplay, submenus e múltiplas primitivas.

**Limite epistemológico:** a revisão automatizada é **estática**. Um exemplo classificado como candidato básico **não** tem paridade visual ou funcional comprovada. Os testes de teclado, leitor de tela, interação real, snapshots e comparação com upstream continuam sujeitos a verificação.

## Critérios de classificação

- `core-contract-candidate`: semântica básica da primitiva identificada, mas **sem certificação** de todos os seus modos e estados.
- `approved-composition-candidate`: o JSX faz uso de múltiplas primitivas, ou a funcionalidade pode ser representada por composição; não aprovar automaticamente o exemplo como tipo Pi.
- `contract-capability-gap`: a API Zod/renderizador não representa alguma capacidade segura candidata; avaliar extensão versionada em vez de duplicar tipos.
- `needs-behavior-review`: estado ou eventos precisam de contrato autorizado antes de exposição ao Pi.
- `not-admitted-security-or-integration`: mídia externa, permissões, ações ou integrações não autorizadas; manter fora do catálogo.
- `separate-semantic-contract`: padrão já possui contrato semântico próprio aprovado; não duplicar como nova propriedade de primitiva.

## Matriz por família (conclusões arquiteturais; não certificação de todos os exemplos)

| Família | Exemplos | Contrato associado | Direção da auditoria |
|---|---:|---|---|
| Accordion | 11 | Accordion | Suporta conteúdo textual, expansão e indicadores. Conteúdo composto/nesting e onboarding não cabem integralmente em items textuais; OnboardingChecklist é independente. |
| Alert | 20 | Alert | Alert aceita default/destructive; variações com status adicionais, ícones e ações precisam de props tipadas ou composição. |
| Avatar | 35 | Avatar | Reuso de avatar básico; grupos, overlays, indicadores e fontes externas pedem composição e política de mídia. |
| Badge | 25 | Badge | Variantes oficiais restritas; status extras e contador associado a controles precisam de mapeamento semântico seguro. |
| Button | 61 | Button | Tamanhos/variants, ícones allowlisted e estados loading cobertos parcialmente; menus, links, split actions e comportamento próprio são composição. |
| ButtonGroup | 57 | ButtonGroup | Contrato atual implementa faixa simples e seleção, não comandos compostos, campos, menus, e workflows; vários precisam de composição controlada. |
| Card | 18 | Card | Contêiner básico; card composto não deve aceitar JSX arbitrário gerado pelo Pi. |
| Carousel | 11 | Carousel | **Lacuna concreta:** renderizador Pi cria cartões textuais; padrões ReUI incluem fotos, thumbnail sync, autoplay, dots, responsividade e legendas. |
| Checkbox | 22 | Checkbox | Estado/disabled e eventos básicos; grupos e acordos devem ser composições de Field e Checkbox. |
| Collapsible | 10 | Collapsible | Disclosure básica; painéis interativos dependem de conteúdo declarado nos slots. |
| Dialog | 10 | Dialog | Abertura e conteúdo tipados; formulários internos e ações de confirmação exigem política de eventos e composição. |
| Drawer | 5 | Drawer | Abertura e direções cobertas; layouts complexos e dados variáveis não são variantes do trigger. |
| DropdownMenu | 18 | DropdownMenu | **Lacuna concreta:** schema de itens planos não cobre submenus, radio/checkbox e escolhas com estado. Menus de conta e notificações exigem governaça de ações. |
| Input | 31 | Input | Controle textual tipado; anexos, busca com escopos, grupo com ícones e validações elaboradas são composições Field/Input. |
| Pagination | 15 | Pagination | **Lacuna concreta:** falta goto, seletor de tamanho e first/last; o renderer atual limita a lista numérica a 30 itens. |
| Popover | 11 | Popover | Conteúdo textual e open controlado; formulários e seleções internas exigem estruturas aprovadas. |
| Progress | 8 | Progress | Progresso numérico básico coberto; barras segmentadas e status composto não devem virar props CSS arbitrárias. |
| RadioGroup | 17 | Radio | Contrato Radio é lista de opções textuais; planos com preço, cartões com avatar e meios de pagamento são composições semânticas. |
| Select | 33 | Select | Opções simples cobertas; imagens, pesquisa, agrupamentos e conteúdo multimodal exigem extensão segura/novo componente especializado. |
| Separator | 6 | Separator | Variantes decorativas ou com texto demandam composição; não introduzir JSX arbitrário no separador. |
| Skeleton | 10 | Skeleton | Placeholder básico; layouts de carregamento exigem templates/apresentação controlada. |
| Slider | 12 | Slider | Faixa/step/orientação com evento; visualizações numéricas extras e controles +/- demandam composição. |
| Spinner | 12 | Spinner | Indicador básico; overlays, loading de botão, card de carregamento e barras precisam de composição, com política de estado. |
| Switch | 14 | Switch | Estado booleano e eventos; row de preferências e descrições são Field/composição. |
| Table | 17 | Table | Tabela básica é textual; ordenação, filtros e seleção devem utilizar DataTable aprovado. |
| Tabs | 9 | Tabs | Navegação de abas tipada; conteúdo de painel dinâmico e roteamento exigem contratos/slots autorizados. |
| Textarea | 6 | Textarea | Textarea simples; contador e limite de caracteres estão no contrato aprovado CharacterCountTextarea. |
| Toggle | 14 | Toggle | Estado pressionado, variante e tamanho; botões com badge, ícones e tooltip devem ser compostos. |
| ToggleGroup | 16 | ToggleGroup | Seleção única/múltipla básica; ícones, badges e opções ricas exigem composição ou propriedades seguras. |
| Tooltip | 16 | Tooltip | Texto + direção simples; trigger de ícone/custom exige composição segura. |
| Rating | 9 | Rating | **Lacuna concreta:** renderizador exibe estrelas inteiras mesmo para valores fracionários; distribuição agregada é RatingDistribution. Entrada de revisão com envio é funcionalidade diferente. |
| **Total** | **559** | **31 famílias** | **Cobertura integral de fontes, não equivalência integral de API** |

## Correções e prioridades identificadas

**P1 — evolução parcial nesta revisão:** `Carousel` agora expõe loop, orientação, setas, indicadores e densidade responsiva, **sem mídia remota nem autoplay**; `DropdownMenu` expõe separadores, rótulos, checkbox local e submenu de um nível, **sem rádio/grupos de ações de domínio**; `Pagination` implementa a janela `siblingCount`, primeira/última, salto e seletor de itens por página quando `totalItems` é conhecido. `Rating` já possui cálculo de preenchimento fracionário (`ratingStarFillPercent`); testes de interação fracionária e certificação visual permanecem pendentes.

**P2 — reforçar composições semânticas seguras:** `Avatar` recebeu indicador local de presença; `Alert` recebeu tom semântico e fechamento local. `ButtonGroup` (combinações com input/menu/botões), `RadioGroup` (cards/planos/pagamento), Avatar stack e alertas com ações externas continuam exigindo composição tipada; sempre reutilizar primitivas antes de criar novo contrato. Preservar contratos separados `OnboardingChecklist`, `RatingDistribution` e `CharacterCountTextarea`.

**Guardrails:** nem todos os exemplos são autônomos; vários importam componentes auxiliares, imagens de serviços de demonstração e estados React locais. Nada disso autoriza o Pi a emitir JSX, URL externa livre, `className`, autenticação ou handlers de negócio. A execução de exemplos visuais ReUI não equivale à admissão de seus comportamentos.

## Como reproduzir

Execute:

```bash
npm run reui:audit:check
npm run reui:audit -- --write
```

A primeira opção inspeciona todas as fontes e verifica os hashes da linha de base versionada; a segunda gera `src/ui-catalog/reui-primitive-coverage-audit.json` com **um registro detalhado por exemplo** (sinais extraídos e decisão de cobertura). O comando não modifica contratos Zod, nem aprova tipos. Agora a auditoria extrai também `observedPresentationProps` por exemplo, `observedProps` e `sharedProps` por família (frequência por arquivo, não por ocorrência). São indicadores heurísticos de atributos JSX, **não aprovação automática**, e devem ser conferidos em código antes de evoluir o schema.

**Próxima etapa de certificação:** executar testes E2E/ARIA e comparação visual com upstream por variação, revisar os cinco contratos `2.1.0` no PR e decidir separadamente sobre mídia local autorizada, controles com seleção por rádio e demais capacidades não admitidas.
