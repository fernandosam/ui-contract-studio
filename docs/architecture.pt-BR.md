[English](architecture.md) | [Português](architecture.pt-BR.md)

# Arquitetura vigente

O UI Contract Studio combina React com um catálogo **fechado** de elementos renderizáveis a partir de JSON, validado com Zod. Agentes podem gerar specs, mas não definir componentes, código, URLs ou efeitos arbitrários.

## Fontes de verdade

| Responsabilidade | Fonte |
| --- | --- |
| Schemas de base/extensão | `src/ui-catalog/catalog.ts` e `src/ui-catalog/extensions/catalog.ts` |
| Registry e adapters | `src/ui-catalog/registry.tsx` e `src/ui-catalog/extensions/registry.tsx` |
| Versão, integridade e status dos contratos | `src/ui-catalog/contracts.lock.json` |
| Origem, licença e revisão declarada | `src/ui-catalog/sources.json` |
| API publicada para o agente | `pi-catalog/contracts.json` |
| Tipos aposentados | `pi-catalog/retired-contracts.json` |
| Telas e padrões | `src/ui-screens/` e `src/ui-patterns/` |
| Composições estáticas | `src/ui-catalog/extensions/composites/templates/` |
| Plano das fontes shadcn/ui | `shadcn-plan.json` |
| Exemplos ReUI | `src/ui-catalog/extensions/composites/reui-composite-definitions.ts` |

No snapshot 0.24.0, o lock registra **102 contratos ativos** (base/extensão revisados), e o manifesto oficial Pi v3 possui a única coleção `components`, incluindo também as composições experimentais admitidas (41 base e 61 extensões). O plano shadcn/ui contém **50 primitivas planejadas/locais** e a ReUI reúne **559 exemplos React**. São inventários independentes: instalar uma primitiva ou criar um exemplo não adiciona um contrato Pi. Em futuras versões, consulte os arquivos em vez de presumir que essas contagens permanecem iguais.

## Responsabilidades

1. **Primitivas:** implementações shadcn/ui em `src/components/ui/` e componentes ReUI não autorizam uso automático na spec.
2. **Catálogo:** Zod controla tipos, propriedades, slots, eventos e ações; adapters implementam o que foi aprovado.
3. **Composições:** templates JSON, manifesto `generated-manifest.json` e código derivado em `src/ui-catalog/extensions/generated/`. Nunca edite saídas geradas. Comportamento stateful exige React explícito.
4. **Runtime:** `src/ui-runtime/` fornece exploradores e renderização; o registry de composições é transmitido por contexto.
5. **Pi Agent:** contexto selecionado e exemplos em `pi-catalog/`, com validação da spec antes de utilizar.

As propriedades `content` e `nodeProps` só editam valores autorizados: não substituem tipos, árvore, URLs, handlers, ações ou identidade dos campos. Versões/fingerprints e `status: approved` documentam integridade técnica, **não aprovação humana**. Demos de login, pagamento e acesso remoto não fornecem serviços de produção.

Veja [componentes](components.pt-BR.md), [agentes](agents.pt-BR.md), [desenvolvimento](development.pt-BR.md) e [governança](governance.pt-BR.md).
