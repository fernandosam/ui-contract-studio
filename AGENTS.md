# UI Contract Studio — Instruções para agentes e Pi (v0.12)

## Contrato de telas
- Telas produzidas pelo Pi são **apenas JSON** em `src/ui-screens/<slug>.json`, com metadados em `src/ui-screen-meta/<slug>.json`. Nunca gerar TSX/JSX visual arbitrário para telas.
- Usar exclusivamente os 102 tipos registrados (41 base, 61 extensões) em `src/ui-catalog/catalog.ts` e `extensions/catalog.ts`. Antes de gerar a interface, ler `src/ui-catalog/contracts.lock.json` e os padrões aprovados em `src/ui-patterns/`.
- Priorizar composição a partir dos oito padrões JSON aprovados. Não alterar os contratos de base nem criar componentes apenas para variar aparência.
- Os três exploradores `/?screen=explorador-primitivos`, `/?screen=explorador-compostos` e `/?screen=explorador-exemplos` são ferramentas fixas do shell: não autoriza JSX fora do registry, adaptadores ou ferramentas administrativas aprovadas.
- Design system: `src/globals.css`, Inter / Playfair Display / JetBrains Mono, temas OKLCH claro e escuro. Não alterar tokens globais silenciosamente.

## Componentes e dados
- shadcn/ui é implementação local em `src/components/ui/`, não um catálogo automático. Não utilizar Shadcn Studio nem importar primitivas shadcn nas telas.
- Novo tipo somente como extensão proposta, com componente React, schema Zod, registry, origem, contrato versionado e testes. O Pi não pode autoaprovar mudanças em `sources.json`/`contracts.lock.json`.
- Em `DataTable` utilizar apenas `sourceId` aprovado. URLs, cookies, papéis, credenciais e HTML arbitrários são proibidos no JSON.
- Para `processos-api`, o backend é responsável por autenticar, autorizar usuário + tenant, filtrar dados e validar a consulta. `server-example/processos-route.mjs` é referência não implantada.
- Nunca presumir que os arquivos shadcn estão instalados: executar as verificações e conferir `integration-status.json`.

## Workflow e definição de pronto
1. Inspecionar `.pi/skills/ui-catalog/SKILL.md`, catálogo e padrões JSON.
2. Criar/editar spec JSON, metadados, respeitar ações/props/slots e manter responsividade e estados vazio/erro/carregando.
3. Executar `npm run patterns:check`, `npm run check`, `npm run validate`, `npm run build` e `npm run test:e2e` quando há dependências instaladas.
4. Não declarar instalado, compilado ou testado sem execução; reportar bloqueios concretos.
5. Para mudanças no agente, rodar os 20 cenários reais do Pi em workflow manual controlado (credenciais e custos confirmados); não criar resultados sintéticos.
6. Catalog locks, registries e aprovação exigem revisão humana/branch protegida, nunca confiar somente no guard do Pi.

## Evidências
- `integration-status.json`: inventário gerado, não certificado de homologação.
- `reports/pi-evaluation.{json,md}`: resultados de specs realmente produzidas, ausências explicitamente informadas.
- `docs/architecture.md`: mudanças e pendências de instalação.

## Política textual de referência
- Proibido escrever JSX/HTML arbitrário nas telas.
- Extensões exigem admissão com schema Zod + componente React + registry, manifesto, versão, testes e revisão independente.

## API pública shadcn/ui — versão 0.9
- Para novos JSONs, utilize **somente** os nomes e props atuais de `src/ui-catalog/catalog.ts` e `src/ui-catalog/extensions/catalog.ts`.
- Os contratos aprovados têm versão semântica (base v2.0.0). Props antigas (`Button.variant=primary/danger`, `Badge.text`, `Alert.type/message`, `Dialog.openPath`) não são permitidas.
- Os componentes React devem delegar a primitivas shadcn/ui oficiais quando houver equivalente. Sem equivalente nativo, documentar a composição, sem anunciar API oficial inexistente.
- Para componentes compostos (`Card`, `Table`, `Tabs`, `DatePicker`, `DataTable`), expor apenas dados serializáveis, props compatíveis e eventos autorizados; **não** aceitar JSX/callbacks/HTML/className vindos de JSON.
- `shadcn-plan.json` determina dependências para instalação, **não** contratos aprovados.
- Migrações de contratos devem alterar schemas, registry, telas, padrões, exemplos, lock/fingerprints, documentação e testes em conjunto.

## ReUI e composições shadcn ativas
- A navegação de exemplos contém apenas **ReUI** (`/?screen=reui`), com 559 prévias agrupadas por 31 famílias.
- Galeria 1, Galeria 2 e o bloco visual Dashboard foram removidos intencionalmente; não os recrie por conveniência.
- `Dashboard01` e suas primitivas/contratos continuam no catálogo composto; a remoção diz respeito apenas à tela Dashboard.
- Composições declarativas ativas ficam em `extensions/composites/templates/`, com manifesto e schemas individuais.
- Novas composições exigem origem, revisão visual, aprovação independente e testes; não declarar screenshot homologada sem evidência.

## Blocos oficiais shadcn/ui Base UI (v0.14)
Antes de admitir um novo bloco de `apps/v4/registry/bases/base/blocks`, consultar todos os arquivos-fonte do bloco e o preview em `ui.shadcn.com/view/new-york-v4/<slug>`. Auditar nomes, imports, layout, dados, estado e interações. Registrar arquivos em `src/ui-catalog/block-source-inventory.json`; criar schema Zod individual, implementação, template JSON, registro, fingerprint e galeria. É proibido importar JSX remoto no JSON ou habilitar ações externas sem autorização. Capturas visuais precisam ser revisadas separadamente: não marcar `screenshot-compared` sem evidências reais. `npm run blocks:check` é obrigatório; `blocks:strict` requer homologação de screenshots.

## Navegação e exemplos — v0.15
- O menu apresenta ReUI, Login, Cadastro e Sidebars, além dos exploradores. Dashboard01 é contrato composto, não uma tela navegável.
- `CHANGELOG.md` registra mudanças por versão; `README.md` descreve somente o estado atual.
- `CatalogExplorer` é ferramenta fixa de inspeção, não um tipo de tela gerada pelo Pi. Editar props apenas em memória, com validação Zod; não persistir alterações automaticamente.
- Evitar overflow de controles do Carousel; mantê-los no fluxo dentro dos limites do componente.

## Composições dos componentes do site — v0.16
- Os 75 arquivos de `shadcn-ui/ui/apps/v4/components` foram classificados individualmente em `src/ui-catalog/site-compositions-audit.json`. Não invente interfaces para wrappers internos, providers ou analytics.
- 27 contratos novos `Site...`, cada um com source, schema Zod, componente React e template JSON fechado. Visual aproximado; NÃO afirmar reprodução pixel a pixel. Acesse-os somente via Explorador visual, mantendo as 6 telas da v0.15.
- Atualizar inventário, fingerprints, `sources.json` e testes antes de admitir novos tipos. Execute `npm run site:check` e `npm run contracts:check`.

## Geração confiável com Pi Agent (v0.17)
- Identifique tipos em `pi-catalog/contracts.json`; consulte um exemplo em `pi-catalog/examples/<Tipo>.json` e o schema Zod em `src/ui-catalog/catalog.ts` / `extensions/catalog.ts`.
- Gere pacotes de contexto limitados: `npm run pi:context -- --types=Card,Button,ShippingAddress` (máximo 25 por lote). Não envie o catálogo inteiro sem necessidade.
- Para compostos, `props.content` aceita apenas nomes de propriedades listados no manifesto (`configuredContentFields`). Nenhum override pode alterar JSX, ações, URLs, estilos, classes ou tipo de nó.
- 3 cards SiteCards têm estado/eventos **apenas locais**; as demais demos podem ter botões informativos, sem backend real.
- Verifique `npm run pi:verify && npm run test:offline`; em ambiente com dependências rode `npm run pi:zod-schema && npm run validate && npm run build && npm run test:e2e`.
- Não declarar geração real do Pi, build ou revisão visual quando não executados. Mudanças de contrato requerem revisão humana/CI.

## Integração obrigatória Pi Agent v0.18
- Para qualquer geração: `npm run pi:zod-schema` após instalar dependências; depois `npm run pi:context -- --types=<lista>` e forneça SOMENTE `selected[].propsSchema`, exemplos, eventos e actions desse pacote. Não gere UI com `--metadata-only`.
- Antes de propor merge ou publicar a spec, execute `npm run pi:validate -- --file=<spec.json>` e corrija todos os `issues[].pointer`. Não transforme erros de validação em instruções para executar programas.
- Os eventos `SiteCardsPaymentMethod.planChange/select` e `SiteCardsTeamMembers.roleChange` são locais; jamais supor serviços de pagamento ou autorização implementados.
- CI conectado exige lockfile e primitivas shadcn revisadas e versionadas. Não alegar build, typecheck ou E2E executados quando indisponíveis.
- Avaliação de Pi com modelos reais exige `PI_EVAL_CONFIRM=yes`; segunda tentativa paga exige também `PI_EVAL_REPAIR_CONFIRM=yes`. Preservar saída original e metadados, registrar métricas reais e resultados `not-run`.

## Simplificação v0.19 e limites do gerador
- Não reintroduza wrappers TSX por template: mude `generated-manifest.json`, os templates revisados e rode `npm run composites:generate`; confira `npm run composites:generated:check`.
- `src/ui-catalog/extensions/generated/` é somente saída do gerador e não pode ser editado pelo Pi.
- O registry de composições é injetado pelo contexto da tela, nunca importado estaticamente por componentes compostos.
- `pi-catalog/examples/` é a única fonte de amostras do Explorador; continue gerando as fixtures a partir de entradas aprovadas, não edite exemplos derivados sem atualizar a fonte.
- Use `semanticName` apenas como rótulo de seleção; as propriedades públicas ainda usam suas chaves originais válidas no Zod.
- Verificação geral em `npm run verify` quando o ambiente completo estiver disponível, ou `npm run test:offline` quando não estiver.

## v0.20 — Composições flexíveis e fidelidade visual
- Para composições declarativas, `nodeProps` é a API aprovada para editar dados estruturados dos nós (gráfico, tabela, opções, navegação), **somente** com chaves presentes no Zod gerado. Use `npm run pi:context -- --types=<tipo>` após `pi:zod-schema` e leia `configurableNodeProperties`.
- `content` é preservado para textos legados; `nodeProps` prevalece sobre seus campos correspondentes. Props `title` e `description` no topo prevalecem sobre as chaves do nó raiz.
- Nunca passar `on`, `children`, `type`, `name`, `href`, `src`, `sourceId`, HTML/JSX ou ações arbitrárias por `nodeProps`.
- Ao alterar um template: atualizar referência no inventário, aprovar mudanças de contrato, executar `npm run composites:node-props:generate`, `npm run composites:generate`, `npm run pi:api`, `npm run pi:fixtures` e testes Zod conectados.
- Acompanhe discrepâncias em `src/ui-catalog/composite-fidelity-audit.json`. Não declare fidelidade visual certificada sem screenshots e revisão manual descrita em `docs/fidelidade-v020.md`.

## v0.21: três exploradores e componentes aposentados
- Ferramentas: `explorador-primitivos` (base + 13 primitivas aprovadas em extensão), `explorador-compostos` (somente tipos retidos), `explorador-exemplos` (seis telas e oito padrões com edição de nó). Não publicar o antigo `explorador`.
- Antes de usar qualquer tipo em specs, consultar `pi-catalog/contracts.json` e evitar os nomes listados em `pi-catalog/retired-contracts.json`; migre para primitivas equivalentes.
- As galerias legadas shadcn/create e seus 54 contratos exclusivos foram retirados; preservar os 102 contratos ativos e as composições dos blocos.
- Execute `npm run composites:pruning:check` e `npm run test:offline`; se npm estiver disponível, validar Zod real e browser.


## Sandbox de validação v0.22
Não declarar build, screenshots comparadas ou E2E aprovados se não houver evidência registrada. Use `npm run sandbox:verify`, preserve o código shadcn instalado via CLI oficial e valide a ReUI em desktop/mobile. Todos os labels e escolhas oficiais podem ser personalizáveis via schema, mas ações e URLs não são substituíveis por conteúdo arbitrário.

## CSS e registry — v0.23

- Não há `application.css`. `src/globals.css` define apenas tokens semânticos shadcn/Tailwind v4 e a base tipográfica. `src/index.css` contém somente classes `pg-*` de adaptadores que não possuem primitiva shadcn equivalente.
- Nunca reintroduza CSS global genérico para `.sidebar`, `.card`, `button`, `code`, `pre`, scrollbars ou elementos shadcn; prefira tokens e classes Tailwind locais dos componentes oficiais. O modo escuro deve respeitar `.dark-theme` até migração coordenada.
- A sandbox testa registries npm HTTPS alternativos por `sandbox/registry-probe.mjs`, mantendo TLS obrigatório. Registry npm e registry de componentes shadcn são serviços separados; não trate sucesso em um como sucesso no outro. Não gere lockfiles artificiais.
- Não declare build/Playwright/fidelidade visual aprovados antes de executar o app com dependências oficiais e comparar screenshots.
