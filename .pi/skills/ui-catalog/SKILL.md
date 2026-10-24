---
name: ui-catalog
description: Gerar telas com catálogo fechado json-render; reutilizar padrões JSON e admitir extensões com revisão independente.
---

# UI Catalog v0.19

## Criar tela
1. Leia AGENTS.md, `src/ui-catalog/create-preview-inventory.json`, contracts.lock.json, `src/ui-patterns/*.json` e consulte `/?screen=explorador-primitivos`, `/?screen=explorador-compostos` ou `/?screen=explorador-exemplos` se for útil.
2. Reutilize um dos 8 padrões JSON aprovados ou as telas `exemplo-01`/`exemplo-02` como referência; componentes novos devem ser admitidos antes da tela. Consulte a documentação da primitiva em https://ui.shadcn.com/docs/components e execute `npx shadcn docs <nome>` quando disponível.; não introduza novas primitivas se os contratos cobrem a necessidade.
3. Reutilize somente os contratos compostos ativos no lock quando apropriados; a tela só pode referenciar tipos registrados e não pode copiar a árvore interna do card.
4. Escreva `src/ui-screens/<slug>.json` + `src/ui-screen-meta/<slug>.json` com props, slots, eventos e ações válidos.
5. Execute `npm run composites:check && npm run screens:check && npm run patterns:check && npm run examples:check && npm run check:catalog && npm run validate` e testes navegador aplicáveis.
6. Relate interfaces, contratos, exemplos, testes realmente executados e limitações.

## Expandir catálogo
- Primeiro confirme uma lacuna funcional comprovável; nunca apenas por motivo estético.
- Para lógica/estado próprios, escreva um componente React em `extensions/components`, schema Zod estrito em `extensions/catalog.ts` e adapter no registry. Para composição estática, use o manifesto e o gerador da v0.19; não crie wrappers.
- Proponha revisão independente de sources.json / contracts.lock.json. Não marque sua própria extensão como aprovada.
- Verifique compatibilidade, acessibilidade, efeitos, ações seguras, props inválidas e regressões visuais.
- Não instalar shadcn Studio; usar componentes shadcn oficiais somente como implementação interna.

## Dados e ações
- DataTable remoto aplica debounce e usa `sourceId` autorizado: não montar URLs a partir do JSON.
- O endpoint `processos-api` requer servidor real com SSO/autenticação, escopo e isolamento por tenant. A autorização NÃO pode ser decidida no cliente.
- DatePicker obedece limite e obrigatoriedade; confirmar teclado e estados de erro.
- Não adicionar tokens, dados sigilosos, URLs arbitrárias ou ações destrutivas sem autorização.

## Avaliação do agente
- `tests/prompt-evals/scenarios.json`: 20 casos; usar `npm run eval:pi:context` e execução real via `npm run eval:pi:run -- --execute` com `PI_EVAL_CONFIRM=yes`.
- Rodar `npm run eval:pi:strict` após a avaliação para validar schemas e gerar métricas. Sem saídas reais, reportar 'não executado'.
- Não executar 20 gerações pagas automaticamente em toda mudança; o workflow CI dedicado é manual/explicita custo.

## Homologação
- Se npm ou navegador indisponível, rodar somente testes offline e declarar build/E2E não verificados.
- `npm run bootstrap:connected` instala primitivas oficiais, prepara lockfile e tenta build; revisar mudanças do CLI antes de versionar.

## API pública shadcn/ui — versão 0.9
- Para novos JSONs, utilize **somente** os nomes e props atuais de `src/ui-catalog/catalog.ts` e `src/ui-catalog/extensions/catalog.ts`.
- Os contratos aprovados têm versão semântica (base v2.0.0). Props antigas (`Button.variant=primary/danger`, `Badge.text`, `Alert.type/message`, `Dialog.openPath`) não são permitidas.
- Os componentes React devem delegar a primitivas shadcn/ui oficiais quando houver equivalente. Sem equivalente nativo, documentar a composição, sem anunciar API oficial inexistente.
- Para componentes compostos (`Card`, `Table`, `Tabs`, `DatePicker`, `DataTable`), expor apenas dados serializáveis, props compatíveis e eventos autorizados; **não** aceitar JSX/callbacks/HTML/className vindos de JSON.
- `shadcn-plan.json` determina dependências para instalação, **não** contratos aprovados.
- Migrações de contratos devem alterar schemas, registry, telas, padrões, exemplos, lock/fingerprints, documentação e testes em conjunto.

## Referências shadcn/create
- `exemplo-01.json` representa 31 cards do `preview`; `exemplo-02.json` representa 33 cards do `preview-02`. Dez vitrines agora são árvores inline de primitivas, e 54 cards são contratos compostos ativos. Não restaure wrappers redundantes.
- Não remover cards sem atualizar o manifesto oficial e obter revisão. Para qualquer nova primitiva ausente, aplicar fluxo de admissão, nunca importar JSX diretamente nas telas.
- A dependência `class-variance-authority@0.7.1` deve permanecer declarada em dependencies, pois as primitivas a utilizam em runtime.


## Referência visual obrigatória

Antes de compor um card do shadcn/create, **ler o JSX oficial e verificar a aparência renderizada**; registrar a revisão, diferenças e screenshots antes de considerar visualmente aprovado. Não basta reutilizar um Card genérico. Consultar `docs/revisao-visual-shadcn.md` e `src/ui-catalog/create-reference-audit.json`. Rodar `npm run reference:check`; para aprovação visual rodar `npm run reference:strict`.

### Blocos shadcn oficiais
Consulte `src/ui-catalog/block-source-inventory.json` antes de criar telas com Dashboard01, Login01..Login05, Signup01..Signup05, Sidebar01..Sidebar16. Todos são compostos aprovados, mas visualmente não homologados; não invente arquivos ou declare screenshots validadas. Para novas composições faça revisão de código + preview antes da criação do template.

## Navegação, histórico e previews editáveis (v0.15)
- Grupos de menu: **Exemplos** (Galeria 1/Galeria 2), **Blocos shadcn** (Dashboard, Login, Cadastro, Sidebars) e **Ferramentas** (Explorador visual).
- As telas antigas `dashboard`, `usuarios`, `catalogo`, `playground`, `extensoes` e `auditoria` foram retiradas do diretório `src/ui-screens`. Não recriá-las nem introduzir JSX de telas sem solicitação explícita.
- Evolução do projeto em `CHANGELOG.md`; README apenas com orientação para a versão corrente.
- Mudanças feitas no Explorador visual alteram somente um clone da spec para prévia; validar via Zod/`catalog.validate` antes de renderizar; nunca persistir props automaticamente.
- No Carousel, manter setas no fluxo e dentro dos limites do viewport em todos os breakpoints; testar antes de homologar.

### Novos contratos compostos Site* (v0.16)
Consultar `src/ui-catalog/site-compositions-audit.json` antes de compor com padrões do portal shadcn v4. A auditoria encontrou 27 compostos originais, 12 aposentados na v0.21. Consulte a lista ativa; use seus tipos declarativos, sem copiar JSX remoto. A inspeção de TSX não comprova equivalência visual; somente screenshots aprovados podem fazê-lo.

## Contexto selecionado para Pi (v0.17)
- Leia `pi-catalog/contracts.json`, escolha os tipos e execute `npm run pi:context -- --types=<TipoA>,<TipoB>`; envie ao agente `reports/pi-context/selected.json`.
- Um exemplo individual para cada contrato ativo: `pi-catalog/examples/`. As composições ativas têm `props.content` com uma lista fechada de chaves de texto; nunca invente caminhos.
- Três demos interativas (Goal, Chat, Cookies) emitem eventos locais, **sem persistência remota**.
- Valide com `npm run pi:verify`, `npm run test:offline`, `npm run check:catalog` e, conectado ao npm, `npm run pi:zod-schema`, `npm run validate`, `npm run build` e E2E. Se estiver offline, informe explicitamente a limitação.

## Contexto tipado (v0.18)
- Gere schemas Zod reais via `npm run pi:zod-schema` e selecione até 25 tipos com `npm run pi:context -- --types=<nomes> --stdout`.
- **Não** considere `--metadata-only` apto para geração. Use `propsSchema` e `events` retornados como limites exatos.
- Valide toda spec por `npm run pi:validate -- --file=<caminho> --out=reports/pi-validation/<nome>.json` antes de salvar mudanças. Reparos devem tratar `issues[].pointer` e manter as ações permitidas.
- Priorize props semânticas em PaymentMethod/TeamMembers/ActivityGoal/Chat/CookieSettings, com conteúdo demo e sem efeitos institucionais.
- Não declare CI verde se `npm ci`, Zod para todos os contratos aprovados, build e Playwright não tiverem sido efetivamente executados.

## Implementação enxuta v0.19
- Composição estática: adicionar à lista declarativa revisada e gerar via `npm run composites:generate`; não criar TSX wrapper.
- Comportamento stateful novo: exige componente React próprio, schema estrito, testes, versão de contrato e aprovação.
- Amostras canônicas para o Pi e Explorador em `pi-catalog/examples/` geradas por `pi:fixtures`; chave semântica é sugestão, chave canônica do Zod é obrigatória.

## v0.20 — Dados flexíveis em componentes compostos
Para alterar tabelas, séries, opções, navegação e demais dados da composição, consulte `nodeProps` dentro do schema Zod exportado do Pi e as amostras individuais. Não invente IDs: eles vêm do template oficial e do manifesto `configurableNodeProperties`. Nunca altere eventos, ações, tipos de nós, nomes de campos ou URLs por essa API. Reportar comparação visual como pendente enquanto faltarem capturas oficiais/locais aprovadas.

## v0.21: migração de tipos aposentados
Antes de escolher um composto, consultar `pi-catalog/retired-contracts.json`, `docs/revisao-compostos-v021.md` e executar `npm run composites:pruning:check`. Não emitir tipos removidos nem restaurar Card/Stack sem capacidade própria.
