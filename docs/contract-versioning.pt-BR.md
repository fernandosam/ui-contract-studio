[English](contract-versioning.md) | [Português](contract-versioning.pt-BR.md)

# E07 — Versionamento e compatibilidade de contratos

## Autoridade e escopo

**SemVer é individual por contrato Pi**, não corresponde à versão de package.json nem ao schemaVersion do manifesto. A fonte revisada é src/ui-catalog/contracts.lock.json (version, semanticFingerprint, stability, status e tier). O fingerprint deriva das definições em src/ui-catalog/catalog.ts e src/ui-catalog/extensions/catalog.ts. O pi-catalog/contracts.json é apenas uma projeção gerada. Conhecimento semântico não concede APIs ou permissões.

## Regras

| Impacto | Incremento mínimo | Exemplos |
| --- | --- | --- |
| **Nenhum** | Sem incremento | Apenas espaços/comentários; sem mudança de fingerprint/canal |
| **PATCH** | 1.2.3 → 1.2.4 | Apenas texto literal da description do contrato; mesma API e comportamento |
| **MINOR** | 1.2.3 → 1.3.0 | Adição comprovada de props opcionais; promoção revisada de beta/experimental para stable |
| **MAJOR** | 1.2.3 → 2.0.0 | Prop removida, renomeada ou nova obrigatória; tipo/enum/intervalo mais restrito; eventos, slots, nulabilidade, comportamento público alterados; retirada do canal stable; impacto desconhecido |

É permitido incrementar **acima**, nunca **abaixo** do mínimo. Aceitam-se apenas versões numéricas MAJOR.MINOR.PATCH, sem zeros à esquerda ou sufixos, inclusive na linha 0.x. O fingerprint não é uma versão e sua alteração isolada não comprova compatibilidade. Mudança pública sem versão é bloqueada; versão sem mudança pública também.

### Classificação automática conservadora

No PR, npm run contracts:diff compara o **lock e as definições de contratos** com o commit base (CONTRACT_BASE_REF), sem executar o código. Só considera comprovadamente compatível: (1) alteração da description literal de nível superior (PATCH) e (2) adição exclusiva de props terminadas em .optional(), sem outras diferenças no contrato (MINOR). Mudanças de eventos, slots, restrições, tipos, ordem estrutural e qualquer modificação que não possa ser comprovada como compatível exigem MAJOR. Isso não afirma que toda mudança desconhecida seja incompatível: apenas adota o mínimo seguro quando não há prova automatizada.

Saída de stability: stable ou revogação de status: approved é MAJOR porque retira disponibilidade no canal padrão do Pi. Entrada em stable requer ao menos MINOR, aprovação e as garantias de admissão existentes. Aposentadoria não permite remoção silenciosa; exclusão e troca de tier continuam proibidas. Novos tipos de extensão seguem admissão existente; nenhuma aprovação é inferida da documentação.

**Limite:** o classificador verifica definições e lock. Não comprova compatibilidade de adapters React, helpers externos, runtime, novas capacidades ou políticas de segurança. Mudanças desse tipo exigem revisão independente, testes proporcionais e atualização versionada das definições quando o comportamento público muda. status: approved em arquivo não comprova revisão humana.

## Procedimento no PR

1. Avalie consumidores: telas JSON, padrões, fixtures, adapters, eventos e Pi. Migre os afetados.
2. Atualize o schema Zod, o versionamento e o fingerprint revisado no lock; sincronize sources.json e regenere o catálogo com npm run pi:api.
3. Execute npm run contracts:check, npm run pi:api:check, npm run test:offline, npm run semantic:check, npm run validate e npm run build conforme o ambiente. O CI executa contracts:diff contra a base do PR.
4. Registre no PR o impacto, justificativa, migração e testes; mantenha revisão normal de contratos/segurança. Não há nova camada de aprovação nem bypass das proteções da main.

A análise SemVer é independente da certificação E2E, auditoria visual e autorização de novas ações.
