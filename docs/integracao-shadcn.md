> **Atualização v0.9:** o plano de instalação foi ampliado para **37 componentes** para implementar a API pública revisada. A enumeração de 21 abaixo é histórica; veja `shadcn-plan.json` e `docs/shadcn-api-migration.md` para a configuração vigente.

# shadcn/ui: integração planejada — ui-contract-studio v0.5

**Status da distribuição:** **pronto para instalação, mas NÃO pré-instalado**. Este ZIP não contém código de componentes oficiais baixados do shadcn, pois o ambiente que gerou o pacote não possuía acesso ao npm. Os arquivos reais de `src/components/ui/` são criados **pelo CLI** em ambiente com internet. Não registre tipos no `json-render` antes de realizar a integração completa.

## Objetivo

- Conservar os **41 contratos originais** em `src/ui-catalog/catalog.ts`.
- Incorporar as primitivas oficiais do shadcn em `src/components/ui/`, separadas dos adaptadores aprovados.
- Continuar gerando todas as telas como especificações JSON, jamais JSX de tela.
- O `shadcn/ui` **não é um catálogo** de componentes disponíveis para a IA. Um arquivo físico instalado não autoriza o tipo em `json-render`.

## 21 componentes aprovados para instalação (8 fundamentos e 13 adicionais)

| Prioridade | Pacote CLI | Uso preferencial | Exposição ao catálogo |
|---|---|---|---|
| Muito alta | `sidebar` | Layout permanente | Apenas shell fixo, sem novo schema |
| Muito alta | `calendar` | Datas e períodos | Extensão futura com Zod e adapter |
| Muito alta | `combobox` | Seleções pesquisáveis | Extensão futura com Zod e adapter |
| Alta | `command` | Busca global/atalhos | Shell ou extensão com revisão |
| Alta | `breadcrumb` | Navegação | Shell fixo, sem novo schema |
| Alta | `input-group` | Input com ícones/addons | Primitiva de adaptadores |
| Média | `resizable` | Painéis divididos | Extensão futura com Zod e adapter |
| Média | `drawer` | Gaveta | Adaptar contrato `Drawer` já existente |
| Média | `collapsible` | Conteúdo expansível | Adaptar contrato `Collapsible` existente |
| Média | `toggle` | Alternância de estado | Adaptar contrato `Toggle` existente |
| Média | `toggle-group` | Escolha entre alternâncias | Adaptar contrato `ToggleGroup` existente |
| Média | `button-group` | Botões agrupados | Adaptar contrato `ButtonGroup` existente |
| Média | `carousel` | Conteúdo horizontal | Adaptar contrato `Carousel` existente |

A **lista única, auditável e executável** está em `shadcn-plan.json`.

## Instalação passo a passo (executar com internet)

```bash
npm install
npm run shadcn:list
npm run shadcn:preview
npm run shadcn:install
npm run shadcn:verify
npm run validate
npm run build
```

O script utiliza o executável local do CLI `shadcn`, com versão fixa em `package.json`, para os 21 componentes planejados. A opção de prévia passa `--dry-run`, disponível no CLI shadcn v4. O CLI resolve dependências e arquivos auxiliares necessários. O instalador **não passa `--overwrite`**, para preservar customizações locais. Ele ignora arquivos já presentes e confere os 21 arquivos após aplicar.

**Atenção:** o CLI oficial atualmente utiliza **Base UI** por padrão em projetos novos; o plano adota essa base para esta primeira incorporação. Execute `npm exec -- shadcn info` após a instalação para verificar a base efetivamente selecionada pelo CLI; não misture Base UI/Radix/React Aria sem revisão. `shadcn-plan.json` é uma preferência de arquitetura, e não um mecanismo de fixação do CLI.

### Instalação por prioridade

```bash
node scripts/install-shadcn.mjs --dry-run --group=very-high
node scripts/install-shadcn.mjs --apply --group=very-high
node scripts/install-shadcn.mjs --apply --group=high
node scripts/install-shadcn.mjs --apply --group=medium
npm run shadcn:verify
```

As prévias ajudam a identificar arquivos alterados e dependências novas. **Revisão humana é necessária** antes de aceitar alterações em produção.

## Proteção do design system

`components.json` foi ajustado para `@/components/ui`, `@/components`, `@/hooks` e `@/lib/utils`, com `src/globals.css` como fonte do tema. Durante a instalação, o script salva versões propostas de qualquer alteração produzida pelo CLI em arquivos protegidos (`globals.css`, `index.css`, `components.json`, `catalog.ts`, `registry.tsx`) e **restaura os originais**. Quando isso ocorrer, encerra com código 2 e exige revisão manual do conteúdo salvo em `docs/shadcn-cli-review/` (por exemplo, imports de animação, tokens adicionais ou ajustes necessários). Não use a instalação como validada até reconciliar as mudanças e executar build.

O tema atual OKLCH, as fontes **Inter**, **Playfair Display** e **JetBrains Mono**, sombras e seleção de tema **não são substituídos**.

## Admissão de componente `json-render`

Ao precisar de componente gerável pela IA ainda não disponível no catálogo:

1. Verifique a composição com os 41 tipos existentes.
2. Confirme o arquivo correspondente do shadcn em `src/components/ui/` (ou instale via script revisado).
3. Implemente wrapper React em `src/ui-catalog/extensions/components/<nome>.tsx`, consumindo `@/components/ui/*`.
4. Defina schema Zod estrito em `src/ui-catalog/extensions/catalog.ts`.
5. Associe adapter no `src/ui-catalog/extensions/registry.tsx`.
6. Registre **nome, origem, licença, data e aprovação** no `src/ui-catalog/sources.json`.
7. Acrescente testes de contrato, interações, acessibilidade e validações; execute `npm run validate` e `npm run build`.
8. Apenas após aprovação utilize o novo tipo em `src/ui-screens/*.json`.

**Quando o contrato já existir (`Drawer`, `Toggle`, etc.), substitua somente o adapter visual:** não crie duplicatas, não renomeie props já consumidas, não quebre as specs existentes.

## Recursos oficiais

- https://ui.shadcn.com/docs/cli
- https://ui.shadcn.com/docs/installation/vite
- https://ui.shadcn.com/docs/components-json
- https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default
