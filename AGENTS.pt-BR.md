[English](AGENTS.md) | [Português](AGENTS.pt-BR.md)

# UI Contract Studio — regras para agentes

Este arquivo contém somente as **regras vigentes**. Fluxos detalhados estão na [skill Pi](.pi/skills/ui-catalog/SKILL.pt-BR.md) e nos [guias](docs/README.pt-BR.md); mudanças antigas ficam no [CHANGELOG.md](CHANGELOG.pt-BR.md).

## 1. Fonte de verdade e limites da interface

- Antes de gerar telas, consulte `pi-catalog/contracts.json`, `src/ui-catalog/contracts.lock.json`, `src/ui-catalog/catalog.ts`, `src/ui-catalog/extensions/catalog.ts` e `src/ui-patterns/`. O catálogo ativo é fechado e inclui tipos-base e extensões; **não infira contratos a partir de aparências ou arquivos TSX instalados**.
- Telas geradas pelo Pi são **somente JSON** em `src/ui-screens/<slug>.json`, com metadados em `src/ui-screen-meta/<slug>.json`. Proibido escrever JSX/HTML arbitrário nas telas.
- Reutilize padrões JSON e tipos ativos. Confira `pi-catalog/retired-contracts.json` antes de escolher um tipo. Não restaure galerias ou tipos aposentados.
- ReUI, componentes shadcn/ui instalados e código de demonstração **não** são automaticamente tipos Pi. Os exploradores são ferramentas fixas de inspeção, não componentes gerados por agentes.

## 2. Segurança dos contratos e dados

- JSONs aceitam somente tipos, propriedades, slots, eventos e ações explicitamente definidos pelo Zod. Proibidos JSX, HTML, callbacks, `className` livre, estilos arbitrários, credenciais, cookies, endpoints e URLs não aprovados.
- Para dados remotos, use apenas `sourceId` declarado. O exemplo `processos-api` **não fornece backend**: autenticação, autorização, escopo por usuário/tenant e validação de consultas são responsabilidades do servidor real.
- Alterações de `nodeProps` e `content` respeitam as chaves expostas pelo manifesto; não podem substituir tipo de nó, ações, handlers, links, fontes nem identidade de campos.
- Não modifique `src/globals.css`, `src/index.css` ou o shell para contornar um contrato sem justificativa e revisão. Preserve acessibilidade, responsividade, temas e estados de carregamento/erro/vazio.

## 3. Alteração ou admissão de componentes

- Primeiro verifique se há um equivalente aprovado. Para uma lacuna real, é obrigatória **admissão com schema Zod + componente React + registry**, origem e licença em `sources.json`, versão/fingerprint em `contracts.lock.json`, exemplos, testes e revisão independente. Um agente **não pode autoaprovar** a própria mudança.
- Para composições estáticas, edite templates e `generated-manifest.json`, execute `npm run composites:generate` e nunca edite manualmente `src/ui-catalog/extensions/generated/`. Composições com estado próprio exigem implementação React explícita e adapter tipado.
- Gerar ou instalar código shadcn/ui não altera o catálogo automaticamente; valide a origem em `shadcn-plan.json` e use `npm run shadcn:verify`. Alterações de schema, props ou eventos exigem migração de telas, padrões, manifestos e testes.

## 4. Geração e validação com Pi

1. Gere schemas reais com `npm run pi:zod-schema`; selecione **somente os tipos necessários** usando `npm run pi:context -- --types=Card,Button` (até 25 por lote). Não gere com `--metadata-only`.
2. Use apenas `propsSchema`, exemplos, eventos e ações do contexto selecionado, mantendo os nomes canônicos das propriedades.
3. Valide a spec com `npm run pi:validate -- --file=<arquivo.json>` e corrija os apontamentos de `issues[].pointer` antes de propor merge.
4. Avaliações pagas/reais do agente são **manuais**, com consentimento explícito (`PI_EVAL_CONFIRM=yes`; reparo também requer `PI_EVAL_REPAIR_CONFIRM=yes`). Nunca fabrique saídas ou evidências.

## 5. Definição de pronto

- Execute `npm run test:offline`, `npm run docs:check` quando houver documentação, `npm run validate` e `npm run build` em ambiente disponível; testes específicos de contratos e geração se aplicam conforme a mudança.
- E2E completo é **manual na branch main** via GitHub Actions; localmente, `npm run verify` inclui Playwright. A auditoria visual exige screenshots **reais** e revisão, não um inventário ou aprovação automática por diferença de pixels.
- Informe quais testes foram realmente executados, falhas e limitações; não declare build, Playwright, avaliação real do Pi ou homologação visual sem evidência.
- `sources.json` e `contracts.lock.json` são registros de revisão, não prova de aprovação humana. A proteção de branch e a revisão independente devem ser impostas na plataforma Git.

**Referências:** [arquitetura](docs/architecture.pt-BR.md) · [componentes](docs/components.pt-BR.md) · [integração Pi](docs/agents.pt-BR.md) · [qualidade](docs/development.pt-BR.md) · [governança](docs/governance.pt-BR.md).
