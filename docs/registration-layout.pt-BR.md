[English](registration-layout.md) | [Português](registration-layout.pt-BR.md)

# Contrato semântico do layout: cadastro

O assistente de cadastro utiliza `src/ui-requirements/registration-layout.json` como **orientação versionada de composição**, sem criar novo tipo Pi, propriedade Zod ou permissão. A função determinística em `registration-layout.ts` transforma campos já definidos em um plano visual rastreável.

## Regras de composição

- **Finalidade:** melhorar a disposição dos campos na prévia local sem inferir capacidades de backend.
- **Contêiner:** `Card` aprovado, centralizado, com largura `md`; título e descrição antes dos campos.
- **Agrupamento:** identificação (nome/documento/empresa), contato (e-mail/telefone/cidade), acesso (senha), outros campos. Grupos vazios são omitidos. Cada campo aparece exatamente uma vez, preservando seu rótulo, tipo, obrigatoriedade e regras de validação.
- **Responsividade:** no celular, uma única coluna em ordem de leitura; com a escolha explícita `two-columns`, grupos com pelo menos dois campos usam o `Grid` existente com duas colunas em telas maiores. A escolha `single` mantém `Stack`. Não há nova propriedade Pi.
- **Hierarquia:** títulos com `Heading` h3 e agrupamento com `Stack`. Confirmação demonstrativa por `AlertDialog` ou aviso local somente após os campos. Nenhuma operação de gravação é inferida.
- **Limites:** persistência remota, validações de negócio não admitidas, callbacks arbitrários e URLs continuam bloqueados. O `DeclarativeFormFlow` funcional mantém seu schema local já admitido; o perfil não adiciona automaticamente grupos ou props a esse contrato.
- **Evidência:** geração determinística e checagens independentes com `traceRegistration` e `verifyInterface`. Testes E2E e verificação de acessibilidade reais permanecem pendentes, não são certificados por este perfil.

## Validar

O `RequirementsWizard` mostra o plano semântico e a prévia Pi. Alterações no perfil e na função de layout são reconhecidas na análise de impacto já existente. Execute:

```sh
npm run semantic:check
npm run semantic:report
npm run test:offline
npx tsx --test tests/registration-layout.integration.test.ts tests/ui-requirements.integration.test.ts tests/requirements-traceability.integration.test.ts
npm run build
```

O CI atual executa os testes integrados e o build. **O E2E completo permanece para a etapa posterior**, sem se tornar requisito adicional de auto-merge nesta entrega.
