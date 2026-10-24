# Changelog — UI Contract Studio

## Documentação e consistência — 0.24.0

- Guias vigentes reorganizados por finalidade: arquitetura, componentes, agentes, desenvolvimento e governança; auditorias anteriores identificadas como históricas.
- README, AGENTS.md, skill UI Catalog e CONTRIBUTING.md consolidados, removendo regras repetidas e referências a planos já substituídos.
- Status público, inventários independentes (Pi, shadcn/ui e ReUI) e execução manual do E2E descritos conforme os manifestos e workflows atuais.
- Novo `npm run docs:check` valida links relativos e consistência entre contratos, planos e fontes, integrado ao teste offline e CI.


## Ajustes de navegação e catálogo — 0.24.0

- Removidas Galeria 1 e Galeria 2 com 54 contratos exclusivos e seus exemplos/fixtures de composição.
- Galeria 3 renomeada para **ReUI** e definida como página inicial.
- Removida a página Dashboard; preservados `Dashboard01` e os demais componentes compostos do bloco.
- Atualizados registries, orientações para agentes, verificações e manifestos ativos (102 contratos).

## Initial independent snapshot — 0.24.0

- Baseline of the declarative React / json-render / shadcn-ui component studio.
- Component schemas, approved UI contracts, agent fixtures and automated checks.
- This repository begins with an independent Git history. Third-party authorship and licensing remain attributed in THIRD_PARTY_NOTICES.md.
