[English](publicacao-open-source.md) | [Português](publicacao-open-source.pt-BR.md)

# Auditoria contínua de publicação — UI Contract Studio

**Estado atual:** o repositório `fernandosam/ui-contract-studio` **já é público**. Esta página deixou de ser uma checklist para "tornar público" e passou a acompanhar a segurança e a conformidade **após** a publicação.

Um histórico Git independente não elimina obrigações de confidencialidade, direitos autorais e licenciamento. Não assuma que qualquer verificação abaixo foi concluída apenas porque o repositório está visível.

- [ ] Analisar segredos, dados pessoais, endpoints internos e arquivos binários introduzidos em mudanças futuras.
- [ ] Verificar titularidade e eventual autorização para código e materiais incorporados.
- [ ] Conferir licenças e atribuições de componentes, imagens, exemplos, fontes e marcas de terceiros.
- [ ] Manter `LICENSE`, `THIRD_PARTY_NOTICES.md` e `SECURITY.md` revisados.
- [ ] Executar `npm ci`, `npm run test:offline`, `npm run docs:check`, `npm run validate` e `npm run build` no contexto adequado.
- [ ] Avaliar a necessidade de E2E manual e de screenshots para cada mudança visual significativa.
- [ ] Confirmar no GitHub regras de proteção e revisão de PR antes de afirmar que estão ativas.

Não importe histórico, credenciais, logs ou artefatos confidenciais de outro projeto. Consulte a política geral em [governança](governance.md) e o canal de relato em [SECURITY.md](../SECURITY.md).
