[English](revisao-compostos-v021.md) | [Português](revisao-compostos-v021.pt-BR.md)

> **Registro histórico (v0.21):** os totais desta revisão documentam a decisão de retirada daquela versão. Consulte [componentes](components.pt-BR.md) e os manifestos atuais antes de reutilizar contagens.

# Revisão dos componentes compostos — v0.21

**Critério de permanência:** o componente deve criar um modelo semântico independente, um fluxo/estado/evento reconhecível ou um padrão de layout de página reutilizável e selecionável. **Critério de retirada:** ele apenas agrupa primitives existentes num Card/Stack/Alert sem API ou comportamento próprio.

A revisão foi deliberadamente conservadora: 118 composições anteriores examinadas por arquitetura e template; 22 wrappers retirados, 96 mantidos. Os 64 cards de referência permanecem representados visualmente, embora 10 tenham deixado de ser contratos para se tornar árvores inline na respectiva galeria. Os 27 blocos são mantidos porque oferecem layouts de página separados e navegáveis. A retirada é incompatível para clientes externos que ainda gerem os nomes aposentados.

## Contratos retirados e alternativas

| Contrato | Motivo | Migração |
|---|---|---|
| `IconPreviewGrid` | Uma grade de ícones não possui API ou comportamento distinto do Grid + Icon. | inline primitives in gallery |
| `LiveWaveformCard` | Apresenta um BarGraph estático, sem áudio ao vivo ou API de waveform. | inline primitives in gallery |
| `LoadingCard` | Apenas agrupa Skeleton dentro de Card. | inline primitives in gallery |
| `QrConnect` | Apresenta Image e Button sem código QR funcional ou pareamento. | inline primitives in gallery |
| `Shortcuts` | Apresenta etiquetas de atalhos e botões sem registrar comandos ou hotkeys. | inline primitives in gallery |
| `SidebarNav` | Apenas agrupa Link/Text sem navegação gerenciada. | inline primitives in gallery |
| `SiteAnnouncement` | Badge + Text + Icon em Card sem comportamento distinto. | approved primitive combination on demand |
| `SiteCallout` | Card envolvendo Alert; Alert primitivo já representa a funcionalidade. | approved primitive combination on demand |
| `SiteCardsCalendar` | Card envolvendo apenas DatePicker. | approved primitive combination on demand |
| `SiteCardsExerciseMinutes` | Card envolvendo apenas LineGraph. | approved primitive combination on demand |
| `SiteChartToolbar` | Tabs, Buttons e LineGraph sem editor real de gráficos. | approved primitive combination on demand |
| `SiteCodeBlockCommand` | Tabs, Text e Button sem cópia de código ou alternância de shell real. | approved primitive combination on demand |
| `SiteComponentPreview` | Tabs, Alert e Button sem carregar preview/código reais. | approved primitive combination on demand |
| `SiteDirectorySearch` | Card, Input e Button sem execução de busca. | approved primitive combination on demand |
| `SiteDocsBreadcrumb` | Stack de Text/Icon sem breadcrumbs semânticos/navegação. | approved primitive combination on demand |
| `SiteDocsTableOfContents` | Text e Popover estáticos sem sincronização com documento. | approved primitive combination on demand |
| `SiteSiteHeader` | Text e Button agrupados sem navegação/estado de header. | approved primitive combination on demand |
| `SiteThemeSelector` | Select e Button sem integração com provider de tema. | approved primitive combination on demand |
| `SkeletonLoading` | Apenas reúne quatro primitivas Skeleton. | inline primitives in gallery |
| `StyleOverview` | Apenas apresenta amostras visuais de estilo usando Text/Separator/Button. | inline primitives in gallery |
| `TypographySpecimen` | Apenas exemplifica tipografia e campo de texto. | inline primitives in gallery |
| `UIElements` | Apenas demonstra controles base sem estado composto. | inline primitives in gallery |

## Exploração no menu Ferramentas

- **Primitivos shadcn**: 41 tipos base e o primitivo Field.
- **Componentes compostos**: 99 contratos (96 composições semânticas e os adaptadores DataTable, DatePicker e BlockSidebar). Propriedades de conteúdo e `nodeProps` continuam sujeitas a schemas fechados.
- **Exemplos**: escolha uma das seis telas ou oito padrões, selecione qualquer nó e ajuste suas props locais com validação Zod antes de renderizar a árvore completa.

## Integridade e limitações

Execute `npm run composites:pruning:check`, `npm run test:offline`, `npm run pi:verify` e, com npm conectado, `npm run validate && npm run build && npm run test:e2e`. O resultado da auditoria é registrado em `src/ui-catalog/composite-pruning-review.json`. Não há confirmação de correspondência visual pixel a pixel; a v0.20 já mantinha esse processo pendente.
