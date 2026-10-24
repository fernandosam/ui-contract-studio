# Checklist de publicação — UI Contract Studio

A criação de um novo repositório e a ausência de histórico Git anterior **não comprovam autorização de divulgação**. Mantenha o repositório novo **privado** até concluir:

- [ ] Auditoria de credenciais e dados pessoais em todo o snapshot (arquivos texto e binários).
- [ ] Revisão de titularidade do código e eventual autorização institucional necessária.
- [ ] Verificação de licenças de componentes, exemplos, imagens, ícones e outros recursos de terceiros.
- [ ] Revisão de LICENSE, THIRD_PARTY_NOTICES.md e SECURITY.md.
- [ ] Verificação de npm ci, npm run test:offline, npm run validate e npm run build.
- [ ] Testes E2E manuais e CI do novo repositório, respeitando a configuração de runners.
- [ ] Revisão dos arquivos e metadados antes de tornar a visibilidade pública.

Este snapshot conserva somente arquivos versionados da aplicação e inicia com uma nova pasta ".git", sem commits antigos. Não transfira issues, pull requests, tags, logs, artefatos ou secrets do projeto anterior.
