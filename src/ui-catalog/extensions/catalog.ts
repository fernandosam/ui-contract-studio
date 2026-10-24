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
