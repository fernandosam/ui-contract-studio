import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";
import { extensionDefinitions } from "./extensions/catalog";

/**
 * Versioned shadcn-aligned JSON-safe API for 41 baseline types.
 * Extensions must be admitted independently through ./extensions/catalog.ts.
 * All screens can use ONLY the combined approved catalog.
 * Reference: https://ui.shadcn.com/docs/components ; migration in docs/architecture.md
 */
const obj = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict();
const optionalText = z.string().nullable();
const gap = z.enum(["sm", "md", "lg"]);
const internalHref = z.string().regex(/^(\/(?!\/)[a-zA-Z0-9/_?&=.%#-]*|\?screen=[a-z0-9-]+|#[a-z0-9-]+)$/);
const fields = z.array(obj({ type: z.string(), message: z.string(), args: z.record(z.string(), z.unknown()).optional() })).nullable();

// ReUI menu patterns reuse strictly typed, single-level entries; no executable callbacks.
const menuLeaf = obj({label:z.string().max(120),value:z.string().max(80),disabled:z.boolean().optional(),variant:z.enum(["default","destructive"]).optional(),shortcut:z.string().max(24).optional()});
const menuEntry = z.union([
  menuLeaf,
  obj({type:z.literal("separator"),value:z.string().max(80)}),
  obj({type:z.literal("label"),value:z.string().max(80),label:z.string().max(120)}),
  obj({type:z.literal("checkbox"),value:z.string().max(80),label:z.string().max(120),defaultChecked:z.boolean().optional(),disabled:z.boolean().optional()}),
  obj({type:z.literal("submenu"),value:z.string().max(80),label:z.string().max(120),items:z.array(menuLeaf).min(1).max(12)}),
]);

export const playgroundDefinitions = {
  // LAYOUT
  Card: { props: obj({title:optionalText,description:optionalText,footer:z.string().max(280).optional(),size:z.enum(["default","sm"]).optional(),maxWidth:z.enum(["sm","md","lg","full"]).optional(),centered:z.boolean().optional()}),slots:["default"],description:"Card ReUI: cabeçalho, descrição, conteúdo em slot, rodapé textual, tamanho e largura; layouts e ações ricas são composições." },
  Stack: { props: obj({ direction: z.enum(["horizontal","vertical"]).optional(), gap: z.enum(["none","sm","md","lg"]).optional(), align: z.enum(["start","center","end","stretch"]).optional(), justify: z.enum(["start","center","end","between","around"]).optional() }), slots: ["default"], description: "Primitiva de composição Tailwind; shadcn/ui não fornece um Stack público." },
  Grid: { props: obj({ columns: z.number().int().min(1).max(6).optional(), gap: gap.optional() }), slots: ["default"], description: "Composição de grid responsivo via Tailwind (sem componente shadcn oficial)." },
  Separator: { props: obj({orientation:z.enum(["horizontal","vertical"]).optional(),decorative:z.boolean().optional(),label:z.string().max(80).optional()}),description:"Separator ReUI: orientação e rótulo horizontal textual centralizado; layouts ao redor usam composição." },
  Tabs: { props: obj({ tabs: z.array(obj({label:z.string(),value:z.string(),disabled:z.boolean().optional(),content:z.string().max(3000).optional()})), value:optionalText,defaultValue:optionalText,orientation:z.enum(["horizontal","vertical"]).optional(),disabled:z.boolean().optional(),listVariant:z.enum(["default","line"]).optional(),fullWidth:z.boolean().optional() }), events:["change"], description:"Tabs ReUI: orientação, aba individual desabilitada, navegação padrão ou sublinhada, largura integral e painel de texto sem JSX livre." },
  Accordion: { props: obj({ items: z.array(obj({title:z.string(),content:z.string(),value:z.string().max(80).optional(),disabled:z.boolean().optional()})), type: z.enum(["single","multiple"]).optional(), collapsible: z.boolean().optional(), defaultValue: optionalText, defaultValues:z.array(z.string().max(80)).max(30).optional(), indicator:z.enum(["chevron","plus-minus","arrow-left"]).optional(), appearance:z.enum(["plain","bordered","highlighted"]).optional() }), description: "Accordion Base UI: itens com identificador estável e disabled; modos single/multiple, collapsible, defaultValue/defaultValues, indicadores chevron/plus-minus/arrow-left e estilos plain/bordered/highlighted. Conteúdo aninhado e avatares devem usar composição aprovada." },
  Collapsible: { props: obj({ title: z.string(), open: z.boolean().nullable().optional(), defaultOpen: z.boolean().optional(), disabled: z.boolean().optional() }), slots: ["default"], events: ["openChange"], description: "shadcn Collapsible: open, defaultOpen, disabled, evento openChange; título serializado como trigger." },
  Dialog: { props: obj({ title: z.string(), description: optionalText, open: z.boolean().nullable().optional(), defaultOpen: z.boolean().optional() }), slots: ["default"], events: ["openChange"], description: "shadcn Dialog: open/defaultOpen; slots default para DialogContent. Abertura controlável por $bindState em open." },
  Drawer: { props: obj({ title: z.string(), description: optionalText, open: z.boolean().nullable().optional(), defaultOpen: z.boolean().optional(), swipeDirection: z.enum(["up","down","left","right"]).optional() }), slots: ["default"], events: ["openChange"], description: "shadcn Drawer Base UI: open/defaultOpen/swipeDirection; conteúdo serializado em slot." },
  Carousel: { props: obj({ items:z.array(obj({title:optionalText,description:optionalText})).max(50), orientation:z.enum(["horizontal","vertical"]).optional(), loop:z.boolean().optional(), showArrows:z.boolean().optional(), showIndicators:z.boolean().optional(), slidesPerView:z.union([z.literal(1),z.literal(2),z.literal(3)]).optional(), ariaLabel:z.string().min(1).max(120).optional() }), description:"shadcn Carousel: orientação, loop, setas, indicadores e densidade responsiva 1/2/3; conteúdo permanece texto local (sem URL de mídia ou autoplay)." },
  // DATA DISPLAY
  Table: { props: obj({columns:z.array(z.string()),rows:z.array(z.array(z.string())),caption:optionalText,emptyMessage:z.string().max(180).optional(),striped:z.boolean().optional(),compact:z.boolean().optional()}),description:"Table ReUI: tabela textual acessível, vazio, listras e densidade; edição, seleção e filtros exigem DataTable aprovado." },
  Heading: { props: obj({ text: z.string(), level: z.enum(["h1","h2","h3","h4"]).optional() }), description: "HTML semântico + Tailwind; shadcn não fornece Heading oficial." },
  Text: { props: obj({ text: z.string(), variant: z.enum(["body","caption","muted","lead","code"]).optional() }), description: "Texto semântico + Tailwind; shadcn não oferece Text genérico." },
  Image: { props: obj({ alt: z.string(), width: z.number().int().min(20).max(1600).optional(), height: z.number().int().min(20).max(1000).optional() }), description: "Placeholder local acessível; shadcn não fornece Image genérico." },
  Icon: { props: obj({ name: z.enum(["MapPin","Mail","Globe","Calendar","Star","Heart","Check","X","ArrowRight","Phone","Building","Clock","Shield","Zap","Users","Eye","Download","Upload","Search","Filter","Settings","Bell","ChevronRight","ExternalLink","Info","AlertTriangle","CheckCircle","XCircle"]), size: z.enum(["sm","md","lg"]).optional(), color: z.enum(["default","muted","primary","success","warning","danger"]).optional() }), description: "Ícones Lucide com lista fechada; não existe componente genérico de Icon no shadcn." },
  Avatar: { props: obj({src:optionalText,name:z.string(),size:z.enum(["sm","md","lg"]).optional(),status:z.enum(["online","away","busy","offline"]).optional(),shape:z.enum(["circle","square"]).optional(),statusPosition:z.enum(["bottom-right","bottom-left","top-right","top-left"]).optional()}),description:"Avatar ReUI: fallback, dimensões, formato e indicador de presença posicionado; fontes externas não são aceitas." },
  Badge: { props: obj({label:z.string(),variant:z.enum(["default","secondary","destructive","outline"]).optional(),tone:z.enum(["neutral","success","info","warning","error"]).optional(),appearance:z.enum(["solid","soft","outline"]).optional(),size:z.enum(["sm","md","lg"]).optional(),dot:z.boolean().optional()}), description:"Badge shadcn com tokens de estados ReUI, aparência sólida/suave/contorno, tamanho e ponto decorativo; sem ações automáticas." },
  Alert: { props: obj({title:z.string().optional(),description:optionalText,variant:z.enum(["default","destructive"]).optional(),tone:z.enum(["info","success","warning","error"]).optional(),dismissible:z.boolean().optional(),showIcon:z.boolean().optional()}),description:"Alert ReUI: título opcional, tom de estado, ícone facultativo e fechamento local sem ações externas." },
  Progress: { props: obj({value:z.number().min(0).max(100),max:z.number().positive().optional(),label:optionalText,tone:z.enum(["default","success","info","warning","error"]).optional(),showValue:z.boolean().optional()}),description:"Progress ReUI: progresso determinístico, tom de estado e valor exibido opcional; animações temporizadas são composição." },
  Skeleton: { props: obj({width:optionalText,height:optionalText,rounded:z.boolean().optional(),shape:z.enum(["rectangle","circle","square"]).optional(),lines:z.number().int().min(1).max(5).optional()}),description:"Skeleton ReUI: placeholder de dimensão declarada, forma e quantidade limitada de linhas; templates usam composições." },
  Spinner: { props: obj({size:z.enum(["sm","md","lg"]).optional(),label:optionalText,tone:z.enum(["default","success","info","warning","error"]).optional(),hideLabel:z.boolean().optional()}),description:"Spinner ReUI: tamanhos e tons definidos, texto acessível visível ou somente para leitor de tela; overlays são composição." },
  Tooltip: { props: obj({content:z.string(),text:z.string(),side:z.enum(["top","bottom","left","right"]).optional(),triggerIcon:z.enum(["Info","Search","Bell","Settings","Check"]).optional(),shortcut:z.string().max(20).optional()}),description:"Tooltip ReUI: gatilho textual com ícone permitido, posicionamento e atalho textual; conteúdo rico de cartões exige composição." },
  Popover: { props: obj({ trigger: z.string(), content: z.string(), side: z.enum(["top","bottom","left","right"]).optional(), align: z.enum(["start","center","end"]).optional(), open: z.boolean().nullable().optional(), defaultOpen: z.boolean().optional() }), events: ["openChange"], description: "shadcn Popover: open/defaultOpen, side/align; trigger/content são subcomponentes serializados." },
  Rating: { props: obj({value:z.number().min(0).max(10),max:z.number().int().min(1).max(10).optional(),label:optionalText,interactive:z.boolean().optional(),step:z.union([z.literal(0.5),z.literal(1)]).optional(),showValue:z.boolean().optional()}),events:["change"],description:"Rating ReUI: renderização de frações e seleção por estrelas inteiras ou meia estrela; submissão de revisão exige contrato próprio." },
  Metric: { props: obj({ label: z.string(), value: z.string(), change: optionalText, changeType: z.enum(["positive","negative","neutral"]).optional(), prefix: optionalText, suffix: optionalText }), description: "KPI de dashboard composto com Card/Text/Tailwind; sem API shadcn nativa." },
  // CHARTS
  BarGraph: { props: obj({ title: optionalText, data: z.array(obj({label:z.string(),value:z.number()})).min(1).max(24) }), description: "Preset de gráfico; shadcn Chart é composição ChartContainer + Recharts, não tem API BarGraph nativa." },
  LineGraph: { props: obj({ title: optionalText, data: z.array(obj({label:z.string(),value:z.number()})).min(1).max(24) }), description: "Preset de gráfico; shadcn Chart é composição ChartContainer + Recharts, não tem API LineGraph nativa." },
  // FORMS
  Input: { props: obj({label:z.string(),name:z.string(),type:z.enum(["text","email","password","number","search","tel","url"]).optional(),placeholder:optionalText,value:optionalText,disabled:z.boolean().optional(),required:z.boolean().optional(),readOnly:z.boolean().optional(),description:z.string().max(300).optional(),invalid:z.boolean().optional(),maxLength:z.number().int().min(1).max(10000).optional(),checks:fields.optional()}),events:["submit","focus","blur","change"],description:"Input ReUI: tipo, ajuda, aria-invalid, comprimento máximo, required/disabled/readOnly e campo acessível com estado." },
  Textarea: { props: obj({label:z.string(),name:z.string(),placeholder:optionalText,rows:z.number().int().min(2).max(15).optional(),value:optionalText,disabled:z.boolean().optional(),required:z.boolean().optional(),readOnly:z.boolean().optional(),description:z.string().max(300).optional(),invalid:z.boolean().optional(),maxLength:z.number().int().min(1).max(10000).optional(),checks:fields.optional()}),events:["change"],description:"Textarea ReUI: ajuda, invalidação acessível, limite de entrada e estados; contador ao vivo permanece em CharacterCountTextarea." },
  Select: { props: obj({label:z.string(),name:z.string(),options:z.array(z.union([z.string(),obj({label:z.string(),value:z.string(),disabled:z.boolean().optional(),description:z.string().max(150).optional()})])),groups:z.array(obj({label:z.string(),options:z.array(obj({label:z.string(),value:z.string(),disabled:z.boolean().optional(),description:z.string().max(150).optional()})).min(1)})).max(12).optional(),placeholder:optionalText,value:optionalText,defaultValue:optionalText,disabled:z.boolean().optional(),required:z.boolean().optional(),checks:fields.optional()}),events:["change"],description:"Select ReUI: lista simples ou grupos rotulados, detalhes textuais por opção e seleção controlada; opções multimídia continuam composição." },
  Checkbox: { props: obj({label:z.string(),name:z.string(),checked:z.boolean().nullable().optional(),defaultChecked:z.boolean().optional(),disabled:z.boolean().optional(),required:z.boolean().optional(),description:z.string().max(300).optional(),invalid:z.boolean().optional()}),events:["change"],description:"Checkbox ReUI: controle local marcado/desmarcado, disabled, required, ajuda e aria-invalid; grupos são composições." },
  Radio: { props: obj({label:z.string(),name:z.string(),options:z.array(z.union([z.string(),obj({label:z.string(),value:z.string(),disabled:z.boolean().optional(),description:z.string().max(200).optional()})])),value:optionalText,defaultValue:optionalText,disabled:z.boolean().optional(),required:z.boolean().optional(),orientation:z.enum(["horizontal","vertical"]).optional()}),events:["change"],description:"RadioGroup ReUI: opções com descrição, orientação e valor controlado; cartões de pagamento permanecem composição." },
  Switch: { props: obj({label:z.string(),name:z.string(),checked:z.boolean().nullable().optional(),defaultChecked:z.boolean().optional(),disabled:z.boolean().optional(),required:z.boolean().optional(),size:z.enum(["sm","default"]).optional(),description:z.string().max(300).optional()}),events:["change"],description:"Switch ReUI: controles sm/default, descrição acessível e estado controlado." },
  Slider: { props: obj({label:optionalText,min:z.number().optional(),max:z.number().optional(),step:z.number().positive().optional(),value:z.number().nullable().optional(),defaultValue:z.number().optional(),values:z.array(z.number()).min(1).max(3).optional(),defaultValues:z.array(z.number()).min(1).max(3).optional(),disabled:z.boolean().optional(),orientation:z.enum(["horizontal","vertical"]).optional(),showValue:z.boolean().optional()}),events:["change"],description:"Slider ReUI: um a três polegares com valor escalar legado ou values/defaultValues, orientação, passo e legenda de valores; gradientes e controles adicionais exigem composição." },
  // ACTIONS
  Button: { props: obj({ label:z.string(), variant:z.enum(["default","secondary","outline","ghost","destructive","link"]).optional(), size:z.enum(["default","xs","sm","lg","icon","icon-xs","icon-sm","icon-lg"]).optional(), disabled:z.boolean().optional(), type:z.enum(["button","submit","reset"]).optional(), icon:z.enum(["Search","Plus","Minus","Check","X","ArrowRight","ArrowLeft","Copy","Download","Upload","Bell","Heart","Star","Settings","Mail","Github","Menu","Sun","Moon","LoaderCircle","ExternalLink"]).optional(), iconPosition:z.enum(["start","end"]).optional(), loading:z.boolean().optional(), invalid:z.boolean().optional(), fullWidth:z.boolean().optional(), count:z.number().int().min(0).max(9999).optional(), badge:z.string().max(24).optional(), ariaLabel:z.string().max(100).optional() }), events:["press"], description: "shadcn Button: estilos e tamanhos oficiais, estado loading/invalid, ícones de allowlist, contador, badge e largura opcional. Composições complexas (redes sociais, copiar, menu, mudança de tema) usam blocos aprovados e não JSX livre." },
  Link: { props: obj({ label:z.string(), href:internalHref, variant:z.enum(["link","ghost","outline"]).optional() }), events:["press"], description: "Link interno como âncora semântica com estilos do shadcn buttonVariants, sem ação remota." },
  DropdownMenu: { props: obj({ label:z.string(), items:z.array(menuEntry).max(40), disabled:z.boolean().optional(), align:z.enum(["start","center","end"]).optional(), side:z.enum(["top","bottom","left","right"]).optional() }), events:["select"], description:"shadcn DropdownMenu: itens, rótulos, separadores, checkbox local e submenu de apenas um nível; ações mantêm o evento select autorizado." },
  Toggle: { props: obj({label:z.string(),pressed:z.boolean().nullable().optional(),defaultPressed:z.boolean().optional(),variant:z.enum(["default","outline"]).optional(),size:z.enum(["default","sm","lg"]).optional(),disabled:z.boolean().optional(),icon:z.enum(["Star","Heart","Check","X","Bell","Settings","Sun","Moon"]).optional()}),events:["change"],description:"Toggle ReUI: estado pressionado, tamanho, variante e ícone permitido; tooltips e contadores são composições." },
  ToggleGroup: { props: obj({items:z.array(obj({label:z.string(),value:z.string(),disabled:z.boolean().optional(),icon:z.enum(["Sun","Moon","Search","Settings","Bell","Check","X","Star","Heart"]).optional()})),type:z.enum(["single","multiple"]).optional(),value:z.union([z.string(),z.array(z.string())]).nullable().optional(),defaultValue:z.union([z.string(),z.array(z.string())]).nullable().optional(),variant:z.enum(["default","outline"]).optional(),size:z.enum(["default","sm","lg"]).optional(),orientation:z.enum(["horizontal","vertical"]).optional(),disabled:z.boolean().optional()}),events:["change"],description:"ToggleGroup ReUI: seleção única/múltipla, opções individualmente desabilitadas, ícones permitidos e orientação." },
  ButtonGroup: { props: obj({buttons:z.array(obj({label:z.string(),value:z.string(),disabled:z.boolean().optional(),icon:z.enum(["Search","Check","X","Plus","Minus","Settings","Star","Heart"]).optional()})),orientation:z.enum(["horizontal","vertical"]).optional(),selected:optionalText,variant:z.enum(["default","secondary","outline","ghost"]).optional(),size:z.enum(["default","xs","sm","lg"]).optional()}),events:["change"],description:"ButtonGroup ReUI: orientação, seleção local, ícones permitidos e variantes/tamanhos uniformes; campo, menu e split-action são composição." },
  Pagination: { props: obj({ totalPages:z.number().int().min(1), page:z.number().int().min(1).optional(), siblingCount:z.number().int().min(0).max(3).optional(), showFirstLast:z.boolean().optional(), showGoTo:z.boolean().optional(), totalItems:z.number().int().min(0).optional(), pageSize:z.number().int().min(1).max(1000).optional(), pageSizeOptions:z.array(z.number().int().min(1).max(1000)).min(1).max(8).optional(), showPageSize:z.boolean().optional() }), events:["change","pageSizeChange"], description:"shadcn Pagination: janela com siblingCount e reticências, primeira/última, salto por número e tamanho da página local quando totalItems é informado." },
};

/** Approved catalog = untouched Playground baseline + reviewed extensions. */
export const componentDefinitions = {
  ...playgroundDefinitions,
  ...extensionDefinitions,
};

/** Event and slot policy only; props are checked separately through Zod. */
export const componentEventDescriptors: Record<string,{events?:string[];slots?:string[]}> =
  Object.fromEntries(Object.entries(componentDefinitions).map(([name,definition])=>[name,{
    ...('events' in definition && Array.isArray(definition.events) ? {events: definition.events} : {}),
    ...('slots' in definition && Array.isArray(definition.slots) ? {slots: definition.slots} : {}),
  }]));

export const actionDefinitions = {
  setState: { params: obj({statePath:z.string(),value:z.unknown()}),description:"Atualiza um caminho no estado." },
  pushState: { params: obj({statePath:z.string(),value:z.unknown(),clearStatePath:z.string().optional()}),description:"Insere item em uma lista do estado." },
  removeState: { params: obj({statePath:z.string(),index:z.number().int().min(0)}),description:"Remove item de uma lista do estado." },
  buttonClick: { params: obj({message:optionalText}),description:"Feedback de clique, sem efeitos remotos." },
  formSubmit: { params: obj({formName:optionalText}),description:"Confirmação local; não envia dados." },
  linkClick: { params: obj({href:internalHref}),description:"Feedback de navegação interna." },
};

const baseCatalog = defineCatalog(schema, { components: componentDefinitions, actions: actionDefinitions });
/** The json-render structural validator does not enforce every component's Zod props.
 * Enforce closed component contracts before rendering or accepting Pi output.
 */
const validateStructure = baseCatalog.validate.bind(baseCatalog);
export const catalog = baseCatalog;
Object.defineProperty(catalog, 'validate', {
  value(input: unknown) {
    const checked = validateStructure(input);
    const issues: z.core.$ZodIssue[] = checked.success ? [] : (checked.error?.issues?.length ? [...checked.error.issues] : [{code:'custom',path:[],message:'Especificação estrutural inválida'}]);
    // Inspect existing nodes even when the structural schema rejects the document.
    // Otherwise a missing children array could mask malicious or unknown props.
    const candidate = checked.success ? checked.data : input;
    const elements = candidate && typeof candidate === 'object' && 'elements' in candidate
      ? (candidate as {elements?: unknown}).elements : undefined;
    const definitions = componentDefinitions as Record<string,{props:z.ZodType}>;
    if (elements && typeof elements === 'object' && !Array.isArray(elements)) {
      for (const [id, raw] of Object.entries(elements)) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
        const element = raw as {type?:string;props?:unknown};
        const definition = element.type ? definitions[element.type] : undefined;
        if (!definition) continue; // Unknown components are rejected structurally.
        const props = definition.props.safeParse(element.props ?? {});
        if (!props.success) for (const issue of props.error.issues) {
          issues.push({...issue,path:['elements',id,'props',...issue.path]});
        }
      }
    }
    return issues.length ? {success:false as const,error:new z.ZodError(issues)} : checked;
  },
});
