[English](agents.md) | [Português](agents.pt-BR.md)

# Integração com agentes e Pi

O Pi pode gerar **apenas specs JSON** com tipos e propriedades publicados no catálogo json-render/Zod. Exemplos visuais ReUI e arquivos shadcn/ui não concedem APIs ao agente.

## Gerar uma spec

1. Consulte `pi-catalog/contracts.json`, `pi-catalog/retired-contracts.json` e os padrões JSON de `src/ui-patterns/`.
2. Gere os schemas reais e selecione **somente os tipos necessários** (até 25 por lote):

   ~~~bash
   npm run pi:select -- --requirement="ação explícita com botão" --types=Button,Card
   npm run pi:zod-schema
   npm run pi:context -- --types=Card,Button --requirement="ação explícita com botão" --stdout
   ~~~

3. Use `propsSchema`, exemplos, eventos e ações autorizados. `semanticName` é um rótulo auxiliar; as chaves válidas são as definidas no Zod. `--metadata-only` não serve para geração.
4. Grave a tela em `src/ui-screens/<slug>.json` e os metadados em `src/ui-screen-meta/<slug>.json`.
5. Valide e corrija os problemas identificados em `issues[].pointer`:

   ~~~bash
   npm run pi:validate -- --file=src/ui-screens/<slug>.json
   npm run pi:verify
   ~~~

## Limites de ações e dados

- `content` e `nodeProps` aceitam somente campos publicados; não modificam `type`, `children`, `name`, `on`, `href`, `src`, `sourceId` ou ações.
- Dados e eventos demonstrativos permanecem locais. Um `sourceId` de DataTable só pode referir fontes autorizadas; servidores reais devem realizar autenticação, autorização e filtros de acesso.
- Novos tipos exigem [admissão](components.pt-BR.md) e aprovação humana independente. O Pi não atualiza sozinho permissões do catálogo.

## Avaliações reais

A execução paga de modelos é **manual** e requer `PI_EVAL_CONFIRM=yes`. Reparo pago exige também `PI_EVAL_REPAIR_CONFIRM=yes`. Relate execuções, falhas, bloqueios e ausências sem fabricar saídas, métricas ou evidências.

Revisão de segurança: o [modelo de ameaças do Pi Agent (E09)](pi-agent-threat-model.pt-BR.md) separa o risco das ferramentas do agente de desenvolvimento da renderização JSON validada e das avaliações pagas sem ferramentas.

As regras normativas estão em [AGENTS.md](../AGENTS.pt-BR.md); o procedimento está na [skill UI Catalog](../.pi/skills/ui-catalog/SKILL.pt-BR.md). Veja o [fluxo resumido](pi-workflow.pt-BR.md).
