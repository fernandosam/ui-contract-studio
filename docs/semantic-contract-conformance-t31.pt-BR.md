[English](semantic-contract-conformance-t31.md) | [Português](semantic-contract-conformance-t31.pt-BR.md)

# T31 — Auditoria de aderência semântica ao contrato

O conhecimento curado em `src/ui-catalog/knowledge/*.json` descreve capacidades e lacunas, mas não autoriza APIs. A auditoria T31 correlaciona **cada capacidade** com evidência de implementação, o lock de contratos, o manifesto Pi e o JSON Schema Zod real gerado. A auditoria é determinística, somente leitura e não promove contratos.

## Acionamento obrigatório

**Toda alteração no conhecimento semântico** deve passar por `npm run semantic:check`. A auditoria T31 é chamada **dentro** de `buildSemanticKnowledge()`, utilizado por `semantic:check`, `semantic:report`, `semantic:context` e `pi:context`. O job `offline-policy` do workflow de qualidade executa os dois primeiros **sem filtro por caminho**, em PRs e pushes para `main`. Por isso, a alteração em `src/ui-catalog/knowledge/` não pode evitar a auditoria por ser considerada documentação. Para uso local antes do PR, execute os comandos abaixo; verificações não executadas não podem ser consideradas aprovadas.

~~~bash
npm run semantic:check
npm run semantic:report
npm run semantic:context -- --component=AlertDialog
npm run pi:zod-schema
npm run pi:context -- --types=AlertDialog --stdout
npm run contracts:check
npm run pi:api:check
npm run pi:fixtures:check
npm run admission:check
node --test tests/semantic-contract-conformance-t31.test.mjs
~~~

O relatório oficial continua sendo `reports/composition-analysis/semantic-knowledge.json`, com `semanticConformance.summary`, `components[]`, `entries[]`, `diagnostics[]` e `errors[]`. `semantic:report` gera JSON diagnóstico marcado `validation.status: failed` quando algum gate falha. O sumário de CI expõe a contagem de capacidades estáticas, vínculos Zod, decisões pendentes e erros, anexando o relatório e logs no artefato existente.

## Campos opcionais de conhecimento curado

Dentro de `capabilities[]`, `contractBindings` associa uma capacidade **implementada com evidência** a uma propriedade ou evento Pi admitido. A auditoria verifica sua presença no JSON Schema Zod real. Não é permitido criar props ou eventos por meio desse campo. Quando o schema não está disponível, a vinculação é sinalizada como `schema-unavailable`, sem certificação.

~~~json
{
  "id": "confirm-signal",
  "state": "implemented-static-evidence",
  "contractBindings": [{"kind": "event", "name": "confirm"}]
}
~~~

Para capacidades ainda não implementadas, `decision` registra um encaminhamento explícito, revisável. Valores: `retain-primitive`, `evolve-primitive`, `reuse-composition`, `propose-composition`, `out-of-scope`. Toda decisão exige `reason`; decisões de composição exigem `target` (nome PascalCase). Uma decisão não declara que a proposta foi implementada nem admitida.

~~~json
{
  "id": "typed-confirmation",
  "state": "documented-not-implemented",
  "decision": {
    "disposition": "propose-composition",
    "target": "TypedConfirmationDialog",
    "reason": "Exige contrato independente e revisão de admissão."
  }
}
~~~

## Critérios de conformidade

- `verified-static`: trechos locais encontrados; não atesta execução.
- `verified-schema`: vínculo explicitamente declarado foi encontrado na API Zod; não concede permissão nova.
- `not-implemented`: permanece indisponível e exige decisão arquitetural, não promoção automática.
- `runtime-review-required`: exige teste de navegador, teclado, acessibilidade ou responsividade.
- `contract-mismatch`, `not-in-zod-schema` e `unauthorized-binding`: **falhas bloqueantes**.
- `decision-required` e `runtime-review-required`: diagnósticos acionáveis; não bloqueiam o CI por si sós.

As entradas sem `contractBindings` continuam válidas para capacidades de estado interno, renderização ou comportamento local que não correspondem a propriedade/evento Pi. Não faça mapeamentos falsos apenas para elevar números do relatório. O `selected[].semantic` de `pi:context` agora reúne orientações, evidências/classificações e decisões, **sem alterar `propsSchema`, `actionSchemas` ou o canal de admissão**. O array `semanticAdvice` continua disponível para consumidores existentes.

## Limite da implementação

A T31 não modifica React, Zod, lock, fingerprints ou a política de admissão automaticamente. Exemplo: `AlertDialog` já expõe `confirm`, `size` e `confirmVariant`; confirmação por checkbox ou texto exige composição independente, revisão e testes próprios. Evoluções funcionais posteriores deverão alterar React, Zod, registry, versões, fixtures e testes de maneira coordenada e passar pela política de admissão. Documentação semanticamente completa não significa homologação de runtime.

## T32 — Primeira evolução por componente: AlertDialog

A API aprovada de AlertDialog permanece inalterada. O adaptador React agora limita a largura ao viewport e a altura ao viewport dinâmico, permitindo rolagem interna em telas pequenas ou baixas sem cortar ações. O evento local `confirm` e o cancelamento explícito não concedem acesso ao backend.

O teste `tests/alert-dialog-semantic-t32.test.mjs` protege contra ampliação acidental de Zod/Pi e mantém confirmação digitada e por checkbox como propostas independentes. `tests/e2e/alert-dialog-semantic-t32.spec.ts` verifica Enter, Escape, retorno de foco, cancelamento, fechamento após confirmação, ausência de requisições remotas e a variante pequena destrutiva em desktop/mobile. O job de navegador existente inclui esses cenários. Os testes não promovem capacidades ou certificam contratos automaticamente. Mantenha `focus-and-keyboard` e `mobile-dialog` como `runtime-review-required` até a revisão independente das evidências reais de navegador.
