[English](README.md) | [Português](README.pt-BR.md)

# UI Contract Studio

**Componentes de interface declarativa com contratos verificáveis para agentes de IA.**

O UI Contract Studio é um projeto independente em React para explorar componentes shadcn/ui (Base UI), composições e exemplos ReUI, além de gerar e validar telas JSON com **json-render**, **Zod** e **Pi Agent**. O objetivo é controlar quais componentes, propriedades, eventos e ações um agente pode utilizar.

## O que está disponível

- **Explorador de primitivos:** contratos, propriedades, prévias e orientações de uso.
- **Explorador de compostos:** composições reutilizáveis e suas APIs aprovadas.
- **Explorador de exemplos:** inspeção e edição local de specs declarativas.
- **ReUI:** galeria de exemplos React agrupados por família, com filtros e notas para agentes.
- **Blocos shadcn/ui:** páginas de demonstração de Login, Cadastro e Sidebars.
- **Pi Agent:** manifestos, schemas, exemplos, contexto selecionado e validação de specs.

O catálogo do Pi é **fechado por padrão**: componentes ReUI e arquivos shadcn/ui não se tornam contratos automaticamente. Telas geradas por agentes são **JSON**, sem JSX/HTML, callbacks, URLs externas ou ações arbitrárias. Autenticação, pagamentos e dados remotos apresentados nas demos não representam integrações de produção.

**Ciclo de admissão:** o [catálogo oficial](pi-catalog/contracts.json) agora possui inventário unificado `entries` com contratos estáveis e experimentais. Novos candidatos revisados tornam-se executáveis somente com `--channel=experimental` ou na [tela Catálogo Pi](docs/admission-engine.pt-BR.md) (`/?screen=catalogo-pi`). A certificação E2E vinculada ao fingerprint promove componentes locais para uso estável, sem quebrar a lista `contracts` preexistente.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS 4 · shadcn/ui Base UI · Zod 4 · json-render · Playwright.

## Começar

Requer Node.js **22+** e npm.

~~~bash
git clone https://github.com/fernandosam/ui-contract-studio.git
cd ui-contract-studio
npm ci
npm run dev
~~~

## Verificar

~~~bash
npm run test:offline   # invariantes sem dependências adicionais
npm run docs:check     # links locais e consistência de manifestos
npm run validate       # verificações de catálogo, lint e testes
npm run build          # TypeScript e Vite
~~~

O CI de qualidade roda em pull requests e pushes na `main`. O [Admission Engine](docs/admission-engine.pt-BR.md) publica propostas revisadas em artefatos experimentais após os testes automáticos; o E2E manual na main pode promover uma proposta coberta a um artefato isolado de distribuição estável. **Nenhum dos canais registra novos tipos no catálogo Pi oficial.** O **E2E completo** é executado manualmente na `main` em **Actions → E2E manual (main)**; a auditoria visual tem fluxo separado. A presença de componentes, testes estruturais ou diferenças de pixels não equivale a homologação visual.

## Onde encontrar

| Local | Conteúdo |
| --- | --- |
| `src/components/ui/` | Primitivas locais shadcn/ui |
| `src/ui-catalog/` | Contratos Zod, registry, fontes e manifestos |
| `src/ui-runtime/` | Renderização, navegação e exploradores |
| `src/ui-screens/`, `src/ui-patterns/` | Telas e padrões JSON |
| `pi-catalog/` | APIs e exemplos consumidos pelo agente |
| `docs/` | Guias vigentes e registros de auditoria |
| `sandbox/` | Ferramentas de validação conectada |

Leia o [índice da documentação](docs/README.pt-BR.md), as [instruções para agentes](AGENTS.pt-BR.md), o [guia de contribuição](CONTRIBUTING.pt-BR.md) e o [CHANGELOG](CHANGELOG.pt-BR.md).

## Licença e publicação

O código autoral é distribuído sob [MIT](LICENSE); direitos, marcas e licenças de terceiros continuam aplicáveis. Consulte [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.pt-BR.md).

**Este repositório já é público.** A publicação não dispensa auditoria de informações confidenciais, direitos autorais e permissões: veja [governança e auditoria contínua](docs/governance.pt-BR.md) e [segurança](SECURITY.pt-BR.md). O projeto não é produto oficial de órgão público. Não inclua dados pessoais, credenciais ou recursos internos restritos.
