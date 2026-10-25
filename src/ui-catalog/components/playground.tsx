import { Button as ShadcnButton, buttonVariants } from "@/components/ui/button";
import { Separator as ShadcnSeparator } from "@/components/ui/separator";
import { Alert as ShadcnAlert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress as ShadcnProgress } from "@/components/ui/progress";
import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton";
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea";
import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox";
import { Switch as ShadcnSwitch } from "@/components/ui/switch";
import { Slider as ShadcnSlider } from "@/components/ui/slider";
import { Label as ShadcnLabel } from "@/components/ui/label";
import { Avatar as ShadcnAvatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner as ShadcnSpinner } from "@/components/ui/spinner";
import { Tabs as ShadcnTabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion as ShadcnAccordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Collapsible as ShadcnCollapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Dialog as ShadcnDialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer as ShadcnDrawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { TooltipProvider, Tooltip as ShadcnTooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover as ShadcnPopover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select as ShadcnSelect, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { RadioGroup as ShadcnRadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DropdownMenu as ShadcnDropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuShortcut } from "@/components/ui/dropdown-menu";
import { Toggle as ShadcnToggle } from "@/components/ui/toggle";
import { ToggleGroup as ShadcnToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ButtonGroup as ShadcnButtonGroup } from "@/components/ui/button-group";
import { Carousel as ShadcnCarousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, useCarousel } from "@/components/ui/carousel";
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Table as ShadcnTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
/* eslint-disable @typescript-eslint/no-explicit-any -- json-render validates props using strict Zod schemas before rendering. */
import { useEffect, useId, useState, type ReactNode, type CSSProperties } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Info,
  MapPin, Mail, Globe, Calendar, Star, Heart, Check, X, ArrowRight, Phone,
  Building, Clock, Shield, Zap, Users, Eye, Download, Upload, Search,
  Filter, Settings, Bell, ExternalLink, AlertTriangle, CheckCircle, XCircle,
  Plus, Minus, Copy, Menu, Sun, Moon, Github, LoaderCircle, ArrowLeft,
} from "lucide-react";
import { useBoundProp } from "@json-render/react";
import { ratingStarFillPercent } from "@/ui-catalog/rating-fill";

const lucideIcons = { MapPin, Mail, Globe, Calendar, Star, Heart, Check, X, ArrowRight,
 Phone, Building, Clock, Shield, Zap, Users, Eye, Download, Upload, Search, Filter,
 Settings, Bell, ChevronRight, ExternalLink, Info, AlertTriangle, CheckCircle, XCircle };
type ComponentArgs = { props: any; children?: ReactNode; bindings?: any; emit?: any };
const notify = (emit: ComponentArgs["emit"], event: string) => emit?.(event);
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low,value));

function useValue<T>(initial: T, statePath?: string) {
  const [bound, setBound] = useBoundProp<T>(initial, statePath);
  const [local, setLocal] = useState(initial);
  return [statePath ? (bound ?? initial) : local, statePath ? setBound : setLocal] as const;
}
function Chart({ data, title, kind }: {data: {label:string;value:number}[];title?:string|null;kind:"bar"|"line"}) {
  const width=640, height=210, pad=26;
  const values=data.map(d=>d.value), min=Math.min(0,...values), max=Math.max(1,...values);
  const scaleY=(v:number)=>height-pad-(v-min)/(max-min||1)*(height-2*pad);
  const points=data.map((item,i)=>({ x: pad+(data.length===1?.5:i/(data.length-1))*(width-2*pad),y:scaleY(item.value),...item }));
  return <figure className="pg-graph">
    {title && <figcaption className="pg-graph-title">{title}</figcaption>}
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${kind==="bar"?"Gráfico de barras":"Gráfico de linhas"}: ${data.map(d=>`${d.label} ${d.value}`).join(", ")}`} preserveAspectRatio="xMidYMid meet">
      {[0,.25,.5,.75,1].map(t=><line key={t} x1={0} y1={pad+t*(height-2*pad)} x2={width} y2={pad+t*(height-2*pad)} stroke="var(--border)" />)}
      {kind==="bar" ? points.map((p,i)=>{const barWidth=(width-2*pad)/(data.length*1.6);return <rect key={i} x={p.x-barWidth/2} y={Math.min(p.y,scaleY(0))} width={barWidth} height={Math.max(1,Math.abs(scaleY(0)-p.y))} rx={4} fill="var(--primary)"><title>{p.label}: {p.value}</title></rect>;})
      : <><polyline points={points.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round"/>{points.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--card)" stroke="var(--primary)" strokeWidth={2}><title>{p.label}: {p.value}</title></circle>)}</>}
    </svg>
    <div className="pg-chart-legend">{data.map((d,i)=><span key={i}>{d.label}</span>)}</div>
  </figure>;
}

function CarouselIndicators() {
  const {api}=useCarousel();
  const [selected,setSelected]=useState(0);
  useEffect(()=>{
    if(!api)return;
    const update=()=>setSelected(api.selectedScrollSnap());
    update();
    api.on("select",update);
    api.on("reInit",update);
    return ()=>{api.off("select",update);api.off("reInit",update);};
  },[api]);
  if(!api)return null;
  return <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Selecionar slide">
    {api.scrollSnapList().map((_,i)=><button type="button" key={i}
      onClick={()=>api.scrollTo(i)} aria-label={`Ir para slide ${i+1}`}
      aria-current={i===selected?"true":undefined}
      className={`size-2.5 rounded-full border border-primary ${i===selected?"bg-primary":"bg-transparent"}`}/>)}
  </div>;
}

export const playgroundImplementations = {
  Card: ({props,children}) => <ShadcnCard size={props.size??"default"} className={`pg-card--${props.maxWidth??"full"} ${props.centered?"mx-auto":""}`}>
    {(props.title||props.description) && <CardHeader>{props.title&&<CardTitle>{props.title}</CardTitle>}{props.description&&<CardDescription>{props.description}</CardDescription>}</CardHeader>}
    <CardContent className="flex flex-col gap-4">{children}</CardContent>
    {props.footer&&<CardFooter className="text-sm text-muted-foreground">{props.footer}</CardFooter>}
  </ShadcnCard>,
  Stack: ({props,children}) => <div className={`pg-stack pg-stack--${props.direction??"vertical"} pg-gap--${props.gap??"md"} pg-align--${props.align??"stretch"} pg-justify--${props.justify??"start"}`}>{children}</div>,
  Grid: ({props,children}) => <div className="pg-grid" style={{"--columns":clamp(props.columns??1,1,6),"--gap":props.gap==="lg"?"24px":props.gap==="sm"?"10px":"16px"} as CSSProperties}>{children}</div>,
  Separator: ({props})=>props.label&&props.orientation!=="vertical"
    ? <div className="flex items-center gap-3" role="separator" aria-label={props.label}><ShadcnSeparator aria-hidden="true"/><span className="whitespace-nowrap text-xs text-muted-foreground">{props.label}</span><ShadcnSeparator aria-hidden="true"/></div>
    : <ShadcnSeparator orientation={props.orientation??"horizontal"} aria-hidden={props.decorative!==false}/>,
  Tabs: ({props,bindings,emit})=>{const items=props.tabs??[];const [current,setCurrent]=useValue<string>(props.value??props.defaultValue??items[0]?.value??"",bindings?.value);return <ShadcnTabs value={current} orientation={props.orientation??"horizontal"} onValueChange={(v:string)=>{setCurrent(v);notify(emit,"change");}}><TabsList variant={props.listVariant??"default"} className={props.fullWidth?"w-full":undefined}>{items.map((item:any)=><TabsTrigger key={item.value} value={item.value} disabled={props.disabled||item.disabled}>{item.label}</TabsTrigger>)}</TabsList>{items.map((item:any)=><TabsContent key={item.value} value={item.value}>{item.content&&<p className="p-3 text-sm">{item.content}</p>}</TabsContent>)}</ShadcnTabs>;},
  Accordion: ({props})=>{
    const items=props.items??[];
    const isMultiple=props.type==="multiple";
    const [value,setValue]=useState<string[]>(()=>
      props.defaultValues?.length ? props.defaultValues : props.defaultValue ? [props.defaultValue] : []);
    const framed=props.appearance==="bordered";
    const highlighted=props.appearance==="highlighted";
    const indicator=props.indicator??"chevron";
    return <ShadcnAccordion multiple={isMultiple} value={value} onValueChange={(next:string[])=>{
      if(props.collapsible===false && !isMultiple && next.length===0 && value.length>0)return;
      setValue(isMultiple?next:next.slice(-1));
    }} className={framed?"w-full space-y-2":highlighted?"w-full overflow-hidden rounded-lg border":"w-full"}>
      {items.map((item:any,i:number)=>{
        const id=item.value??String(i);
        return <AccordionItem value={id} key={id} disabled={item.disabled}
          className={framed?"rounded-lg border px-3":highlighted?"px-3 data-open:bg-muted/50":"px-1"}>
          <AccordionTrigger className={indicator==="chevron"?"":"[&_[data-slot=accordion-trigger-icon]]:hidden"}>
            {indicator==="arrow-left"&&<ChevronRight aria-hidden="true" className="mr-2 size-4 shrink-0 transition-transform group-aria-expanded/accordion-trigger:rotate-90"/>}
            <span className="flex-1 text-left">{item.title}</span>
            {indicator==="plus-minus"&&<span aria-hidden="true" className="ml-auto text-muted-foreground"><span className="group-aria-expanded/accordion-trigger:hidden">+</span><span className="hidden group-aria-expanded/accordion-trigger:inline">−</span></span>}
          </AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>;
      })}
    </ShadcnAccordion>;
  },
  Collapsible: ({props,children,bindings,emit})=>{const [open,setOpen]=useValue(props.open??props.defaultOpen??false,bindings?.open);return <ShadcnCollapsible open={open} disabled={props.disabled} onOpenChange={(v:boolean)=>{setOpen(v);notify(emit,"openChange");}}><CollapsibleTrigger render={<ShadcnButton variant="outline" type="button"/>}>{props.title}<ChevronDown className="ml-2 size-4"/></CollapsibleTrigger><CollapsibleContent className="mt-2 flex flex-col gap-3">{children}</CollapsibleContent></ShadcnCollapsible>;},
  Dialog: ({props,children,bindings,emit})=>{const [open,setOpen]=useValue(props.open??props.defaultOpen??false,bindings?.open);return <ShadcnDialog open={open} onOpenChange={(v:boolean)=>{setOpen(v);notify(emit,"openChange");}}><DialogTrigger render={<ShadcnButton type="button" variant="outline"/>}>Abrir: {props.title}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>{props.title}</DialogTitle>{props.description&&<DialogDescription>{props.description}</DialogDescription>}</DialogHeader>{children}</DialogContent></ShadcnDialog>;},
  Drawer: ({props,children,bindings,emit})=>{const [open,setOpen]=useValue(props.open??props.defaultOpen??false,bindings?.open);return <ShadcnDrawer open={open} swipeDirection={props.swipeDirection??"down"} onOpenChange={(v:boolean)=>{setOpen(v);notify(emit,"openChange");}}><DrawerTrigger render={<ShadcnButton type="button" variant="outline"/>}>Abrir painel: {props.title}</DrawerTrigger><DrawerContent><DrawerHeader><DrawerTitle>{props.title}</DrawerTitle>{props.description&&<DrawerDescription>{props.description}</DrawerDescription>}</DrawerHeader><div className="p-4">{children}</div></DrawerContent></ShadcnDrawer>;},
  Carousel: ({props}) => <div className="w-full min-w-0 overflow-hidden">
    <ShadcnCarousel orientation={props.orientation??"horizontal"} opts={{loop:props.loop??false}}
      className="w-full min-w-0 max-w-full" aria-label={props.ariaLabel??"Carrossel de componentes"}>
      <CarouselContent>{(props.items??[]).map((item:any,i:number)=><CarouselItem key={i}
        className={props.orientation==="vertical"?"basis-full":props.slidesPerView===1?"basis-full":props.slidesPerView===2?"basis-full lg:basis-1/2":props.slidesPerView===3?"basis-full sm:basis-1/2 lg:basis-1/3":"basis-full sm:basis-3/4 lg:basis-1/2"}>
        <ShadcnCard className="h-full min-w-0"><CardHeader>{item.title&&<CardTitle>{item.title}</CardTitle>}{item.description&&<CardDescription>{item.description}</CardDescription>}</CardHeader></ShadcnCard>
      </CarouselItem>)}</CarouselContent>
      {(props.showArrows!==false||props.showIndicators)&&<div className="mt-4 flex items-center justify-between gap-2 px-1">
        {props.showIndicators?<CarouselIndicators/>:<span/>}
        {props.showArrows!==false&&<div className="flex items-center justify-end gap-2" role="group" aria-label="Controles do carrossel">
          <CarouselPrevious className="static inset-auto translate-x-0 translate-y-0" style={{position:"static",transform:"none",inset:"auto"}}/>
          <CarouselNext className="static inset-auto translate-x-0 translate-y-0" style={{position:"static",transform:"none",inset:"auto"}}/>
        </div>}
      </div>}
    </ShadcnCarousel>
  </div>,
  Table: ({props})=><div className="overflow-x-auto rounded-md border border-border" ref={node=>{
    const region=node?.querySelector<HTMLElement>('[data-slot="table-container"]');
    if(region){region.tabIndex=0;region.setAttribute('role','region');region.setAttribute('aria-label',props.caption??'Tabela com rolagem horizontal');}
  }}><ShadcnTable className={props.compact?"text-xs":"text-sm"}>{props.caption&&<caption className="sr-only">{props.caption}</caption>}
    <TableHeader><TableRow>{props.columns.map((c:string,i:number)=><TableHead className={props.compact?"h-8 px-2":undefined} key={i}>{c}</TableHead>)}</TableRow></TableHeader>
    <TableBody>{props.rows.length===0?<TableRow><TableCell colSpan={Math.max(1,props.columns.length)} className="text-center text-muted-foreground">{props.emptyMessage??"Nenhum registro."}</TableCell></TableRow>:
      props.rows.map((row:string[],i:number)=><TableRow className={props.striped&&i%2===1?"bg-muted/50":undefined} key={i}>{props.columns.map((_:string,j:number)=><TableCell className={props.compact?"px-2 py-1.5":undefined} key={j}>{row[j]??""}</TableCell>)}</TableRow>)}</TableBody>
  </ShadcnTable></div>,
  Heading: ({props})=>{const level=props.level??"h2";const className=`pg-heading pg-heading--${level}`;if(level==="h1")return <h1 className={className}>{props.text}</h1>;if(level==="h3")return <h3 className={className}>{props.text}</h3>;if(level==="h4")return <h4 className={className}>{props.text}</h4>;return <h2 className={className}>{props.text}</h2>;},
  Text: ({props})=><p className={`pg-text pg-text--${props.variant??"body"}`}>{props.text}</p>,
  Image: ({props})=><div className="pg-placeholder" role="img" aria-label={props.alt} style={{maxWidth:props.width??undefined,height:props.height??120}}><span>▧</span><small>{props.alt}</small></div>,
  Icon: ({props})=>{const Icon=lucideIcons[props.name as keyof typeof lucideIcons];return Icon?<Icon size={props.size==="lg"?24:props.size==="sm"?16:20} className={`pg-icon--${props.color??"default"}`} aria-hidden="true"/>:null;},
  Avatar: ({props})=>{
    const pos:Record<string,string>={"bottom-right":"bottom-0 right-0","bottom-left":"bottom-0 left-0","top-right":"top-0 right-0","top-left":"top-0 left-0"};
    const square=props.shape==="square";
    return <span className="relative inline-flex shrink-0">
      <ShadcnAvatar className={`${props.size==="lg"?"size-12":props.size==="sm"?"size-8":"size-10"} ${square?"rounded-lg":"rounded-full"}`}>
        <AvatarFallback className={square?"rounded-lg":undefined} aria-label={props.name}>{String(props.name).split(" ").map((x:string)=>x[0]).slice(0,2).join("").toUpperCase()}</AvatarFallback>
      </ShadcnAvatar>
      {props.status&&<span role="img" aria-label={`Presença: ${({online:"disponível",away:"ausente",busy:"ocupado",offline:"desconectado"} as Record<string,string>)[props.status]}`}
        className={`absolute ${pos[props.statusPosition??"bottom-right"]} size-3 rounded-full border-2 border-background ${props.status==="online"?"bg-green-600":props.status==="busy"?"bg-red-600":props.status==="away"?"bg-amber-500":"bg-muted-foreground"}`}/>}
    </span>;
  },
  Badge: ({props})=>{
    const tone:Record<string,string>={
      "success:solid":"bg-green-700 text-white border-transparent","success:soft":"border-green-700/30 bg-green-700/10 text-green-800 dark:text-green-300","success:outline":"border-green-700/50 text-green-700 dark:text-green-300",
      "info:solid":"bg-blue-700 text-white border-transparent","info:soft":"border-blue-700/30 bg-blue-700/10 text-blue-800 dark:text-blue-300","info:outline":"border-blue-700/50 text-blue-700 dark:text-blue-300",
      "warning:solid":"bg-amber-600 text-white border-transparent","warning:soft":"border-amber-600/30 bg-amber-600/10 text-amber-800 dark:text-amber-300","warning:outline":"border-amber-600/50 text-amber-700 dark:text-amber-300",
      "error:solid":"bg-destructive text-destructive-foreground border-transparent","error:soft":"border-destructive/30 bg-destructive/10 text-destructive","error:outline":"border-destructive/50 text-destructive",
      "neutral:solid":"bg-primary text-primary-foreground","neutral:soft":"bg-secondary text-secondary-foreground","neutral:outline":"border-border bg-transparent text-foreground"};
    const key=`${props.tone??"neutral"}:${props.appearance??"solid"}`;
    return <ShadcnBadge variant={props.tone||props.appearance?"outline":props.variant??"default"}
      className={`${props.tone||props.appearance?tone[key]:""} ${props.size==="sm"?"text-[10px] px-1.5":props.size==="lg"?"text-sm px-3":"text-xs"}`}>
      {props.dot&&<span aria-hidden="true" className="size-1.5 rounded-full bg-current"/>}{props.label}
    </ShadcnBadge>;
  },
  Alert: ({props})=>{
    const [visible,setVisible]=useState(true);
    if(!visible)return null;
    const ToneIcon=props.tone==="success"?CheckCircle:props.tone==="warning"?AlertTriangle:props.tone==="error"?XCircle:Info;
    return <ShadcnAlert variant={props.variant==="destructive"||props.tone==="error"?"destructive":"default"} className="relative">
      {props.showIcon!==false&&<ToneIcon className="size-4"/>}{props.title&&<AlertTitle>{props.title}</AlertTitle>}
      {props.description&&<AlertDescription>{props.description}</AlertDescription>}
      {props.dismissible&&<button type="button" aria-label="Fechar aviso" className="absolute right-2 top-2 rounded p-1 focus-visible:outline-2 focus-visible:outline-ring" onClick={()=>setVisible(false)}><X aria-hidden="true" className="size-4"/></button>}
    </ShadcnAlert>;
  },
  Progress: ({props})=>{
    const percentage=clamp(100*props.value/(props.max??100),0,100);
    const tones:Record<string,string>={success:"[&_[data-slot=progress-indicator]]:bg-green-600",warning:"[&_[data-slot=progress-indicator]]:bg-amber-600",error:"[&_[data-slot=progress-indicator]]:bg-destructive",info:"[&_[data-slot=progress-indicator]]:bg-blue-600"};
    return <div className="pg-field">{props.label&&<ShadcnLabel>{props.label}</ShadcnLabel>}<ShadcnProgress className={tones[props.tone??"default"]} aria-label={props.label??"Progresso"} value={percentage}/>{props.showValue!==false&&<span className="pg-muted">{Math.round(props.value)} / {props.max??100}</span>}</div>;
  },
  Skeleton: ({props})=>{const shape=props.shape??(props.rounded?"circle":"rectangle");return <div role="status" aria-label="Carregando conteúdo" className="flex flex-col gap-2">{Array.from({length:props.lines??1},(_,i)=><ShadcnSkeleton key={i} className={shape==="circle"?"rounded-full aspect-square":shape==="square"?"rounded-none":"rounded-md"} style={{width:props.width??"100%",height:props.height??"1.3rem"}}/>)}</div>;},
  Spinner: ({props})=>{
    const tones:Record<string,string>={success:"text-green-600",warning:"text-amber-600",error:"text-destructive",info:"text-blue-600"};
    return <span role="status" className={`inline-flex items-center gap-2 ${tones[props.tone??"default"]??""}`}><ShadcnSpinner className={props.size==="lg"?"size-8":props.size==="sm"?"size-4":"size-6"}/><span className={props.hideLabel?"sr-only":undefined}>{props.label??"Carregando"}</span></span>;
  },
  Tooltip: ({props})=>{
    const TriggerIcon=props.triggerIcon?lucideIcons[props.triggerIcon as keyof typeof lucideIcons]:null;
    return <TooltipProvider><ShadcnTooltip><TooltipTrigger render={<span className="inline-flex cursor-help items-center gap-1 underline decoration-dotted" tabIndex={0}/>}>{TriggerIcon&&<TriggerIcon aria-hidden="true" className="size-4"/>}{props.text}</TooltipTrigger><TooltipContent side={props.side??"top"}>{props.content}{props.shortcut&&<kbd className="ml-2 rounded bg-muted px-1 font-mono text-xs text-muted-foreground">{props.shortcut}</kbd>}</TooltipContent></ShadcnTooltip></TooltipProvider>;
  },
  Popover: ({props,bindings,emit})=>{const [open,setOpen]=useValue(props.open??props.defaultOpen??false,bindings?.open);return <ShadcnPopover open={open} onOpenChange={(v:boolean)=>{setOpen(v);notify(emit,"openChange");}}><PopoverTrigger render={<ShadcnButton variant="outline" type="button"/>}>{props.trigger}</PopoverTrigger><PopoverContent side={props.side??"bottom"} align={props.align??"center"}>{props.content}</PopoverContent></ShadcnPopover>;},
  Rating: ({props,bindings,emit})=>{
    const max=props.max??5;
    const [value,setValue]=useValue(props.value??0,bindings?.value);
    const current=clamp(value,0,max);
    const formatted=new Intl.NumberFormat("pt-BR",{maximumFractionDigits:2}).format(current);
    const select=(next:number)=>{setValue(next);notify(emit,"change");};
    return <div className="pg-rating" role="group" aria-label={props.label??"Avaliação"}>
      {props.label&&<strong>{props.label}</strong>}
      <span className="sr-only">{"Nota "+formatted+" de "+max+" estrelas"}</span>
      {Array.from({length:max},(_,i)=>{
        const fill=ratingStarFillPercent(current,i,max);
        const glyph=<span aria-hidden="true" className="pg-rating-glyph" style={{backgroundImage:"linear-gradient(90deg, var(--warning) "+fill+"%, var(--muted-foreground) "+fill+"%)"}}>★</span>;
        if(props.interactive===false)return <span key={i} className="pg-rating-static">{glyph}</span>;
        if(props.step===0.5)return <span key={i} className="relative inline-flex align-middle">{glyph}
          {[0.5,1].map((part,j)=><button key={j} type="button" className={`absolute inset-y-0 ${j===0?"left-0":"right-0"} w-1/2 rounded-sm focus-visible:outline-2 focus-visible:outline-ring`}
            aria-label={`${i+part} de ${max} estrelas`} aria-pressed={current===i+part} onClick={()=>select(i+part)}/>)}
        </span>;
        return <button type="button" key={i} aria-label={(i+1)+" de "+max+" estrelas"} aria-pressed={current===i+1} onClick={()=>select(i+1)}>{glyph}</button>;
      })}
      {props.showValue&&<output aria-live="polite" className="ml-2 text-sm tabular-nums">{formatted}/{max}</output>}
    </div>;
  },
  Metric: ({props})=><article className="pg-metric"><span>{props.label}</span><strong>{props.prefix??""}{props.value}{props.suffix??""}</strong>{props.change&&<small className={`pg-metric--${props.changeType??"neutral"}`}>{props.change}</small>}</article>,
  BarGraph: ({props})=><Chart kind="bar" title={props.title} data={props.data}/>,
  LineGraph: ({props})=><Chart kind="line" title={props.title} data={props.data}/>,
  Input: ({props,bindings,emit})=>{const id=useId();const [value,setValue]=useValue(props.value??"",bindings?.value);return <div className="pg-field"><label htmlFor={id}>{props.label}</label>
    <ShadcnInput id={id} name={props.name} type={props.type??"text"} required={props.required??props.checks?.some((c:any)=>c.type==="required")} disabled={props.disabled} readOnly={props.readOnly} aria-invalid={props.invalid||undefined} aria-describedby={props.description?`${id}-help`:undefined} maxLength={props.maxLength} placeholder={props.placeholder??""} value={value} onChange={e=>{setValue(e.target.value);notify(emit,"change");}} onFocus={()=>notify(emit,"focus")} onBlur={()=>notify(emit,"blur")} onKeyDown={e=>{if(e.key==="Enter")notify(emit,"submit");}}/>
    {props.description&&<p id={`${id}-help`} className="text-xs text-muted-foreground">{props.description}</p>}
  </div>;},
  Textarea: ({props,bindings,emit})=>{const id=useId();const [value,setValue]=useValue(props.value??"",bindings?.value);return <div className="pg-field"><ShadcnLabel htmlFor={id}>{props.label}</ShadcnLabel>
    <ShadcnTextarea id={id} name={props.name} rows={props.rows??3} disabled={props.disabled} required={props.required??props.checks?.some((c:any)=>c.type==="required")} readOnly={props.readOnly} aria-invalid={props.invalid||undefined} aria-describedby={props.description?`${id}-help`:undefined} maxLength={props.maxLength} placeholder={props.placeholder??""} value={value} onChange={e=>{setValue(e.target.value);notify(emit,"change");}}/>
    {props.description&&<p id={`${id}-help`} className="text-xs text-muted-foreground">{props.description}</p>}
  </div>;},
  Select: ({props,bindings,emit})=>{const id=useId();const [value,setValue]=useValue(props.value??props.defaultValue??"",bindings?.value);
    const item=(raw:any)=>{const option=typeof raw==="string"?{label:raw,value:raw}:raw;return <SelectItem key={option.value} value={option.value} disabled={option.disabled}>{option.label}{option.description&&<span className="ml-2 text-xs text-muted-foreground">{option.description}</span>}</SelectItem>};
    return <div className="pg-field"><ShadcnLabel id={id}>{props.label}</ShadcnLabel><ShadcnSelect value={value} disabled={props.disabled} required={props.required} onValueChange={(v:string)=>{setValue(v);notify(emit,"change");}}><SelectTrigger aria-labelledby={id}><SelectValue placeholder={props.placeholder??"Selecione"}/></SelectTrigger>
      <SelectContent>{props.options.map(item)}{props.groups?.map((group:any,i:number)=><SelectGroup key={group.label}><SelectLabel>{group.label}</SelectLabel>{group.options.map(item)}{i<props.groups.length-1&&<SelectSeparator/>}</SelectGroup>)}</SelectContent>
    </ShadcnSelect></div>;
  },
  Checkbox: ({props,bindings,emit})=>{const id=useId();const [checked,setChecked]=useValue(props.checked??props.defaultChecked??false,bindings?.checked);return <div className="flex items-start gap-2"><ShadcnCheckbox id={id} name={props.name} checked={checked} disabled={props.disabled} required={props.required} aria-invalid={props.invalid||undefined} aria-describedby={props.description?`${id}-help`:undefined} onCheckedChange={(v:boolean)=>{setChecked(v===true);notify(emit,"change");}}/><div className="grid gap-1"><ShadcnLabel htmlFor={id}>{props.label}</ShadcnLabel>{props.description&&<p id={`${id}-help`} className="text-xs text-muted-foreground">{props.description}</p>}</div></div>;},
  Radio: ({props,bindings,emit})=>{const [value,setValue]=useValue(props.value??props.defaultValue??"",bindings?.value);const id=useId();return <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">{props.label}</legend><ShadcnRadioGroup value={value} disabled={props.disabled} required={props.required} className={props.orientation==="horizontal"?"flex flex-row flex-wrap gap-3":"flex flex-col gap-2"} onValueChange={(v:string)=>{setValue(v);notify(emit,"change");}}>{props.options.map((raw:any,i:number)=>{const item=typeof raw==="string"?{label:raw,value:raw}:raw;return <div key={item.value} className="flex items-start gap-2"><RadioGroupItem id={`${id}-${i}`} value={item.value} disabled={item.disabled}/><div className="grid gap-1"><ShadcnLabel htmlFor={`${id}-${i}`}>{item.label}</ShadcnLabel>{item.description&&<span className="text-xs text-muted-foreground">{item.description}</span>}</div></div>})}</ShadcnRadioGroup></fieldset>;},
  Switch: ({props,bindings,emit})=>{const id=useId();const [checked,setChecked]=useValue(props.checked??props.defaultChecked??false,bindings?.checked);return <div className="flex items-start gap-2"><ShadcnSwitch id={id} name={props.name} checked={checked} size={props.size??"default"} disabled={props.disabled} required={props.required} aria-describedby={props.description?`${id}-help`:undefined} onCheckedChange={(v:boolean)=>{setChecked(v===true);notify(emit,"change");}}/><div className="grid gap-1"><ShadcnLabel htmlFor={id}>{props.label}</ShadcnLabel>{props.description&&<p id={`${id}-help`} className="text-xs text-muted-foreground">{props.description}</p>}</div></div>;},
  Slider: ({props,bindings,emit})=>{
    const initial=props.values??props.defaultValues??(props.value??props.defaultValue??props.min??0);
    const [value,setValue]=useValue<number|number[]>(initial,bindings?.value);
    const current=Array.isArray(value)?value:[value];
    return <div className="pg-field"><div className="flex items-center justify-between gap-2">
      <ShadcnLabel>{props.label??"Valor"}</ShadcnLabel>{props.showValue!==false&&<output className="text-xs tabular-nums">{current.join(" – ")}</output>}
    </div><ShadcnSlider aria-label={props.label??"Valor"} min={props.min??0} max={props.max??100} step={props.step??1} orientation={props.orientation??"horizontal"} disabled={props.disabled} value={current} onValueChange={(v:number|readonly number[])=>{const next=Array.isArray(v)?[...v]:[v as number];setValue(props.values||props.defaultValues?next:next[0]);notify(emit,"change");}}/></div>;
  },
  Button: ({props,emit})=>{
    const icons={Search,Plus,Minus,Check,X,ArrowRight,ArrowLeft,Copy,Download,Upload,Bell,Heart,Star,Settings,Mail,Github,Menu,Sun,Moon,LoaderCircle,ExternalLink};
    const Icon=icons[props.icon as keyof typeof icons];
    const glyph=Icon?<Icon aria-hidden="true" data-icon={props.iconPosition==="end"?"inline-end":"inline-start"} className="size-4"/>:null;
    const busy=props.loading??false;
    return <ShadcnButton variant={props.variant??"default"} size={props.size??"default"} type={props.type??"button"}
       aria-label={props.ariaLabel||props.label} aria-invalid={props.invalid||undefined}
       className={props.fullWidth?"w-full":undefined}
       disabled={props.disabled||busy} onClick={()=>notify(emit,"press")}>
       {busy?<LoaderCircle aria-hidden="true" className="size-4 animate-spin"/>:props.iconPosition!=="end"&&glyph}
       {props.label}
       {!busy&&props.iconPosition==="end"&&glyph}
       {typeof props.count==="number"&&<span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">{props.count}</span>}
       {props.badge&&<ShadcnBadge variant="secondary">{props.badge}</ShadcnBadge>}
    </ShadcnButton>;
  },
  Link: ({props,emit})=><a className={buttonVariants({variant:props.variant??"link",size:"sm"})} href={props.href} onClick={()=>notify(emit,"press")}>{props.label}</a>,
  DropdownMenu: ({props,emit})=>{
    const [checks,setChecks]=useState<Record<string,boolean>>({});
    const renderLeaf=(item:any)=><DropdownMenuItem key={item.value} disabled={item.disabled} variant={item.variant??"default"} onClick={()=>notify(emit,"select")}>
      {item.label}{item.shortcut&&<DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>}
    </DropdownMenuItem>;
    return <ShadcnDropdownMenu><DropdownMenuTrigger render={<ShadcnButton type="button" variant="outline" disabled={props.disabled}/>}>{props.label}<ChevronDown className="size-4"/></DropdownMenuTrigger>
      <DropdownMenuContent side={props.side??"bottom"} align={props.align??"start"}>
        {props.items.map((item:any)=>{
          if(item.type==="separator")return <DropdownMenuSeparator key={item.value}/>;
          if(item.type==="label")return <DropdownMenuLabel key={item.value}>{item.label}</DropdownMenuLabel>;
          if(item.type==="checkbox")return <DropdownMenuCheckboxItem key={item.value} disabled={item.disabled}
            checked={checks[item.value]??item.defaultChecked??false}
            onCheckedChange={(next:boolean)=>{setChecks(previous=>({...previous,[item.value]:next}));notify(emit,"select");}}>{item.label}</DropdownMenuCheckboxItem>;
          if(item.type==="submenu")return <DropdownMenuSub key={item.value}>
            <DropdownMenuSubTrigger>{item.label}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>{item.items.map(renderLeaf)}</DropdownMenuSubContent>
          </DropdownMenuSub>;
          return renderLeaf(item);
        })}
      </DropdownMenuContent>
    </ShadcnDropdownMenu>;
  },
  Toggle: ({props,bindings,emit})=>{const [value,setValue]=useValue(props.pressed??props.defaultPressed??false,bindings?.pressed);const Icon=props.icon?lucideIcons[props.icon as keyof typeof lucideIcons]:null;return <ShadcnToggle variant={props.variant??"default"} size={props.size??"default"} disabled={props.disabled} pressed={value} onPressedChange={(v:boolean)=>{setValue(v);notify(emit,"change");}}>{Icon&&<Icon aria-hidden="true" className="size-4"/>}{props.label}</ShadcnToggle>;},
  ToggleGroup: ({props,bindings,emit})=>{
    const initial=props.value??props.defaultValue??"";
    const [value,setValue]=useValue<string|string[]>(initial,bindings?.value);
    const selected=Array.isArray(value)?value:(value?[value]:[]);
    const parts=props.items.map((item:any)=>{const I=item.icon?lucideIcons[item.icon as keyof typeof lucideIcons]:null;return <ToggleGroupItem key={item.value} value={item.value} disabled={item.disabled}>{I&&<I aria-hidden="true" className="size-4"/>}{item.label}</ToggleGroupItem>});
    const change=(next:string[])=>{setValue(props.type==="multiple"?next:(next.at(-1)??""));notify(emit,"change");};
    return <ShadcnToggleGroup variant={props.variant??"default"} size={props.size??"default"} value={selected} disabled={props.disabled} onValueChange={change} className={props.orientation==="vertical"?"flex flex-col items-stretch":"flex flex-row flex-wrap"}>{parts}</ShadcnToggleGroup>;
  },
  ButtonGroup: ({props,bindings,emit})=>{const [value,setValue]=useValue(props.selected??"",bindings?.selected);return <ShadcnButtonGroup orientation={props.orientation??"horizontal"}>{props.buttons.map((item:any)=>{const Icon=item.icon?lucideIcons[item.icon as keyof typeof lucideIcons]:null;return <ShadcnButton key={item.value} type="button" size={props.size??"default"} disabled={item.disabled} variant={value===item.value?"default":props.variant??"outline"} onClick={()=>{setValue(item.value);notify(emit,"change");}}>{Icon&&<Icon aria-hidden="true" className="size-4"/>}{item.label}</ShadcnButton>})}</ShadcnButtonGroup>;},
  Pagination: ({props,bindings,emit})=>{
    const [page,setPage]=useValue(props.page??1,bindings?.page);
    const [size,setSize]=useState(props.pageSize??10);
    const [target,setTarget]=useState(String(props.page??1));
    const total=Math.max(1,props.totalItems==null?props.totalPages:Math.ceil(props.totalItems/size));
    const current=clamp(page,1,total),siblings=props.siblingCount??1;
    const windowPages=new Set<number>([1,total]);
    for(let p=Math.max(1,current-siblings);p<=Math.min(total,current+siblings);p++)windowPages.add(p);
    // Includes a neighbor on both ends to avoid a lone ellipsis for exactly one page.
    if(current-siblings===3)windowPages.add(2);
    if(current+siblings===total-2)windowPages.add(total-1);
    const pages=[...windowPages].sort((a,b)=>a-b);
    const change=(next:number)=>{const bounded=clamp(next,1,total);setPage(bounded);setTarget(String(bounded));notify(emit,"change");};
    return <div className="flex flex-wrap items-center gap-3">
      <nav className="pg-pagination" aria-label="Paginação">
        {props.showFirstLast&&<button type="button" aria-label="Primeira página" disabled={current===1} onClick={()=>change(1)}>«</button>}
        <button type="button" aria-label="Anterior" disabled={current<=1} onClick={()=>change(current-1)}><ChevronLeft size={15}/></button>
        {pages.map((p,i)=><span key={p} className="contents">
          {i>0&&p-pages[i-1]>1&&<span aria-hidden="true" className="px-1">…</span>}
          <button type="button" aria-label={`Página ${p}`} aria-current={current===p?"page":undefined} onClick={()=>change(p)}>{p}</button>
        </span>)}
        <button type="button" aria-label="Próximo" disabled={current>=total} onClick={()=>change(current+1)}><ChevronRight size={15}/></button>
        {props.showFirstLast&&<button type="button" aria-label="Última página" disabled={current===total} onClick={()=>change(total)}>»</button>}
      </nav>
      {props.showGoTo&&<form className="inline-flex items-center gap-1" onSubmit={(event)=>{event.preventDefault();if(target.trim()!==""){const next=Number(target);if(Number.isInteger(next))change(next);}}}>
        <label htmlFor="pg-pagination-goto" className="text-sm">Ir para</label>
        <input id="pg-pagination-goto" type="number" min={1} max={total} value={target} onChange={e=>setTarget(e.target.value)} className="w-16 rounded border bg-background px-2 py-1 text-sm"/>
        <button type="submit" className="rounded border px-2 py-1 text-sm">Ir</button>
      </form>}
      {props.showPageSize&&props.totalItems!=null&&<label className="inline-flex items-center gap-1 text-sm">Itens por página
        <select className="rounded border bg-background px-2 py-1" value={size} onChange={e=>{setSize(Number(e.target.value));setPage(1);setTarget("1");notify(emit,"pageSizeChange");}}>
          {[...new Set([...(props.pageSizeOptions??[10,20,50]),size])].sort((a,b)=>a-b).map(n=><option key={n} value={n}>{n}</option>)}
        </select>
      </label>}
    </div>;
  },
} satisfies Record<string,(args:ComponentArgs)=>ReactNode>;
