import { z } from "zod";
import { compositeNodePropsSchemas } from "./composites/generated-node-props";

// Each contract is a serializable, strict public API. No arbitrary JSX, callbacks,
// html or user-controlled className can cross the json-render boundary.
const strict = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const extensionDefinitions = {
  AlertDialog: {
    props: strict({ trigger:z.string().min(1).max(100), title:z.string().min(1).max(140), description:z.string().min(1).max(600), cancelLabel:z.string().min(1).max(40).optional(), confirmLabel:z.string().min(1).max(40).optional(), size:z.enum(["default","sm"]).optional(), confirmVariant:z.enum(["default","destructive"]).optional() }),
    events: ["confirm"],
    description: "Confirmação modal com rótulos estritos, apenas sinaliza confirmação ao agente.",
  },
  Attachment: {
    props: strict({ fileName:z.string().min(1).max(180), details:z.string().max(180).nullable(), state:z.enum(["idle","uploading","processing","error","done"]).optional(), size:z.enum(["default","sm","xs"]).optional(), orientation:z.enum(["horizontal","vertical"]).optional() }),
    description: "Anexo somente visual e estado; não realiza upload ou acesso a arquivos.",
  },
  Bubble: {
    props: strict({ text:z.string().min(1).max(2000), variant:z.enum(["default","secondary","muted","tinted","outline","ghost","destructive"]).optional(), align:z.enum(["start","end"]).optional() }),
    description: "Balão de mensagem com alinhamento e variantes seguras; conteúdo textual.",
  },
  ContextMenu: {
    props: strict({ trigger:z.string().min(1).max(120), items:z.array(strict({label:z.string().min(1).max(90),disabled:z.boolean().optional()})).min(1).max(12) }),
    events: ["select"],
    description: "Menu contextual com seleção demonstrativa; nenhuma ação destrutiva implícita.",
  },
  HoverCard: {
    props: strict({ trigger:z.string().min(1).max(100), title:z.string().min(1).max(120), description:z.string().min(1).max(500), side:z.enum(["top","bottom","left","right"]).optional() }),
    description: "Prévia contextual apenas textual; sem URLs e sem HTML arbitrário.",
  },
  Item: {
    props: strict({ title:z.string().min(1).max(140), description:z.string().max(360).nullable(), variant:z.enum(["default","outline","muted"]).optional(), size:z.enum(["default","sm","xs"]).optional() }),
    description: "Item informativo com tamanho e variante oficiais controlados.",
  },
  Marker: {
    props: strict({ text:z.string().min(1).max(240), variant:z.enum(["default","separator","border"]).optional() }),
    description: "Marcador de status com texto e aparência controlados.",
  },
  Message: {
    props: strict({ author:z.string().min(1).max(80), text:z.string().min(1).max(2500), align:z.enum(["start","end"]).optional() }),
    description: "Mensagem estruturada com autor e texto, sem actions ou HTML livres.",
  },
  AspectRatio: {
    props: strict({ ratio: z.number().min(0.25).max(4) }),
    slots: ["default"],
    description: "Proporção controlada de 1:4 a 4:1; somente conteúdo JSON do catálogo.",
  },
  Kbd: {
    props: strict({ keys: z.array(z.string().min(1).max(24)).min(1).max(5) }),
    description: "Atalhos com até cinco teclas serializáveis; não aceita HTML nem JSX.",
  },
  Empty: {
    props: strict({ title: z.string().min(1).max(120), description: z.string().nullable() }),
    slots: ["default"],
    description: "Estado vazio com título, descrição e slot declarativo opcional.",
  },
  ScrollArea: {
    props: strict({ height: z.enum(["sm", "md", "lg"]).optional() }),
    slots: ["default"],
    description: "Região rolável com altura controlada e filhos restritos ao catálogo.",
  },
  DataTable: {
    props: strict({
      caption: z.string().nullable(),
      columns: z.array(strict({ key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/), label: z.string(), sortable: z.boolean(), type: z.enum(["text","number","date","status"]).optional() })).min(1).max(16),
      rows: z.array(strict({ id: z.string().min(1), values: z.record(z.string(), z.string()) })).max(2000),
      pageSize: z.number().int().min(5).max(100).nullable(),
      searchable: z.boolean().nullable(),
      selectable: z.boolean().nullable(),
      sourceId: z.enum(["demo-processos","processos-api"]).nullable().optional(),
      selectedIds: z.array(z.string()).nullable().optional(),
    }),
    events: ["selectionChange", "pageChange", "sortChange"],
    description: "Tabela avançada acessível: pesquisa, ordenação, paginação e seleção opcionais. Fontes autorizadas por ID; demo-processos simula paginação remota; processos-api depende de backend autenticado com endpoint fixo.",
  },
  DatePicker: {
    props: strict({
      label: z.string().min(1),
      name: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/),
      value: isoDate.nullable(),
      placeholder: z.string().nullable(),
      minDate: isoDate.nullable(),
      maxDate: isoDate.nullable(),
      disabled: z.boolean().nullable(),
      required: z.boolean().nullable(),
    }),
    events: ["change"],
    description: "Seletor de data local (YYYY-MM-DD), composto com Calendar e Popover shadcn/ui Base UI, com limites opcionais e estado vinculado via $bindState.",
  },
  Field: {
    props: strict({
      label: z.string().min(1),
      description: z.string().nullable(),
      orientation: z.enum(["vertical", "horizontal", "responsive"]).optional(),
      invalid: z.boolean().optional(),
    }),
    slots: ["default"],
    description: "Composição JSON segura do shadcn/ui Field (Base UI), com FieldTitle, FieldDescription e slot default. Sem JSX arbitrário; use para agrupar controles existentes.",
  },
  BlockSidebar: {
    props: strict({
      heading: z.string().min(1).max(100),
      sections: z.array(strict({label:z.string().min(1),items:z.array(z.string().min(1)).min(1).max(16)})).min(1).max(8),
      active: z.string().max(100).optional(),
      variant: z.enum(["sidebar","floating","inset"]).optional(),
      collapsible: z.enum(["offcanvas","icon","none"]).optional(),
      footer: z.string().max(160).optional(),
      rightPanel: z.boolean().optional(),
    }),
    description: "Composição shadcn SidebarProvider/Sidebar/SidebarInset com grupos JSON autorizados. Sem JSX, href remoto ou callbacks.",
  },
  RatingDistribution: {
    props: strict({
      title: z.string().min(1).max(100).optional(),
      counts: z.array(z.number().int().min(0).max(1000000)).length(5)
        .refine(counts => counts.some(count => count > 0), { message: "Pelo menos uma avaliação é necessária." }),
    }),
    description: "Distribuição semântica de avaliações de 1 a 5 estrelas. counts[0..4] são contagens por quantidade de estrelas; média, total e percentuais são calculados localmente, sem dados externos.",
  },
  CharacterCountTextarea: {
    props: strict({
      label: z.string().min(1).max(100),
      name: z.string().min(1).max(64).regex(/^[A-Za-z][A-Za-z0-9_-]*$/),
      maxLength: z.number().int().min(20).max(5000),
      initialValue: z.string().max(5000).optional(),
      warningThreshold: z.number().int().min(1).max(200).optional(),
      placeholder: z.string().max(200).optional(),
      rows: z.number().int().min(2).max(10).optional(),
      disabled: z.boolean().optional(),
    }).superRefine((props, context) => {
      if ((props.initialValue?.length ?? 0) > props.maxLength) context.addIssue({
        code: "custom", path: ["initialValue"], message: "Texto inicial excede o limite permitido.",
      })
      if (props.warningThreshold && props.warningThreshold > props.maxLength) context.addIssue({
        code: "custom", path: ["warningThreshold"], message: "Limiar de alerta deve ser menor ou igual ao limite.",
      })
    }),
    description: "Textarea local com contador acessível, limite efetivo e indicação de proximidade do limite. Não realiza envio ou persistência.",
  },
  OnboardingChecklist: {
    props: strict({
      steps: z.array(strict({
        id: z.string().min(1).max(40).regex(/^[a-zA-Z0-9_-]+$/),
        title: z.string().min(1).max(120),
        description: z.string().min(1).max(500),
        status: z.enum(["completed","active","pending"]),
      })).min(1).max(12),
      defaultOpenId: z.string().min(1).max(40).optional(),
    }).superRefine((props,context)=>{
      const ids=new Set(props.steps.map(step=>step.id));
      if(ids.size!==props.steps.length)context.addIssue({code:"custom",path:["steps"],message:"Identificadores das etapas devem ser únicos."});
      if(props.defaultOpenId && !ids.has(props.defaultOpenId))context.addIssue({code:"custom",path:["defaultOpenId"],message:"Etapa inicial deve existir em steps."});
      if(props.steps.filter(step=>step.status==="active").length>1)context.addIssue({code:"custom",path:["steps"],message:"Uma única etapa pode estar em andamento."});
    }),
    description: "Etapas de onboarding e configuração com estado semântico completed/active/pending e detalhes expansíveis. Contrato inspirado no padrão ReUI c-accordion-11; não executa ações externas.",
  },
  Dashboard01: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Dashboard01.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b003.label": z.string().max(240).optional(), "b004.label": z.string().max(240).optional(), "b005.label": z.string().max(240).optional(), "b006.label": z.string().max(240).optional(), "b008.title": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto dashboard-01: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Login01: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Login01.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.label": z.string().max(240).optional(), "b002.placeholder": z.string().max(240).optional(), "b003.label": z.string().max(240).optional(), "b003.placeholder": z.string().max(240).optional(), "b004.text": z.string().max(240).optional(), "b006.label": z.string().max(240).optional(), "b007.label": z.string().max(240).optional(), "b008.text": z.string().max(240).optional(), "b010.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto login-01: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Login02: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Login02.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional(), "b003.label": z.string().max(240).optional(), "b003.placeholder": z.string().max(240).optional(), "b004.label": z.string().max(240).optional(), "b004.placeholder": z.string().max(240).optional(), "b005.text": z.string().max(240).optional(), "b009.label": z.string().max(240).optional(), "b010.label": z.string().max(240).optional(), "b011.text": z.string().max(240).optional(), "b013.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto login-02: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Login03: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Login03.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.label": z.string().max(240).optional(), "b003.label": z.string().max(240).optional(), "b003.placeholder": z.string().max(240).optional(), "b004.label": z.string().max(240).optional(), "b004.placeholder": z.string().max(240).optional(), "b005.text": z.string().max(240).optional(), "b007.label": z.string().max(240).optional(), "b008.label": z.string().max(240).optional(), "b009.label": z.string().max(240).optional(), "b010.text": z.string().max(240).optional(), "b012.text": z.string().max(240).optional(), "b013.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto login-03: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Login04: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Login04.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional(), "b003.label": z.string().max(240).optional(), "b003.placeholder": z.string().max(240).optional(), "b004.label": z.string().max(240).optional(), "b004.placeholder": z.string().max(240).optional(), "b005.text": z.string().max(240).optional(), "b009.label": z.string().max(240).optional(), "b010.label": z.string().max(240).optional(), "b011.label": z.string().max(240).optional(), "b012.label": z.string().max(240).optional(), "b013.text": z.string().max(240).optional(), "b015.text": z.string().max(240).optional(), "b016.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto login-04: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Login05: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Login05.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.label": z.string().max(240).optional(), "b002.placeholder": z.string().max(240).optional(), "b004.label": z.string().max(240).optional(), "b005.label": z.string().max(240).optional(), "b006.label": z.string().max(240).optional(), "b007.text": z.string().max(240).optional(), "b009.text": z.string().max(240).optional(), "b010.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto login-05: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Signup01: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Signup01.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.label": z.string().max(240).optional(), "b002.placeholder": z.string().max(240).optional(), "b003.label": z.string().max(240).optional(), "b003.placeholder": z.string().max(240).optional(), "b004.label": z.string().max(240).optional(), "b004.placeholder": z.string().max(240).optional(), "b005.text": z.string().max(240).optional(), "b006.label": z.string().max(240).optional(), "b006.placeholder": z.string().max(240).optional(), "b008.label": z.string().max(240).optional(), "b009.label": z.string().max(240).optional(), "b010.text": z.string().max(240).optional(), "b012.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto signup-01: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Signup02: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Signup02.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional(), "b003.label": z.string().max(240).optional(), "b003.placeholder": z.string().max(240).optional(), "b004.label": z.string().max(240).optional(), "b004.placeholder": z.string().max(240).optional(), "b005.label": z.string().max(240).optional(), "b005.placeholder": z.string().max(240).optional(), "b006.text": z.string().max(240).optional(), "b007.label": z.string().max(240).optional(), "b007.placeholder": z.string().max(240).optional(), "b011.label": z.string().max(240).optional(), "b012.label": z.string().max(240).optional(), "b013.text": z.string().max(240).optional(), "b015.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto signup-02: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Signup03: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Signup03.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.label": z.string().max(240).optional(), "b003.label": z.string().max(240).optional(), "b003.placeholder": z.string().max(240).optional(), "b004.label": z.string().max(240).optional(), "b004.placeholder": z.string().max(240).optional(), "b005.label": z.string().max(240).optional(), "b005.placeholder": z.string().max(240).optional(), "b006.text": z.string().max(240).optional(), "b007.label": z.string().max(240).optional(), "b007.placeholder": z.string().max(240).optional(), "b009.label": z.string().max(240).optional(), "b010.text": z.string().max(240).optional(), "b011.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto signup-03: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Signup04: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Signup04.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional(), "b003.label": z.string().max(240).optional(), "b003.placeholder": z.string().max(240).optional(), "b004.label": z.string().max(240).optional(), "b004.placeholder": z.string().max(240).optional(), "b005.text": z.string().max(240).optional(), "b006.label": z.string().max(240).optional(), "b006.placeholder": z.string().max(240).optional(), "b010.label": z.string().max(240).optional(), "b011.label": z.string().max(240).optional(), "b012.label": z.string().max(240).optional(), "b013.label": z.string().max(240).optional(), "b014.text": z.string().max(240).optional(), "b016.text": z.string().max(240).optional(), "b017.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto signup-04: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Signup05: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Signup05.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.label": z.string().max(240).optional(), "b002.placeholder": z.string().max(240).optional(), "b004.label": z.string().max(240).optional(), "b005.label": z.string().max(240).optional(), "b006.label": z.string().max(240).optional(), "b007.text": z.string().max(240).optional(), "b009.text": z.string().max(240).optional(), "b010.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto signup-05: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar01: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar01.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional(), "b003.label": z.string().max(240).optional(), "b003.placeholder": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-01: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar02: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar02.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-02: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar03: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar03.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-03: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar04: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar04.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-04: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar05: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar05.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional(), "b003.label": z.string().max(240).optional(), "b003.placeholder": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-05: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar06: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar06.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional(), "b004.label": z.string().max(240).optional(), "b004.placeholder": z.string().max(240).optional(), "b005.label": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-06: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar07: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar07.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-07: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar08: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar08.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-08: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar09: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar09.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional(), "b003.label": z.string().max(240).optional(), "b003.placeholder": z.string().max(240).optional(), "b005.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-09: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar10: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar10.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-10: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar11: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar11.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional(), "b003.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-11: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar12: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar12.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional(), "b003.label": z.string().max(240).optional(), "b003.placeholder": z.string().max(240).optional(), "b005.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-12: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar13: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar13.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional(), "b003.label": z.string().max(240).optional(), "b004.text": z.string().max(240).optional(), "b005.title": z.string().max(240).optional(), "b005.description": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-13: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar14: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar14.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-14: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar15: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar15.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional(), "b003.text": z.string().max(240).optional(), "b005.text": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-15: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  Sidebar16: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Sidebar16.optional(),  content: strict({"b001.title": z.string().max(240).optional(), "b001.description": z.string().max(240).optional(), "b002.text": z.string().max(240).optional(), "b003.label": z.string().max(240).optional(), "b003.placeholder": z.string().max(240).optional()}).optional(), title:z.string().min(1).max(100).optional(),description:z.string().max(280).optional()}),
    description: "Bloco composto sidebar-16: JSX e preview oficial revisados; composição JSON com ações locais e sem dependências externas.",
  },
  ActivateAgentDialog: {
    props: strict({ nodeProps: compositeNodePropsSchemas.ActivateAgentDialog.optional(),  content: strict({"n0005.label": z.string().max(240).optional(), "n0006.text": z.string().max(240).optional(), "n0007.label": z.string().max(240).optional(), "n0008.title": z.string().max(240).optional(), "n0008.description": z.string().max(240).optional(), "n0009.title": z.string().max(240).optional(), "n0009.description": z.string().max(240).optional(), "activate_agent_dialog_0.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto ActivateAgentDialog: Ativar agente (action). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  AnalyticsCard: {
    props: strict({ nodeProps: compositeNodePropsSchemas.AnalyticsCard.optional(),  content: strict({"n0010.label": z.string().max(240).optional(), "n0011.label": z.string().max(240).optional(), "n0012.title": z.string().max(240).optional(), "n0013.title": z.string().max(240).optional(), "n0013.description": z.string().max(240).optional(), "analytics_card_0.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional(), chartTitle: z.string().max(100).optional() }),
    description: "Componente composto AnalyticsCard: Análises (chart). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  AnomalyAlert: {
    props: strict({ nodeProps: compositeNodePropsSchemas.AnomalyAlert.optional(),  content: strict({"n0015.title": z.string().max(240).optional(), "n0015.description": z.string().max(240).optional(), "n0016.label": z.string().max(240).optional(), "n0017.title": z.string().max(240).optional(), "n0017.description": z.string().max(240).optional(), "anomaly_alert_0.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto AnomalyAlert: Anomalia detectada (status). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  BarChartCard: {
    props: strict({ nodeProps: compositeNodePropsSchemas.BarChartCard.optional(),  content: strict({"n0019.label": z.string().max(240).optional(), "n0020.title": z.string().max(240).optional(), "n0021.title": z.string().max(240).optional(), "n0021.description": z.string().max(240).optional(), "bar_chart_card_0.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional(), chartTitle: z.string().max(100).optional() }),
    description: "Componente composto BarChartCard: Receita mensal (chart). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  BookAppointment: {
    props: strict({ nodeProps: compositeNodePropsSchemas.BookAppointment.optional(),  content: strict({"n0023.label": z.string().max(240).optional(), "n0023.placeholder": z.string().max(240).optional(), "n0024.label": z.string().max(240).optional(), "n0024.placeholder": z.string().max(240).optional(), "n0025.label": z.string().max(240).optional(), "n0026.title": z.string().max(240).optional(), "n0026.description": z.string().max(240).optional(), "book_appointment_1.title": z.string().max(240).optional(), "book_appointment_1.description": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional(), inputValue: z.string().max(240).optional() }),
    description: "Componente composto BookAppointment: Agendar consulta (form). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  CodespacesCard: {
    props: strict({ nodeProps: compositeNodePropsSchemas.CodespacesCard.optional(),  content: strict({"n0028.text": z.string().max(240).optional(), "n0029.label": z.string().max(240).optional(), "n0030.title": z.string().max(240).optional(), "n0030.description": z.string().max(240).optional(), "codespaces_card_1.text": z.string().max(240).optional(), "codespaces_card_2.label": z.string().max(240).optional(), "codespaces_card_2.placeholder": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto CodespacesCard: Ambiente de desenvolvimento (technical). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  ContributionsActivity: {
    props: strict({ nodeProps: compositeNodePropsSchemas.ContributionsActivity.optional(),  content: strict({"n0033.label": z.string().max(240).optional(), "n0034.label": z.string().max(240).optional(), "n0035.title": z.string().max(240).optional(), "n0035.description": z.string().max(240).optional(), "contributions_activity_0.label": z.string().max(240).optional(), "contributions_activity_1.label": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional() }),
    description: "Componente composto ContributionsActivity: Atividade de contribuições (distribution). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  Contributors: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Contributors.optional(),  content: strict({"n0036.label": z.string().max(240).optional(), "n0037.label": z.string().max(240).optional(), "n0038.label": z.string().max(240).optional(), "n0040.title": z.string().max(240).optional(), "n0040.description": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional() }),
    description: "Componente composto Contributors: Colaboradores (distribution). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  EnvironmentVariables: {
    props: strict({ nodeProps: compositeNodePropsSchemas.EnvironmentVariables.optional(),  content: strict({"n0042.label": z.string().max(240).optional(), "n0043.label": z.string().max(240).optional(), "n0044.label": z.string().max(240).optional(), "n0044.placeholder": z.string().max(240).optional(), "n0045.title": z.string().max(240).optional(), "n0045.description": z.string().max(240).optional(), "environment_variables_0.text": z.string().max(240).optional(), "environment_variables_1.label": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), inputValue: z.string().max(240).optional() }),
    description: "Componente composto EnvironmentVariables: Variáveis de ambiente (settings). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  FeedbackForm: {
    props: strict({ nodeProps: compositeNodePropsSchemas.FeedbackForm.optional(),  content: strict({"n0049.label": z.string().max(240).optional(), "n0050.title": z.string().max(240).optional(), "n0050.description": z.string().max(240).optional(), "feedback_form_0.label": z.string().max(240).optional(), "feedback_form_0.placeholder": z.string().max(240).optional(), "feedback_form_1.label": z.string().max(240).optional(), "feedback_form_1.placeholder": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional(), inputValue: z.string().max(240).optional() }),
    description: "Componente composto FeedbackForm: Enviar feedback (form). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  FileUpload: {
    props: strict({ nodeProps: compositeNodePropsSchemas.FileUpload.optional(),  content: strict({"n0052.title": z.string().max(240).optional(), "n0052.description": z.string().max(240).optional(), "n0053.label": z.string().max(240).optional(), "n0054.title": z.string().max(240).optional(), "n0054.description": z.string().max(240).optional(), "file_upload_0.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto FileUpload: Enviar arquivos (technical). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  GithubProfile: {
    props: strict({ nodeProps: compositeNodePropsSchemas.GithubProfile.optional(),  content: strict({"n0057.text": z.string().max(240).optional(), "n0059.title": z.string().max(240).optional(), "n0059.description": z.string().max(240).optional(), "github_profile_0.label": z.string().max(240).optional(), "github_profile_0.placeholder": z.string().max(240).optional(), "github_profile_1.label": z.string().max(240).optional(), "github_profile_1.placeholder": z.string().max(240).optional(), "github_profile_2.label": z.string().max(240).optional(), "github_profile_2.placeholder": z.string().max(240).optional(), "github_profile_3.label": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto GithubProfile: Perfil do desenvolvedor (visual). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  InviteTeam: {
    props: strict({ nodeProps: compositeNodePropsSchemas.InviteTeam.optional(),  content: strict({"n0067.label": z.string().max(240).optional(), "n0067.placeholder": z.string().max(240).optional(), "n0068.label": z.string().max(240).optional(), "n0069.title": z.string().max(240).optional(), "n0069.description": z.string().max(240).optional(), "invite_team_0.label": z.string().max(240).optional(), "invite_team_0.placeholder": z.string().max(240).optional(), "invite_team_1.label": z.string().max(240).optional(), "invite_team_1.placeholder": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional(), inputValue: z.string().max(240).optional() }),
    description: "Componente composto InviteTeam: Convidar equipe (action). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  Invoice: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Invoice.optional(),  content: strict({"status.label": z.string().max(240).optional(), "download.label": z.string().max(240).optional(), "pay.label": z.string().max(240).optional(), "root.title": z.string().max(240).optional(), "root.description": z.string().max(240).optional(), "invoice_0.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto Invoice: Fatura (transactions). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  NoTeamMembers: {
    props: strict({ nodeProps: compositeNodePropsSchemas.NoTeamMembers.optional(),  content: strict({"n0078.title": z.string().max(240).optional(), "n0078.description": z.string().max(240).optional(), "n0079.label": z.string().max(240).optional(), "n0080.title": z.string().max(240).optional(), "n0080.description": z.string().max(240).optional(), "no_team_members_1.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto NoTeamMembers: Sem integrantes (empty). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  NotFound: {
    props: strict({ nodeProps: compositeNodePropsSchemas.NotFound.optional(),  content: strict({"n0082.title": z.string().max(240).optional(), "n0082.description": z.string().max(240).optional(), "n0083.label": z.string().max(240).optional(), "n0084.title": z.string().max(240).optional(), "n0084.description": z.string().max(240).optional(), "not_found_0.text": z.string().max(240).optional(), "not_found_1.label": z.string().max(240).optional(), "not_found_1.placeholder": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto NotFound: Página não encontrada (empty). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  ObservabilityCard: {
    props: strict({ nodeProps: compositeNodePropsSchemas.ObservabilityCard.optional(),  content: strict({"n0086.label": z.string().max(240).optional(), "n0089.title": z.string().max(240).optional(), "n0089.description": z.string().max(240).optional(), "observability_card_0.label": z.string().max(240).optional(), "observability_card_1.text": z.string().max(240).optional(), "observability_card_2.label": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional(), chartTitle: z.string().max(100).optional() }),
    description: "Componente composto ObservabilityCard: Observabilidade (chart). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  PieChartCard: {
    props: strict({ nodeProps: compositeNodePropsSchemas.PieChartCard.optional(),  content: strict({"n0090.label": z.string().max(240).optional(), "n0091.label": z.string().max(240).optional(), "n0092.label": z.string().max(240).optional(), "n0093.title": z.string().max(240).optional(), "n0093.description": z.string().max(240).optional(), "pie_chart_card_0.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional() }),
    description: "Componente composto PieChartCard: Canais de aquisição (distribution). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  ReportBug: {
    props: strict({ nodeProps: compositeNodePropsSchemas.ReportBug.optional(),  content: strict({"n0095.label": z.string().max(240).optional(), "n0095.placeholder": z.string().max(240).optional(), "n0096.label": z.string().max(240).optional(), "n0096.placeholder": z.string().max(240).optional(), "n0097.label": z.string().max(240).optional(), "n0098.title": z.string().max(240).optional(), "n0098.description": z.string().max(240).optional(), "report_bug_0.label": z.string().max(240).optional(), "report_bug_0.placeholder": z.string().max(240).optional(), "report_bug_1.label": z.string().max(240).optional(), "report_bug_1.placeholder": z.string().max(240).optional(), "report_bug_2.label": z.string().max(240).optional(), "report_bug_2.placeholder": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional(), inputValue: z.string().max(240).optional() }),
    description: "Componente composto ReportBug: Reportar problema (form). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  ShippingAddress: {
    props: strict({ nodeProps: compositeNodePropsSchemas.ShippingAddress.optional(),  content: strict({"street.label": z.string().max(240).optional(), "street.placeholder": z.string().max(240).optional(), "apt.label": z.string().max(240).optional(), "apt.placeholder": z.string().max(240).optional(), "city.label": z.string().max(240).optional(), "city.placeholder": z.string().max(240).optional(), "state.label": z.string().max(240).optional(), "state.placeholder": z.string().max(240).optional(), "zip.label": z.string().max(240).optional(), "zip.placeholder": z.string().max(240).optional(), "country.label": z.string().max(240).optional(), "country.placeholder": z.string().max(240).optional(), "save.label": z.string().max(240).optional(), "cancel.label": z.string().max(240).optional(), "submit.label": z.string().max(240).optional(), "root.title": z.string().max(240).optional(), "root.description": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional(), inputValue: z.string().max(240).optional() }),
    description: "Componente composto ShippingAddress: Endereço de entrega (form). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  SleepReport: {
    props: strict({ nodeProps: compositeNodePropsSchemas.SleepReport.optional(),  content: strict({"n0113.label": z.string().max(240).optional(), "n0114.label": z.string().max(240).optional(), "n0116.title": z.string().max(240).optional(), "n0116.description": z.string().max(240).optional(), "sleep_report_0.label": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional(), chartTitle: z.string().max(100).optional() }),
    description: "Componente composto SleepReport: Relatório de sono (trend). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  UsageCard: {
    props: strict({ nodeProps: compositeNodePropsSchemas.UsageCard.optional(),  content: strict({"n0133.label": z.string().max(240).optional(), "n0135.title": z.string().max(240).optional(), "n0135.description": z.string().max(240).optional(), "usage_card_0.label": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional(), chartTitle: z.string().max(100).optional() }),
    description: "Componente composto UsageCard: Uso da plataforma (chart). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  Visitors: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Visitors.optional(),  content: strict({"n0136.label": z.string().max(240).optional(), "n0137.label": z.string().max(240).optional(), "n0138.title": z.string().max(240).optional(), "n0139.title": z.string().max(240).optional(), "n0139.description": z.string().max(240).optional(), "visitors_0.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional(), chartTitle: z.string().max(100).optional() }),
    description: "Componente composto Visitors: Visitantes (chart). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  WeeklyFitnessSummary: {
    props: strict({ nodeProps: compositeNodePropsSchemas.WeeklyFitnessSummary.optional(),  content: strict({"n0142.label": z.string().max(240).optional(), "n0143.title": z.string().max(240).optional(), "n0144.title": z.string().max(240).optional(), "n0144.description": z.string().max(240).optional(), "weekly_fitness_summary_0.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional(), chartTitle: z.string().max(100).optional() }),
    description: "Componente composto WeeklyFitnessSummary: Atividade semanal (trend). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  AccountAccess: {
    props: strict({ nodeProps: compositeNodePropsSchemas.AccountAccess.optional(),  content: strict({"n0008.label": z.string().max(240).optional(), "n0009.title": z.string().max(240).optional(), "n0009.description": z.string().max(240).optional(), "account_access_0.label": z.string().max(240).optional(), "account_access_0.placeholder": z.string().max(240).optional(), "account_access_1.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto AccountAccess: Acesso da conta (settings). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  CardOverview: {
    props: strict({ nodeProps: compositeNodePropsSchemas.CardOverview.optional(),  content: strict({"n0010.label": z.string().max(240).optional(), "n0012.text": z.string().max(240).optional(), "n0013.label": z.string().max(240).optional(), "n0014.title": z.string().max(240).optional(), "n0014.description": z.string().max(240).optional(), "card_overview_0.label": z.string().max(240).optional(), "card_overview_1.title": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto CardOverview: Visão geral do cartão (product). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  ClaimableBalance: {
    props: strict({ nodeProps: compositeNodePropsSchemas.ClaimableBalance.optional(),  content: strict({"n0015.label": z.string().max(240).optional(), "n0016.label": z.string().max(240).optional(), "n0017.label": z.string().max(240).optional(), "n0018.title": z.string().max(240).optional(), "n0018.description": z.string().max(240).optional(), "claimable_balance_0.text": z.string().max(240).optional(), "claimable_balance_1.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional() }),
    description: "Componente composto ClaimableBalance: Saldo disponível (savings). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  ContributionHistory: {
    props: strict({ nodeProps: compositeNodePropsSchemas.ContributionHistory.optional(),  content: strict({"n0019.label": z.string().max(240).optional(), "n0020.label": z.string().max(240).optional(), "n0022.title": z.string().max(240).optional(), "n0022.description": z.string().max(240).optional(), "contribution_history_0.title": z.string().max(240).optional(), "contribution_history_1.label": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional() }),
    description: "Componente composto ContributionHistory: Histórico de contribuições (distribution). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  CoverArt: {
    props: strict({ nodeProps: compositeNodePropsSchemas.CoverArt.optional(),  content: strict({"n0025.text": z.string().max(240).optional(), "n0026.label": z.string().max(240).optional(), "n0027.title": z.string().max(240).optional(), "n0027.description": z.string().max(240).optional(), "cover_art_0.text": z.string().max(240).optional(), "cover_art_1.label": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto CoverArt: Capa do álbum (product). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  DividendIncome: {
    props: strict({ nodeProps: compositeNodePropsSchemas.DividendIncome.optional(),  content: strict({"n0029.label": z.string().max(240).optional(), "n0030.title": z.string().max(240).optional(), "n0031.title": z.string().max(240).optional(), "n0031.description": z.string().max(240).optional(), "dividend_income_0.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional(), chartTitle: z.string().max(100).optional() }),
    description: "Componente composto DividendIncome: Dividendos (trend). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  EmptyConnectBank: {
    props: strict({ nodeProps: compositeNodePropsSchemas.EmptyConnectBank.optional(),  content: strict({"n0034.title": z.string().max(240).optional(), "n0034.description": z.string().max(240).optional(), "n0035.label": z.string().max(240).optional(), "n0036.title": z.string().max(240).optional(), "n0036.description": z.string().max(240).optional(), "empty_connect_bank_0.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto EmptyConnectBank: Conectar banco (empty). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  EmptyDistributeTrack: {
    props: strict({ nodeProps: compositeNodePropsSchemas.EmptyDistributeTrack.optional(),  content: strict({"n0038.title": z.string().max(240).optional(), "n0038.description": z.string().max(240).optional(), "n0039.label": z.string().max(240).optional(), "n0040.title": z.string().max(240).optional(), "n0040.description": z.string().max(240).optional(), "empty_distribute_track_0.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto EmptyDistributeTrack: Distribuição de faixa (empty). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  EmptyExploreCatalog: {
    props: strict({ nodeProps: compositeNodePropsSchemas.EmptyExploreCatalog.optional(),  content: strict({"n0042.title": z.string().max(240).optional(), "n0042.description": z.string().max(240).optional(), "n0043.label": z.string().max(240).optional(), "n0044.title": z.string().max(240).optional(), "n0044.description": z.string().max(240).optional(), "empty_explore_catalog_0.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto EmptyExploreCatalog: Explorar catálogo (empty). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  Faq: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Faq.optional(),  content: strict({"n0047.title": z.string().max(240).optional(), "n0047.description": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional() }),
    description: "Componente composto Faq: Perguntas frequentes (navigation). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  FrontDoor: {
    props: strict({ nodeProps: compositeNodePropsSchemas.FrontDoor.optional(),  content: strict({"n0048.label": z.string().max(240).optional(), "n0050.text": z.string().max(240).optional(), "n0051.label": z.string().max(240).optional(), "n0052.title": z.string().max(240).optional(), "n0052.description": z.string().max(240).optional(), "front_door_0.label": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional() }),
    description: "Componente composto FrontDoor: Porta de entrada (product). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  IndexInvesting: {
    props: strict({ nodeProps: compositeNodePropsSchemas.IndexInvesting.optional(),  content: strict({"n0054.label": z.string().max(240).optional(), "n0055.title": z.string().max(240).optional(), "n0056.title": z.string().max(240).optional(), "n0056.description": z.string().max(240).optional(), "index_investing_0.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional(), chartTitle: z.string().max(100).optional() }),
    description: "Componente composto IndexInvesting: Investimento em índices (trend). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  KitchenIsland: {
    props: strict({ nodeProps: compositeNodePropsSchemas.KitchenIsland.optional(),  content: strict({"n0062.title": z.string().max(240).optional(), "n0062.description": z.string().max(240).optional(), "kitchen_island_0.label": z.string().max(240).optional(), "kitchen_island_2.label": z.string().max(240).optional(), "kitchen_island_3.label": z.string().max(240).optional(), "kitchen_island_4.label": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto KitchenIsland: Ilha de cozinha (product). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  NewMilestone: {
    props: strict({ nodeProps: compositeNodePropsSchemas.NewMilestone.optional(),  content: strict({"n0067.label": z.string().max(240).optional(), "n0067.placeholder": z.string().max(240).optional(), "n0068.label": z.string().max(240).optional(), "n0068.placeholder": z.string().max(240).optional(), "n0069.label": z.string().max(240).optional(), "n0070.title": z.string().max(240).optional(), "n0070.description": z.string().max(240).optional(), "new_milestone_0.label": z.string().max(240).optional(), "new_milestone_0.placeholder": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional(), inputValue: z.string().max(240).optional() }),
    description: "Componente composto NewMilestone: Nova meta (form). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  NotificationSettings: {
    props: strict({ nodeProps: compositeNodePropsSchemas.NotificationSettings.optional(),  content: strict({"n0076.title": z.string().max(240).optional(), "n0076.description": z.string().max(240).optional(), "notification_settings_0.label": z.string().max(240).optional(), "notification_settings_1.label": z.string().max(240).optional(), "notification_settings_2.label": z.string().max(240).optional(), "notification_settings_3.label": z.string().max(240).optional(), "notification_settings_4.label": z.string().max(240).optional(), "notifications_field_group.description": z.string().max(240).optional(), "notifications_field_group.label": z.string().max(240).optional(), "notification_submit.label": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto NotificationSettings: Notificações (settings). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  Payments: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Payments.optional(),  content: strict({"n0079.label": z.string().max(240).optional(), "n0080.title": z.string().max(240).optional(), "n0080.description": z.string().max(240).optional(), "payments_0.text": z.string().max(240).optional(), "payments_1.text": z.string().max(240).optional(), "payments_2.text": z.string().max(240).optional(), "payments_3.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto Payments: Pagamentos (transactions). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  PayoutThreshold: {
    props: strict({ nodeProps: compositeNodePropsSchemas.PayoutThreshold.optional(),  content: strict({"n0084.title": z.string().max(240).optional(), "n0084.description": z.string().max(240).optional(), "payout_threshold_0.label": z.string().max(240).optional(), "payout_threshold_1.label": z.string().max(240).optional(), "payout_threshold_1.placeholder": z.string().max(240).optional(), "payout_threshold_2.label": z.string().max(240).optional(), "payout_currency.label": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional() }),
    description: "Componente composto PayoutThreshold: Limite de saque (savings). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  PowerUsage: {
    props: strict({ nodeProps: compositeNodePropsSchemas.PowerUsage.optional(),  content: strict({"n0087.label": z.string().max(240).optional(), "n0088.title": z.string().max(240).optional(), "n0089.title": z.string().max(240).optional(), "n0089.description": z.string().max(240).optional(), "power_usage_0.label": z.string().max(240).optional(), "power_usage_1.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional(), chartTitle: z.string().max(100).optional() }),
    description: "Componente composto PowerUsage: Energia (trend). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  Preferences: {
    props: strict({ nodeProps: compositeNodePropsSchemas.Preferences.optional(),  content: strict({"n0091.label": z.string().max(240).optional(), "n0092.label": z.string().max(240).optional(), "n0093.label": z.string().max(240).optional(), "n0093.placeholder": z.string().max(240).optional(), "n0094.title": z.string().max(240).optional(), "n0094.description": z.string().max(240).optional(), "preferences_0.label": z.string().max(240).optional(), "preferences_1.label": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional() }),
    description: "Componente composto Preferences: Preferências (settings). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  ReceivingMethod: {
    props: strict({ nodeProps: compositeNodePropsSchemas.ReceivingMethod.optional(),  content: strict({"n0101.label": z.string().max(240).optional(), "n0102.title": z.string().max(240).optional(), "n0102.description": z.string().max(240).optional(), "receiving_method_0.label": z.string().max(240).optional(), "receiving_method_1.label": z.string().max(240).optional(), "receiving_method_1.placeholder": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto ReceivingMethod: Recebimento (action). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  RecentTransactions: {
    props: strict({ nodeProps: compositeNodePropsSchemas.RecentTransactions.optional(),  content: strict({"n0105.label": z.string().max(240).optional(), "n0106.title": z.string().max(240).optional(), "n0106.description": z.string().max(240).optional(), "recent_transactions_0.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto RecentTransactions: Transações recentes (transactions). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  ReleaseCatalog: {
    props: strict({ nodeProps: compositeNodePropsSchemas.ReleaseCatalog.optional(),  content: strict({"n0107.label": z.string().max(240).optional(), "n0109.text": z.string().max(240).optional(), "n0110.label": z.string().max(240).optional(), "n0111.title": z.string().max(240).optional(), "n0111.description": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto ReleaseCatalog: Catálogo de lançamentos (product). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  RollerShades: {
    props: strict({ nodeProps: compositeNodePropsSchemas.RollerShades.optional(),  content: strict({"n0117.title": z.string().max(240).optional(), "n0117.description": z.string().max(240).optional(), "roller_shades_0.label": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional() }),
    description: "Componente composto RollerShades: Persianas (product). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  SavingsProgress: {
    props: strict({ nodeProps: compositeNodePropsSchemas.SavingsProgress.optional(),  content: strict({"n0119.label": z.string().max(240).optional(), "n0120.label": z.string().max(240).optional(), "n0121.title": z.string().max(240).optional(), "n0121.description": z.string().max(240).optional(), "savings_progress_0.text": z.string().max(240).optional(), "savings_progress_1.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional() }),
    description: "Componente composto SavingsProgress: Economia acumulada (savings). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  SavingsTargets: {
    props: strict({ nodeProps: compositeNodePropsSchemas.SavingsTargets.optional(),  content: strict({"n0123.label": z.string().max(240).optional(), "n0124.label": z.string().max(240).optional(), "n0125.title": z.string().max(240).optional(), "n0125.description": z.string().max(240).optional(), "savings_targets_0.text": z.string().max(240).optional(), "savings_targets_1.label": z.string().max(240).optional(), "savings_targets_1.placeholder": z.string().max(240).optional(), "savings_targets_2.label": z.string().max(240).optional(), "savings_targets_2.placeholder": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional() }),
    description: "Componente composto SavingsTargets: Metas de economia (savings). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  SocialLinks: {
    props: strict({ nodeProps: compositeNodePropsSchemas.SocialLinks.optional(),  content: strict({"n0131.label": z.string().max(240).optional(), "n0131.placeholder": z.string().max(240).optional(), "n0132.label": z.string().max(240).optional(), "n0133.title": z.string().max(240).optional(), "n0133.description": z.string().max(240).optional(), "social_links_0.label": z.string().max(240).optional(), "social_links_0.placeholder": z.string().max(240).optional(), "social_links_1.label": z.string().max(240).optional(), "social_links_1.placeholder": z.string().max(240).optional(), "social_links_2.label": z.string().max(240).optional(), "social_links_2.placeholder": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional(), inputValue: z.string().max(240).optional() }),
    description: "Componente composto SocialLinks: Redes sociais (action). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  StockPerformance: {
    props: strict({ nodeProps: compositeNodePropsSchemas.StockPerformance.optional(),  content: strict({"n0135.label": z.string().max(240).optional(), "n0136.title": z.string().max(240).optional(), "n0137.title": z.string().max(240).optional(), "n0137.description": z.string().max(240).optional(), "stock_performance_0.label": z.string().max(240).optional(), "stock_performance_0.placeholder": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), metricValue: z.string().max(64).optional(), chartTitle: z.string().max(100).optional() }),
    description: "Componente composto StockPerformance: Desempenho de ações (trend). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  SyncingState: {
    props: strict({ nodeProps: compositeNodePropsSchemas.SyncingState.optional(),  content: strict({"n0140.label": z.string().max(240).optional(), "n0141.title": z.string().max(240).optional(), "n0141.description": z.string().max(240).optional(), "syncing_state_0.label": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional() }),
    description: "Componente composto SyncingState: Sincronização (status). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  TransferFunds: {
    props: strict({ nodeProps: compositeNodePropsSchemas.TransferFunds.optional(),  content: strict({"n0143.label": z.string().max(240).optional(), "n0143.placeholder": z.string().max(240).optional(), "n0144.label": z.string().max(240).optional(), "n0144.placeholder": z.string().max(240).optional(), "n0145.label": z.string().max(240).optional(), "n0146.title": z.string().max(240).optional(), "n0146.description": z.string().max(240).optional(), "transfer_funds_0.label": z.string().max(240).optional(), "transfer_funds_0.placeholder": z.string().max(240).optional(), "transfer_funds_1.label": z.string().max(240).optional(), "transfer_funds_1.placeholder": z.string().max(240).optional(), "transfer_funds_2.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional(), inputValue: z.string().max(240).optional() }),
    description: "Componente composto TransferFunds: Transferir valores (form). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },
  UpcomingPayments: {
    props: strict({ nodeProps: compositeNodePropsSchemas.UpcomingPayments.optional(),  content: strict({"n0147.label": z.string().max(240).optional(), "n0149.label": z.string().max(240).optional(), "n0150.title": z.string().max(240).optional(), "n0150.description": z.string().max(240).optional(), "upcoming_payments_0.text": z.string().max(240).optional(), "upcoming_payments_1.text": z.string().max(240).optional(), "upcoming_payments_2.text": z.string().max(240).optional()}).optional(),  title: z.string().min(1).max(100).optional(), description: z.string().max(280).optional(), primaryActionLabel: z.string().max(96).optional() }),
    description: "Componente composto UpcomingPayments: Próximos pagamentos (transactions). Composição validada de primitivas aprovadas; dados demonstrativos e ações locais."
  },

  SiteColorPalette: {
    props: strict({ nodeProps: compositeNodePropsSchemas.SiteColorPalette.optional(),  content: strict({"c001.title": z.string().max(240).optional(), "c001.description": z.string().max(240).optional(), "c002.label": z.string().max(240).optional(), "c002.placeholder": z.string().max(240).optional(), "c003.label": z.string().max(240).optional(), "c004.text": z.string().max(240).optional(), "c005.label": z.string().max(240).optional(), "c007.label": z.string().max(240).optional(), "c008.text": z.string().max(240).optional(), "c009.label": z.string().max(240).optional(), "c011.label": z.string().max(240).optional(), "c012.text": z.string().max(240).optional(), "c013.label": z.string().max(240).optional()}).optional(),  title:z.string().min(1).max(100).optional(), description:z.string().max(280).optional() }),
    description: "Composição aprovada SiteColorPalette; referenciada a color-palette.tsx (shadcn/v4); sem operações externas.",
  },
  SiteCommandMenu: {
    props: strict({ nodeProps: compositeNodePropsSchemas.SiteCommandMenu.optional(),  content: strict({"c001.title": z.string().max(240).optional(), "c001.description": z.string().max(240).optional(), "c002.label": z.string().max(240).optional(), "c002.placeholder": z.string().max(240).optional(), "c003.text": z.string().max(240).optional(), "c004.label": z.string().max(240).optional(), "c005.text": z.string().max(240).optional(), "c006.label": z.string().max(240).optional(), "c007.label": z.string().max(240).optional(), "c008.label": z.string().max(240).optional()}).optional(),  title:z.string().min(1).max(100).optional(), description:z.string().max(280).optional() }),
    description: "Composição aprovada SiteCommandMenu; referenciada a command-menu.tsx (shadcn/v4); sem operações externas.",
  },
  SiteDirectoryList: {
    props: strict({ nodeProps: compositeNodePropsSchemas.SiteDirectoryList.optional(),  content: strict({"c001.title": z.string().max(240).optional(), "c001.description": z.string().max(240).optional(), "c002.label": z.string().max(240).optional(), "c002.placeholder": z.string().max(240).optional(), "c003.text": z.string().max(240).optional(), "c004.text": z.string().max(240).optional(), "c006.label": z.string().max(240).optional(), "c008.text": z.string().max(240).optional(), "c009.text": z.string().max(240).optional(), "c011.label": z.string().max(240).optional(), "c013.text": z.string().max(240).optional(), "c014.text": z.string().max(240).optional(), "c016.label": z.string().max(240).optional()}).optional(),  title:z.string().min(1).max(100).optional(), description:z.string().max(280).optional() }),
    description: "Composição aprovada SiteDirectoryList; referenciada a directory-list.tsx (shadcn/v4); sem operações externas.",
  },
  SiteNavUser: {
    props: strict({ nodeProps: compositeNodePropsSchemas.SiteNavUser.optional(),  content: strict({"c001.title": z.string().max(240).optional(), "c001.description": z.string().max(240).optional(), "c003.text": z.string().max(240).optional(), "c004.text": z.string().max(240).optional(), "c007.content": z.string().max(240).optional(), "c007.trigger": z.string().max(240).optional()}).optional(),  title:z.string().min(1).max(100).optional(), description:z.string().max(280).optional() }),
    description: "Composição aprovada SiteNavUser; referenciada a nav-user.tsx (shadcn/v4); sem operações externas.",
  },
  SiteThemeCustomizer: {
    props: strict({ nodeProps: compositeNodePropsSchemas.SiteThemeCustomizer.optional(),  content: strict({"c001.title": z.string().max(240).optional(), "c001.description": z.string().max(240).optional(), "c002.label": z.string().max(240).optional(), "c002.placeholder": z.string().max(240).optional(), "c003.label": z.string().max(240).optional(), "c003.placeholder": z.string().max(240).optional(), "c004.label": z.string().max(240).optional(), "c006.label": z.string().max(240).optional()}).optional(),  title:z.string().min(1).max(100).optional(), description:z.string().max(280).optional() }),
    description: "Composição aprovada SiteThemeCustomizer; referenciada a theme-customizer.tsx (shadcn/v4); sem operações externas.",
  },
  SiteCardsActivityGoal: {
    props: strict({ goal:z.number().int().min(0).max(10000).optional(), minimum:z.number().int().min(0).max(10000).optional(), maximum:z.number().int().min(1).max(10000).optional(), step:z.number().int().min(1).max(100).optional(), chartValues:z.array(z.number().finite().min(0).max(10000)).min(1).max(52).optional(), showBarChart:z.boolean().optional(),  content: strict({"c001.title": z.string().max(240).optional(), "c001.description": z.string().max(240).optional(), "c002.label": z.string().max(240).optional(), "c003.label": z.string().max(240).optional(), "c004.label": z.string().max(240).optional(), "c006.title": z.string().max(240).optional(), "c007.label": z.string().max(240).optional()}).optional(),  title:z.string().min(1).max(100).optional(), description:z.string().max(280).optional() }),
    events: ["change","save"],
    description: "Composição aprovada SiteCardsActivityGoal; referenciada a cards/activity-goal.tsx (shadcn/v4); sem operações externas.",
  },
  SiteCardsChat: {
    props: strict({ recipient:z.string().min(1).max(100).optional(), initialMessages:z.array(strict({role:z.enum(["mine","theirs"]),text:z.string().min(1).max(500)})).max(12).optional(),  content: strict({"c001.title": z.string().max(240).optional(), "c001.description": z.string().max(240).optional(), "c003.label": z.string().max(240).optional(), "c005.text": z.string().max(240).optional(), "c006.text": z.string().max(240).optional(), "c007.text": z.string().max(240).optional(), "c008.label": z.string().max(240).optional(), "c008.placeholder": z.string().max(240).optional(), "c009.label": z.string().max(240).optional()}).optional(),  title:z.string().min(1).max(100).optional(), description:z.string().max(280).optional() }),
    events: ["send"],
    description: "Composição aprovada SiteCardsChat; referenciada a cards/chat.tsx (shadcn/v4); sem operações externas.",
  },
  SiteCardsCookieSettings: {
    props: strict({ necessaryLabel:z.string().min(1).max(90).optional(), analyticsLabel:z.string().min(1).max(90).optional(), marketingLabel:z.string().min(1).max(90).optional(), defaultAnalytics:z.boolean().optional(), defaultMarketing:z.boolean().optional(), showOptionalCookies:z.boolean().optional(),  content: strict({"c001.title": z.string().max(240).optional(), "c001.description": z.string().max(240).optional(), "c002.label": z.string().max(240).optional(), "c003.description": z.string().max(240).optional(), "c003.label": z.string().max(240).optional(), "c004.label": z.string().max(240).optional()}).optional(),  title:z.string().min(1).max(100).optional(), description:z.string().max(280).optional() }),
    events: ["change","save"],
    description: "Composição aprovada SiteCardsCookieSettings; referenciada a cards/cookie-settings.tsx (shadcn/v4); sem operações externas.",
  },
  SiteCardsCreateAccount: {
    props: strict({ nodeProps: compositeNodePropsSchemas.SiteCardsCreateAccount.optional(),  content: strict({"c001.title": z.string().max(240).optional(), "c001.description": z.string().max(240).optional(), "c002.label": z.string().max(240).optional(), "c003.label": z.string().max(240).optional(), "c005.text": z.string().max(240).optional(), "c006.label": z.string().max(240).optional(), "c006.placeholder": z.string().max(240).optional(), "c007.label": z.string().max(240).optional(), "c007.placeholder": z.string().max(240).optional(), "c008.label": z.string().max(240).optional()}).optional(),  title:z.string().min(1).max(100).optional(), description:z.string().max(280).optional() }),
    description: "Composição aprovada SiteCardsCreateAccount; referenciada a cards/create-account.tsx (shadcn/v4); sem operações externas.",
  },
  SiteCardsForms: {
    props: strict({ nodeProps: compositeNodePropsSchemas.SiteCardsForms.optional(),  content: strict({"c001.title": z.string().max(240).optional(), "c001.description": z.string().max(240).optional(), "c002.label": z.string().max(240).optional(), "c002.placeholder": z.string().max(240).optional(), "c003.label": z.string().max(240).optional(), "c003.placeholder": z.string().max(240).optional(), "c005.label": z.string().max(240).optional(), "c005.placeholder": z.string().max(240).optional(), "c006.label": z.string().max(240).optional(), "c006.placeholder": z.string().max(240).optional(), "c008.label": z.string().max(240).optional(), "c009.label": z.string().max(240).optional(), "c009.placeholder": z.string().max(240).optional(), "c010.label": z.string().max(240).optional()}).optional(),  title:z.string().min(1).max(100).optional(), description:z.string().max(280).optional() }),
    description: "Composição aprovada SiteCardsForms; referenciada a cards/forms.tsx (shadcn/v4); sem operações externas.",
  },
  SiteCardsPaymentMethod: {
    props: strict({ plans:z.array(strict({id:z.string().min(1).max(32).regex(/^[a-z0-9-]+$/),label:z.string().min(1).max(80),description:z.string().max(160).optional(),displayPrice:z.string().max(40).optional()})).min(1).max(6).optional(),defaultPlan:z.string().max(32).optional(),checkoutLabel:z.string().max(80).optional(), content: strict({"c001.title": z.string().max(240).optional(), "c001.description": z.string().max(240).optional(), "c002.label": z.string().max(240).optional(), "c002.placeholder": z.string().max(240).optional(), "c003.text": z.string().max(240).optional(), "c004.label": z.string().max(240).optional(), "c005.label": z.string().max(240).optional(), "c005.placeholder": z.string().max(240).optional(), "c006.label": z.string().max(240).optional(), "c006.placeholder": z.string().max(240).optional(), "c007.label": z.string().max(240).optional(), "c007.placeholder": z.string().max(240).optional(), "c008.label": z.string().max(240).optional(), "c008.placeholder": z.string().max(240).optional(), "c010.label": z.string().max(240).optional()}).optional(),  title:z.string().min(1).max(100).optional(), description:z.string().max(280).optional() }),
    events: ["planChange","select"],
    description: "Composição aprovada SiteCardsPaymentMethod; referenciada a cards/payment-method.tsx (shadcn/v4); sem operações externas.",
  },
  SiteCardsReportIssue: {
    props: strict({ nodeProps: compositeNodePropsSchemas.SiteCardsReportIssue.optional(),  content: strict({"c001.title": z.string().max(240).optional(), "c001.description": z.string().max(240).optional(), "c002.label": z.string().max(240).optional(), "c002.placeholder": z.string().max(240).optional(), "c003.label": z.string().max(240).optional(), "c003.placeholder": z.string().max(240).optional(), "c005.label": z.string().max(240).optional(), "c005.placeholder": z.string().max(240).optional(), "c006.label": z.string().max(240).optional(), "c006.placeholder": z.string().max(240).optional(), "c007.label": z.string().max(240).optional(), "c008.label": z.string().max(240).optional()}).optional(),  title:z.string().min(1).max(100).optional(), description:z.string().max(280).optional() }),
    description: "Composição aprovada SiteCardsReportIssue; referenciada a cards/report-issue.tsx (shadcn/v4); sem operações externas.",
  },
  SiteCardsShare: {
    props: strict({ nodeProps: compositeNodePropsSchemas.SiteCardsShare.optional(),  content: strict({"c001.title": z.string().max(240).optional(), "c001.description": z.string().max(240).optional(), "c002.label": z.string().max(240).optional(), "c002.placeholder": z.string().max(240).optional(), "c003.label": z.string().max(240).optional(), "c006.text": z.string().max(240).optional(), "c008.text": z.string().max(240).optional(), "c009.text": z.string().max(240).optional(), "c011.label": z.string().max(240).optional(), "c011.placeholder": z.string().max(240).optional(), "c014.text": z.string().max(240).optional(), "c015.text": z.string().max(240).optional(), "c017.label": z.string().max(240).optional(), "c017.placeholder": z.string().max(240).optional(), "c020.text": z.string().max(240).optional(), "c021.text": z.string().max(240).optional(), "c023.label": z.string().max(240).optional(), "c023.placeholder": z.string().max(240).optional(), "c026.text": z.string().max(240).optional(), "c027.text": z.string().max(240).optional(), "c029.label": z.string().max(240).optional(), "c029.placeholder": z.string().max(240).optional()}).optional(),  title:z.string().min(1).max(100).optional(), description:z.string().max(280).optional() }),
    description: "Composição aprovada SiteCardsShare; referenciada a cards/share.tsx (shadcn/v4); sem operações externas.",
  },
  SiteCardsStats: {
    props: strict({ nodeProps: compositeNodePropsSchemas.SiteCardsStats.optional(),  content: strict({"c001.title": z.string().max(240).optional(), "c001.description": z.string().max(240).optional(), "c002.label": z.string().max(240).optional(), "c003.label": z.string().max(240).optional(), "c005.title": z.string().max(240).optional(), "c006.title": z.string().max(240).optional()}).optional(),  title:z.string().min(1).max(100).optional(), description:z.string().max(280).optional() }),
    description: "Composição aprovada SiteCardsStats; referenciada a cards/stats.tsx (shadcn/v4); sem operações externas.",
  },
  SiteCardsTeamMembers: {
    props: strict({ members:z.array(strict({id:z.string().min(1).max(32).regex(/^[a-z0-9-]+$/),name:z.string().min(1).max(80),role:z.string().min(1).max(40),description:z.string().max(160).optional()})).max(16).optional(),roles:z.array(z.string().min(1).max(40)).min(1).max(8).optional(),allowRoleChanges:z.boolean().optional(), content: strict({"c001.title": z.string().max(240).optional(), "c001.description": z.string().max(240).optional(), "c003.text": z.string().max(240).optional(), "c004.text": z.string().max(240).optional(), "c006.label": z.string().max(240).optional(), "c006.placeholder": z.string().max(240).optional(), "c009.text": z.string().max(240).optional(), "c010.text": z.string().max(240).optional(), "c012.label": z.string().max(240).optional(), "c012.placeholder": z.string().max(240).optional(), "c015.text": z.string().max(240).optional(), "c016.text": z.string().max(240).optional(), "c018.label": z.string().max(240).optional(), "c018.placeholder": z.string().max(240).optional()}).optional(),  title:z.string().min(1).max(100).optional(), description:z.string().max(280).optional() }),
    events: ["roleChange"],
    description: "Composição aprovada SiteCardsTeamMembers; referenciada a cards/team-members.tsx (shadcn/v4); sem operações externas.",
  },

};
