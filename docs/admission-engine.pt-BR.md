[English](admission-engine.md) | [Português](admission-engine.pt-BR.md)

# Admission Engine

Pipeline de distribuição opt-in para composições React + Zod estrito produzidas por receitas revisadas. **Não** autoriza tipos, eventos, ações ou permissões no catálogo Pi/json-render oficial.

## Canais

| Canal | Disparo | Critério | Resultado |
| --- | --- | --- | --- |
| Experimental | Push na `main` ou reexecução manual | `npm ci`, conferência de receitas e allowlist, `npm run validate` e `npm run build` | Artefato GitHub Actions `admission-experimental-<SHA>` |
| Distribuição estável (pós-E2E) | Workflow manual **E2E manual (main)** | E2E completo verde e evidências desktop/mobile vinculadas ao mesmo código | Artefato `admission-stable-<SHA>` |
| Catálogo Pi oficial | Integração separada | Revisão de Zod, registry, lock, fonte/licença e demais gates | `pi-catalog/contracts.json`, intocado pelo motor |

O artefato da **distribuição estável** representa uma versão *homologada por E2E* do código isolado; não é inclusão automática no runtime Pi nem serviço hospedado permanente. Os artefatos expiram (30 dias no experimental; 90 dias no estável). Não confundir E2E com certificação WCAG, leitor de telas, segurança ou produção.

## Política e limites

A [política](../src/ui-catalog/admission-engine/policy.json) permite inicialmente quatro receitas revisadas: `alert-checkbox`, `alert-typed`, `accordion-members` e `button-copy`. O gerador verifica sintaxe TypeScript, fixtures de Zod estrito, imports, dependências e efeitos proibidos. Os pacotes gerados incluem SHA-256 de cada arquivo, digest do candidato e SHA do commit. Uma implementação já presente no Pi é rejeitada.

Somente `alert-typed` dispõe de protocolo de E2E completo e, portanto, somente ele pode ser promovido inicialmente. Para ampliar a lista, é preciso incorporar um protocolo verificável e testes de navegador correspondentes — mudar uma flag não é suficiente.

## Execução

~~~bash
npm run admission:check
npm run validate && npm run build
npm run admission:publish -- --revision=<SHA-completo-do-commit>
npm run composition:pilot:reset
npm run test:composition:pilot
npm run composition:pilot:report
npm run admission:promote -- --revision=<mesmo-SHA>
~~~

O canal experimental escreve `dist/admission/experimental/catalog.json`; a promoção grava `dist/admission/stable/catalog.json` com digest da fonte e evidências. No GitHub Actions o E2E completo é executado no lugar do teste focado e o relatório do piloto confere os dez casos desktop/mobile. Evidências antigas são eliminadas antes dos testes. Qualquer ausência, falha, divergência de casos, capturas ou projeto bloqueia a promoção.

**Limite de confiança:** arquivos JSON/PNG não são assinados criptograficamente. A garantia vem da execução dos testes e regeneração dos artefatos no mesmo job confiável do GitHub Actions, na `main`, com permissão de leitura. Não aceite evidências fornecidas externamente como homologação. A execução local serve para desenvolvimento, não para certificação independente.

O motor não modifica `contracts.lock.json`, `sources.json`, `pi-catalog/contracts.json`, registries aprovados ou listas de ações. A integração do pacote homologado ao Pi exige processo separado de revisão.
