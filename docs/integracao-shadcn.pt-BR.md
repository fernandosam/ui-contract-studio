[English](integracao-shadcn.md) | [Português](integracao-shadcn.pt-BR.md)

# Integração shadcn/ui (Base UI) — procedimento vigente

O UI Contract Studio mantém **código-fonte local** de componentes shadcn/ui em `src/components/ui/`. O plano de instalação e as versões estão em `shadcn-plan.json` e `package.json`; **não utilize contagens de planos antigos** como referência. No snapshot 0.24.0, o plano registra 50 primitivas e `integration-status.json` informa fontes presentes, mas **build não verificado** por esse inventário.

## Princípios

- O shadcn/ui oferece implementações React; **não** autoriza automaticamente contratos em json-render.
- A API permitida ao Pi é definida pelos schemas Zod e pelo manifesto `pi-catalog/contracts.json`.
- Não introduza implementações externas, mudanças no tema ou dependências sem auditoria de origem, licença, acessibilidade e efeitos.
- A base escolhida é **Base UI**, com estilo registrado em `components.json`. Não misture outras bases silenciosamente.

## Inspeção e instalação

~~~bash
npm ci
npm run shadcn:list
npm run shadcn:status
npm run shadcn:verify
~~~

Se for necessário **adicionar ou atualizar** fontes oficiais, inspecione antes a prévia e execute o instalador somente em branch dedicada e ambiente com rede disponível:

~~~bash
npm run shadcn:preview
npm run shadcn:install
npm run shadcn:verify
npm run validate
npm run build
~~~

O script de instalação não deve sobrescrever customizações arbitrariamente. Qualquer proposta de alteração de `globals.css`, `index.css`, `components.json` ou arquivos protegidos requer reconciliação e revisão manual. Componentes instalados não devem ser anunciados como compilados ou homologados apenas pelo inventário.

## Admissão e testes

Para disponibilizar uma primitiva ao Pi, siga [componentes e admissão](components.pt-BR.md): schema Zod estrito, renderer/adapter, proveniência, lock/versionamento, fixtures, testes e revisão independente. Execute a verificação estrutural e revisão em navegador quando disponível. A [auditoria oficial](official-component-visual-audit.pt-BR.md) separa captura de referência de aprovação visual.

**Histórico:** os planos anteriores de 21, 37 e 38 componentes eram snapshots de fases anteriores; o arquivo `shadcn-plan.json` é a referência atual, não esta documentação.
