[English](shadcn-upstream-coverage.md) | [Português](shadcn-upstream-coverage.pt-BR.md)

> **Levantamento pontual em 23/10/2026:** a situação de PRs, fontes locais e componentes reflete a data do relatório. Para a versão atual, consulte [componentes](components.pt-BR.md), [integração shadcn](integracao-shadcn.pt-BR.md) e os manifestos do repositório.

# Cobertura oficial shadcn/ui — 23/10/2026

Referência: https://ui.shadcn.com/docs/components.md — 66 itens oficiais.
Arquivos locais nesta proposta: 53. Lacunas de arquivo: 13.

A fonte local não implica contrato no json-render. Doze componentes recebem fonte oficial, schema Zod estrito, adapter, amostra, registro de origem e entrada no Explorador. A revisão independente e as validações permanecem pendentes.

| Nome | Fonte local | Situação |
|---|---|---|
| Accordion | Sim | Fonte já presente; conferir contrato |
| Alert | Sim | Fonte já presente; conferir contrato |
| Alert Dialog | Sim | Fonte Base UI oficial adaptada e contrato em revisão no PR #46 |
| Aspect Ratio | Sim | Proposto nesta branch |
| Attachment | Sim | Fonte Base UI oficial adaptada e contrato em revisão no PR #46 |
| Avatar | Sim | Fonte já presente; conferir contrato |
| Badge | Sim | Fonte já presente; conferir contrato |
| Breadcrumb | Sim | Fonte já presente; conferir contrato |
| Bubble | Sim | Fonte Base UI oficial adaptada e contrato em revisão no PR #46 |
| Button | Sim | Fonte já presente; conferir contrato |
| Button Group | Sim | Fonte já presente; conferir contrato |
| Calendar | Sim | Fonte já presente; conferir contrato |
| Card | Sim | Fonte já presente; conferir contrato |
| Carousel | Sim | Fonte já presente; conferir contrato |
| Chart | Não | Pendente de admissão/instalação |
| Checkbox | Sim | Fonte já presente; conferir contrato |
| Code Block | Não | Pendente de admissão/instalação |
| Collapsible | Sim | Fonte já presente; conferir contrato |
| Combobox | Sim | Fonte já presente; conferir contrato |
| Command | Sim | Fonte já presente; conferir contrato |
| Context Menu | Sim | Fonte Base UI oficial adaptada e contrato em revisão no PR #46 |
| Data Table | Não | Composição existente DataTable |
| Date Picker | Não | Composição existente DatePicker |
| Dialog | Sim | Fonte já presente; conferir contrato |
| Direction | Não | Pendente de admissão/instalação |
| Drawer | Sim | Fonte já presente; conferir contrato |
| Dropdown Menu | Sim | Fonte já presente; conferir contrato |
| Empty | Sim | Proposto nesta branch |
| Field | Sim | Fonte já presente; conferir contrato |
| Hover Card | Sim | Fonte Base UI oficial adaptada e contrato em revisão no PR #46 |
| Input | Sim | Fonte já presente; conferir contrato |
| Input Group | Sim | Fonte já presente; conferir contrato |
| Input OTP | Não | Pendente de admissão/instalação |
| Item | Sim | Fonte Base UI oficial adaptada e contrato em revisão no PR #46 |
| Kbd | Sim | Proposto nesta branch |
| Label | Sim | Fonte já presente; conferir contrato |
| Marker | Sim | Fonte Base UI oficial adaptada e contrato em revisão no PR #46 |
| Menubar | Não | Pendente de admissão/instalação |
| Message | Sim | Fonte Base UI oficial adaptada e contrato em revisão no PR #46 |
| Message Scroller | Não | Pendente de admissão/instalação |
| Native Select | Sim | Fonte já presente; conferir contrato |
| Navigation Menu | Não | Pendente de admissão/instalação |
| Pagination | Sim | Fonte já presente; conferir contrato |
| Popover | Sim | Fonte já presente; conferir contrato |
| Progress | Sim | Fonte já presente; conferir contrato |
| Questionnaire | Não | Pendente de admissão/instalação |
| Radio Group | Sim | Fonte já presente; conferir contrato |
| Resizable | Sim | Fonte já presente; conferir contrato |
| Scroll Area | Sim | Proposto nesta branch |
| Select | Sim | Fonte já presente; conferir contrato |
| Separator | Sim | Fonte já presente; conferir contrato |
| Sheet | Sim | Fonte já presente; conferir contrato |
| Sidebar | Sim | Fonte já presente; conferir contrato |
| Skeleton | Sim | Fonte já presente; conferir contrato |
| Slider | Sim | Fonte já presente; conferir contrato |
| Spinner | Sim | Fonte já presente; conferir contrato |
| Switch | Sim | Fonte já presente; conferir contrato |
| Table | Sim | Fonte já presente; conferir contrato |
| Tabs | Sim | Fonte já presente; conferir contrato |
| Textarea | Sim | Fonte já presente; conferir contrato |
| Toast | Não | Pendente de admissão/instalação |
| Toggle | Sim | Fonte já presente; conferir contrato |
| Toggle Group | Sim | Fonte já presente; conferir contrato |
| Tooltip | Sim | Fonte já presente; conferir contrato |
| Trace | Não | Pendente de admissão/instalação |
| Typography | Não | Documentação Typeset, não componente instalável por padrão |

Não marcar outros nomes como implementados apenas para inflar cobertura. Para cada ausência: inspecionar docs oficiais, classificar receita vs primitiva, usar CLI quando aplicável, criar schema/adapter/fixture/lock/testes e revisão independente.


## Catálogo JSON / Explorador

- O explorador de primitivas inclui 41 contratos de base e 13 extensões de natureza primitiva: Field, AspectRatio, Kbd, Empty, ScrollArea, AlertDialog, Attachment, Bubble, ContextMenu, HoverCard, Item, Marker e Message (54 tipos).
- Existem 53 arquivos em `src/components/ui`, mas o catálogo fechado não registra automaticamente todas as fontes locais.
- Componentes oficiais cuja fonte local existe, porém ainda não possuem contrato primitivo isolado no Explorador: Breadcrumb, Calendar, Combobox, Command, InputGroup, Label, NativeSelect, RadioGroup, Resizable, Sheet e Sidebar. Precisam ser admitidos caso a API de base não cubra o uso.
- DataTable e DatePicker já são composições aprovadas; Typography é uma orientação de tipografia, não deve ser tratada como contrato novo sem necessidade.
- As doze primitivas adicionadas nesta auditoria possuem notas de orientação, limites de uso e documentação oficial em `src/ui-catalog/shadcn-guidance.json`.

## Componentes pendentes de implementação

Permanece sem arquivo de origem local a lista: Chart, Code Block, Direction, Input OTP, Menubar, Message Scroller, Navigation Menu, Questionnaire, Toast (Sonner), Trace e os itens Data Table, Date Picker e Typography. Os três últimos não devem gerar arquivos vazios: DataTable e DatePicker já possuem composições, enquanto Typography é uma orientação de tipografia.

Para os demais, avaliar as dependências e os padrões oficiais Base UI antes da admissão. Por exemplo: Chart depende de Recharts; Input OTP do pacote input-otp; Message Scroller e Questionnaire de pacotes @shadcn/react. Toast pode reutilizar Sonner já integrado, sem duplicação de contrato.

### Regras de integração aplicadas

Os oito componentes desta etapa foram baseados no arquivo TSX oficial de `shadcn-ui/ui/apps/v4/registry/bases/base/ui/` e possuem schema Zod estrito, adapter React e exemplo JSON. Eventos de confirmação/seleção não podem executar ações externas sem handler autorizado. Status de anexo é apenas representacional. Este inventário não declara homologação visual: CI, acessibilidade e revisão independente continuam exigidos.
