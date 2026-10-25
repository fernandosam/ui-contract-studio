[English](governance.md) | [Português](governance.pt-BR.md)

# Governança do repositório público

O **ui-contract-studio já é público**. As verificações desta página são responsabilidades de manutenção contínua; **não** constituem declaração de que todas as auditorias foram concluídas. Um histórico Git novo não comprova a titularidade ou autorização de divulgação do conteúdo.

## Revisão de alterações

1. Use branches e PRs com escopo claro. Mudanças em schemas, contratos e ações exigem revisão humana independente.
2. Atualize `sources.json`, `contracts.lock.json`, fingerprints, API Pi, fixtures e consumidores afetados. O valor `status: approved` é metadado, **não prova de aprovação humana**.
3. Configure proteção de `main`, checks obrigatórios e revisores **no GitHub**. O arquivo [CODEOWNERS.template](CODEOWNERS.template) é uma amostra, não prova de que políticas remotas estão ativas.
4. A job `integration` valida código e dependências, **não executa o E2E manual**; auditorias visuais têm etapas e evidências específicas.
5. Não permita que agentes alterem livremente políticas de confiança, actions, permissões ou registros de aprovação.

## Checklist de auditoria contínua

- [ ] Verificar alterações e histórico pertinente para segredos, dados pessoais, endpoints privados e arquivos binários.
- [ ] Avaliar autoria, licenças e eventual autorização institucional para cada contribuição relevante.
- [ ] Revisar dependências, imagens, fontes, exemplos, marcas e materiais de terceiros.
- [ ] Manter [LICENSE](../LICENSE), [avisos de terceiros](../THIRD_PARTY_NOTICES.md) e [SECURITY.md](../SECURITY.md) adequados.
- [ ] Executar `npm ci`, `npm run test:offline`, `npm run docs:check`, `npm run validate` e `npm run build` conforme o escopo.
- [ ] Executar E2E manual e revisão visual quando necessários, documentando resultados e bloqueios.
- [ ] Confirmar diretamente na plataforma Git a existência de proteções antes de anunciar governança efetivamente aplicada.

Relatos de segurança devem seguir [SECURITY.md](../SECURITY.md), nunca issues públicas com dados exploráveis. Confira também o [checklist de publicação](publicacao-open-source.md) e a [proteção de repositório](protecao-repositorio.md).
