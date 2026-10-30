[English](e12-test-matrix.md) | [Português](e12-test-matrix.pt-BR.md)

# E12 — Testes automatizados de contrato, compatibilidade, segurança e integração

A suíte cobre o **SDK TypeScript local** e o **gateway opcional de host confiável** do PR #197. Não cria API HTTP, pacote npm público, provedor de identidade nem execução de ações Pi.

| Verificação | Arquivos | Cobertura |
| --- | --- | --- |
| Contrato e compatibilidade | `tests/e12-contract-compatibility.integration.test.ts` | Canais stable/experimental; metadados iguais ao lock revisado e projeção Pi; SemVer, fingerprint, pins históricos, determinismo e rejeição segura |
| Segurança adversarial | `tests/sdk-access-control.test.mjs`, `tests/e12-gateway-security.test.mjs` | Identidade e escopos do host, quotas, isolamento por tenant, concorrência, limites, poluição de protótipo, getters e sanitização |
| Ponta a ponta no processo | `tests/e12-gateway.integration.test.ts` | Identidade confiável -> gateway -> SDK real -> listar/inspecionar/gerar/validar JSON, incluindo negações e entradas inválidas |
| Regressão preexistente | `tests/contract-sdk.integration.test.ts` e testes E07 | Zod, invariantes do grafo, versionamento e migrações |
| Qualidade | `semantic:check`, `semantic:report`, `validate`, `build` | Auditoria semântica, demais verificações e build |

## Execução

```sh
npm ci
npm run test:e12
npm run test:offline
npm run semantic:check
npm run semantic:report
npm run validate
npm run build
```

O workflow de qualidade executa a E12 explicitamente no job com dependências instaladas. A descoberta habitual de `test:offline` e `tests/*.integration.test.ts` também inclui esses arquivos; regressões bloqueiam o job. Não são necessários credenciais, rede externa ou temporizadores não determinísticos.

## Limites

- **Ponta a ponta significa integração no mesmo processo**, não endpoint HTTP, autenticação OIDC real, quotas distribuídas, empacotamento para consumidores externos nem certificação visual.
- O gateway só protege solicitações não confiáveis quando o host encaminha **todas** as operações por ele. Proxy, TLS, CSRF, timeouts e quotas distribuídas pertencem ao host.
- A E12 não admite contratos, altera Zod, amplia permissões Pi ou promove candidatos do Admission Engine. SemVer/fingerprint e auditoria semântica continuam independentes e obrigatórios.
- E2E completo de navegador e certificação visual permanecem manuais na `main`; não são considerados aprovados por esta suíte.
