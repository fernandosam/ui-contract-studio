# UI Contract Studio

**Schema-driven UI components for AI agents.**

UI Contract Studio é um ambiente independente para **explorar, compor e validar interfaces declarativas**. Combina React, primitivas do shadcn/ui (Base UI), composições de interface, contratos estritos com Zod e geração de telas JSON por agentes de IA via `json-render` e **Pi Agent**.

O diferencial é o **contrato seguro e verificável** entre o agente e os elementos que a aplicação pode renderizar — não apenas uma coleção de componentes visuais.

## Recursos

- **Explorador de primitivas:** catálogo com propriedades validadas, orientações de uso e exemplos.
- **Explorador de compostos:** padrões reutilizáveis com dados e propriedades aprovadas.
- **Explorador de exemplos:** inspeção e edição local de telas declarativas.
- **ReUI:** galeria de exemplos agrupados por componente, com filtros, prévias e orientações para agentes.
- **Blocos shadcn/ui:** telas de Login, Cadastro e Sidebars. O composto `Dashboard01` permanece disponível no catálogo, sem página Dashboard.
- **Integração com agentes:** schemas Zod, fixtures, manifestos, exemplos e validação de specs JSON.

As specs de agentes **não aceitam JSX, HTML, callbacks, ações nem URLs arbitrárias**. Os cenários de login, pagamentos e dados são demonstrativos, sem acesso a sistemas reais.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · shadcn/ui Base UI · Zod 4 · json-render · Playwright.

## Executar localmente

Requer Node.js **22+** e dependências do npm.

```bash
git clone https://github.com/fernandosam/ui-contract-studio.git
cd ui-contract-studio
npm ci
npm run dev
```

**Repositório:** [fernandosam/ui-contract-studio](https://github.com/fernandosam/ui-contract-studio). 

## Validar

```bash
npm run test:offline
npm run shadcn:verify
npm run validate
npm run build
```

A qualidade básica é verificada em PRs e em pushes para a `main`. O E2E completo é executado **manualmente na main** em `Actions → E2E manual (main)`. A auditoria visual completa também possui workflow próprio; a aprovação depende de screenshots e comparação reais, e não apenas de inventários.

## Estrutura do projeto

| Caminho | Responsabilidade |
| --- | --- |
| `src/components/ui/` | Primitivas e componentes shadcn/ui locais |
| `src/ui-catalog/` | Schemas, contratos, adapters, composições e fontes |
| `src/ui-runtime/` | Shell, renderização e exploradores |
| `src/ui-screens/`, `src/ui-patterns/` | Exemplos e padrões declarativos |
| `pi-catalog/` | Schemas e exemplos para agentes |
| `docs/` | Arquitetura, governança e documentação |
| `sandbox/` | Verificação conectada e evidências visuais |

Veja também [CHANGELOG.md](CHANGELOG.md). Para detalhes, consulte [a documentação](docs/README.md), o [fluxo do Pi Agent](docs/pi-workflow.md) e as [regras de admissão de componentes](docs/admissao-componentes.md).

## Licença, terceiros e segurança

O código autoral do projeto está sob a [licença MIT](LICENSE), sem substituir direitos e avisos de terceiros. Atribuições às bibliotecas shadcn/ui e ReUI constam em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). A licença do código **não autoriza automaticamente** reprodução de marcas e de recursos externos.

Este é um projeto independente, não uma solução oficial de qualquer órgão público. Não utilize dados pessoais, credenciais, endpoints internos ou informações institucionais restritas.

**A visibilidade pública ainda depende de revisão:** consulte a [checklist de publicação](docs/publicacao-open-source.md), inclusive auditoria de histórico Git, direitos de terceiros e validação dos workflows. Para contribuir, leia [CONTRIBUTING.md](CONTRIBUTING.md).
