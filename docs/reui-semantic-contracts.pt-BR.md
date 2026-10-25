[English](reui-semantic-contracts.md) | [Português](reui-semantic-contracts.pt-BR.md)

# Camada de contratos semânticos — ReUI

## Objetivo e fronteiras

O catálogo **aprovado** descreve intenção, dados e interações autorizadas em Zod; os **559 exemplos ReUI** permanecem referências visuais/funcionais, não 559 tipos Pi. O registro React, as prévias e os exemplos de demonstração não concedem permissão para HTML, JSX, classes livres ou efeitos externos.

## Classificação inicial dos 559 exemplos

`src/ui-catalog/reui-semantic-admissions.json` possui uma entrada rastreável por ID, categoria, contrato associado, status e justificativa. A classificação original era **conservadora e inicial**, não equivale a auditoria manual de fidelidade de todas as entradas:

- **382** exemplos já associados na primeira rodada de famílias com contratos primitivos homônimos: `existing-primitive-variant` / `reused`. Verificar individualmente eventuais variantes ainda não contempladas pelos schemas; não criar novos tipos por mero estilo.
- **176** exemplos inicialmente pendentes foram revisados nesta rodada, com apenas dois novos contratos aprovados.
- **1** exemplo, `c-accordion-11`: `approved-semantic` / `approved`, associado a `OnboardingChecklist`.

Não confundir `ReuiAccordion11` (padrão React com dados fixos, disponível na biblioteca ReUI) com `OnboardingChecklist` (contrato de domínio com dados configuráveis e valores validados).

## Contrato aprovado: OnboardingChecklist (v1.0.0)

Proveniência visual: https://reui.io/components/accordion/c-accordion-11. Implementação: `src/ui-catalog/extensions/components/onboarding-checklist.tsx`. Contrato: `extensionDefinitions.OnboardingChecklist` em `src/ui-catalog/extensions/catalog.ts`.

O schema aceita entre 1 e 12 etapas, cada uma com `id` único, `title`, `description` e `status` (`completed`, `active`, `pending`). `defaultOpenId` é opcional e precisa apontar para uma etapa existente. No máximo uma etapa pode ter status `active`. Accordion usa texto e status do JSON, sem rede, persistência ou callbacks arbitrários.

Exemplo JSON independente, usado também como fixture do Pi: `pi-catalog/examples/OnboardingChecklist.json`. O contrato aparece no Explorador de Compostos Aprovados. Seu contrato Zod é a fonte normativa, e o exemplo não substitui o schema.

Metadados para seleção pelo agente: `src/ui-catalog/semantic-contract-guidance.json` contém **quando usar**, **quando não usar**, **notas do agente** e IDs de referências. Eles são exportados em `pi-catalog/contracts.json` (`semanticGuidance`) e disponibilizados por `npm run pi:context -- --types=OnboardingChecklist`.

## Revisão dos 176 pendentes (24/10/2026)

A matriz `src/ui-catalog/reui-semantic-admissions.json` foi revisada em **176 decisões individuais** e registra `reviewedOn`, `reviewBasis`, caso de uso extraído da orientação e justificativa do encaminhamento. Ela permanece rastreável aos 559 registros ReUI.

| Encaminhamento nesta rodada | Quantidade |
| --- | ---: |
| Variação de primitiva existente | 129 |
| Composição com contratos já existentes | 22 |
| Lacuna em contrato existente — requer evolução, não novo tipo | 15 |
| Semântica potencial dependente de política de mídia, eventos ou autorização — não admitida | 8 |
| Novo contrato semântico aprovado | 2 |
| **Total revisado** | **176** |

Os novos contratos são:

- **`RatingDistribution`** (ReUI `c-rating-6`): cinco contagens de 1 a 5 estrelas, com média ponderada, percentual e total derivados, sem aceitar percentual arbitrário no JSON. Não equivale a um `Rating` individual.
- **`CharacterCountTextarea`** (ReUI `c-textarea-6`): formulário local de texto com limite configurável, aviso de proximidade, contador dinâmico e acessibilidade. Não é substituto de uma API de submissão de formulário.

**Decisões adiadas explicitamente:** `c-rating-9` (submissão de revisão sem payload tipado e persistência autorizada); `c-carousel-9/10` (galeria de miniaturas depende de política segura de mídia e navegação acessível); `c-dropdown-menu-10/11/14/18` (workspaces, notificações, presença e modelos requerem fontes e ações autorizadas); `c-button-group-55` (retenção/liberação de pagamentos exige autorização transacional).

**Lacunas de contratos existentes:** autoplay e renderização avançada em `Carousel`, submenus/seleções avançadas em `DropdownMenu`, navegação direta e quantidade de linhas em `Pagination`. Evoluir schemas existentes sem duplicar tipos.

A revisão documental de cada exemplo não certifica automaticamente a implementação de toda variação visual; somente os contratos novos possuem API semântica própria e são submetidos a testes de schema/catálogo. Os exemplos não admitidos permanecem disponíveis como referência visual.

## Fluxo de promoção de outros exemplos

1. Selecionar exemplo `review-required` ou candidato a melhoria de contrato existente e comparar sua semântica com os tipos em `contracts.lock.json`.
2. Preferir evoluir o schema de primitiva existente para variantes sem dados ou comportamentos próprios. Um novo contrato só deve representar capacidade de domínio distinta.
3. Criar API semântica Zod estrita, implementação React ou template JSON aprovado, exemplo independente válido e orientações para o agente; `events` apenas se necessários e suportados.
4. Registrar licença/origem em `sources.json`, versão e fingerprints em `contracts.lock.json`; atualizar os manifestos Pi e as amostras.
5. Testar valores válidos e inválidos, IDs, estados, acessibilidade, teclado, temas claro/escuro e visual, sem confundir a passagem do build com homologação visual.
6. Revisar o PR e a matriz antes de alterar o status para `approved-semantic`; jamais promover em massa automaticamente.

## Verificações

`npm run test:offline`, `npm run contracts:check`, `npm run pi:api:check`, `npm run pi:fixtures:check`, `npm run validate` e `npm run build`. A suíte E2E continua manual na main, mas tem casos novos para o contrato e a UI de classificação.
