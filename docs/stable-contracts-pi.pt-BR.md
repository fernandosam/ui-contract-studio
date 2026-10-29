[English](stable-contracts-pi.md) | [Português](stable-contracts-pi.pt-BR.md)

# Contratos estáveis e disponibilização automática ao Pi

O arquivo revisado `src/ui-catalog/contracts.lock.json` é a fonte de verdade para `version`, `semanticFingerprint` e `stability` (`experimental`, `beta`, `stable` ou `deprecated`) de cada contrato base ou extensão. Para ser `stable`, o contrato também precisa ter `status: approved`.

O script `scripts/build-pi-api.mjs` projeta os metadados para `pi-catalog/contracts.json`, que é um arquivo **gerado**, não um segundo registro de aprovação. `scripts/select-pi-context.mjs` bloqueia divergências entre o contrato revisado e a projeção. Contratos `stable` passam a ficar disponíveis no canal padrão do Pi sem uma aprovação adicional. Contratos `experimental` e `beta` não são oferecidos por padrão.

As composições candidatas preservam os digests, protocolos, verificações de CI e o canal experimental existentes. Uma evidência exigida em CI **não autoriza** ações remotas. A disponibilidade ao Pi limita-se à geração de interfaces JSON declarativas e validadas; permissões de ações permanecem inalteradas.

Mudanças de contrato exigem o PR habitual, [classificação de compatibilidade e SemVer por contrato](contract-versioning.pt-BR.md), projeção regenerada e verificações existentes. Execute:

```sh
npm run contracts:check
npm run pi:api:check
npm run admission:check
npm run test:offline
npm run semantic:check
npm run semantic:report
```

A suíte de regressão inclui `tests/stable-pi-contracts.test.mjs`. Uma verificação estática aprovada não substitui evidência de navegador independente para composições experimentais.

Para regenerar a projeção revisada: `npm run pi:api`. Nunca edite os metadados gerados do Pi para substituir a atualização e revisão do contrato de origem.
