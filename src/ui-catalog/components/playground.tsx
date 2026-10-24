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
import { Tabs as ShadcnTabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion as ShadcnAccordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Collapsible as ShadcnCollapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Dialog as ShadcnDialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer as ShadcnDrawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { TooltipProvider, Tooltip as ShadcnTooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover as ShadcnPopover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select as ShadcnSelect, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RadioGroup as ShadcnRadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DropdownMenu as ShadcnDropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Toggle as ShadcnToggle } from "@/components/ui/toggle";
import { ToggleGroup as ShadcnToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ButtonGroup as ShadcnButtonGroup } from "@/components/ui/button-group";
import { Carousel as ShadcnCarousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Table as ShadcnTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
/* eslint-disable @typescript-eslint/no-explicit-any -- json-render validates props using strict Zod schemas before rendering. */
import { useId, useState, type ReactNode, type CSSProperties } from "react";
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

export const playgroundImplementations = {
  Card: ({props,children}) => <ShadcnCard size={props.size??"default"} className={`pg-card--${props.maxWidth??"full"} ${props.centered?"mx-auto":""}`}>
    {(props.title||props.description) && <CardHeader>{props.title && <CardTitle>{props.title}</CardTitle>}{props.description && <CardDescription>{props.description}</CardDescription>}</CardHeader>}
    <CardContent className="flex flex-col gap-4">{children}</CardContent>
  </ShadcnCard>,
  Stack: ({props,children}) => <div className={`pg-stack pg-stack--${props.direction??"vertical"} pg-gap--${props.gap??"md"} pg-align--${props.align??"stretch"} pg-justify--${props.justify??"start"}`}>{children}</div>,
  Grid: ({props,children}) => <div className="pg-grid" style={{"--columns":clamp(props.columns??1,1,6),"--gap":props.gap==="lg"?"24px":props.gap==="sm"?"10px":"16px"} as CSSProperties}>{children}</div>,
  Separator: ({props})=><ShadcnSeparator orientation={props.orientation??"horizontal"} aria-hidden={props.decorative!==false}/>,
  Tabs: ({props,bindings,emit})=>{ const items=props.tabs??[]; const [current,setCurrent]=useValue<string>(props.value??props.defaultValue??items[0]?.value??"",bindings?.value);return <ShadcnTabs value={current} orientation={props.orientation??"horizontal"} onValueChange={(v:string)=>{setCurrent(v);notify(emit,"change");}}><TabsList>{items.map((item:any)=><TabsTrigger key={item.value} value={item.value} disabled={props.disabled}>{item.label}</TabsTrigger>)}</TabsList></ShadcnTabs>;},
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
  Carousel: ({props}) => <div className="w-full min-w-0 max-w-full overflow-hidden" data-testid="safe-carousel">
    <ShadcnCarousel orientation={props.orientation??"horizontal"} className="w-full min-w-0 max-w-full" aria-label="Carrossel de componentes">
      <CarouselContent>{(props.items??[]).map((item:any,i:number)=><CarouselItem key={i} className={props.orientation==="vertical"?"basis-full":"basis-full sm:basis-3/4 lg:basis-1/2"}>
        <ShadcnCard className="h-full min-w-0"><CardHeader>{item.title&&<CardTitle>{item.title}</CardTitle>}{item.description&&<CardDescription>{item.description}</CardDescription>}</CardHeader></ShadcnCard>
      </CarouselItem>)}</CarouselContent>
      <div className="mt-4 flex items-center justify-end gap-2 px-1" role="group" aria-label="Controles do carrossel">
        <CarouselPrevious className="static inset-auto translate-x-0 translate-y-0" style={{position:"static",transform:"none",inset:"auto"}}/>
        <CarouselNext className="static inset-auto translate-x-0 translate-y-0" style={{position:"static",transform:"none",inset:"auto"}}/>
      </div>
    </ShadcnCarousel>
  </div>,
  Table: ({props})=><div className="overflow-x-auto rounded-md border border-border" ref={node=>{
    // The upstream shadcn table owns an inner horizontal scroll region. Make it
    // keyboard-focusable without modifying the integrity-checked official component.
    const region=node?.querySelector<HTMLElement>('[data-slot="table-container"]');
    if(region){region.tabIndex=0;region.setAttribute('role','region');region.setAttribute('aria-label',props.caption??'Tabela com rolagem horizontal');}
  }}><ShadcnTable>{props.caption && <caption className="sr-only">{props.caption}</caption>}<TableHeader><TableRow>{props.columns.map((c:string,i:number)=><TableHead key={i}>{c}</TableHead>)}</TableRow></TableHeader><TableBody>{props.rows.map((row:string[],i:number)=><TableRow key={i}>{props.columns.map((_:string,j:number)=><TableCell key={j}>{row[j]??""}</TableCell>)}</TableRow>)}</TableBody></ShadcnTable></div>,
  Heading: ({props})=>{const level=props.level??"h2";const className=`pg-heading pg-heading--${level}`;if(level==="h1")return <h1 className={className}>{props.text}</h1>;if(level==="h3")return <h3 className={className}>{props.text}</h3>;if(level==="h4")return <h4 className={className}>{props.text}</h4>;return <h2 className={className}>{props.text}</h2>;},
  Text: ({props})=><p className={`pg-text pg-text--${props.variant??"body"}`}>{props.text}</p>,
  Image: ({props})=><div className="pg-placeholder" role="img" aria-label={props.alt} style={{maxWidth:props.width??undefined,height:props.height??120}}><span>▧</span><small>{props.alt}</small></div>,
  Icon: ({props})=>{const Icon=lucideIcons[props.name as keyof typeof lucideIcons];return Icon?<Icon size={props.size==="lg"?24:props.size==="sm"?16:20} className={`pg-icon--${props.color??"default"}`} aria-hidden="true"/>:null;},
  Avatar: ({props})=><ShadcnAvatar className={props.size==="lg"?"size-12":props.size==="sm"?"size-8":"size-10"}><AvatarFallback aria-label={props.name}>{String(props.name).split(" ").map((x:string)=>x[0]).slice(0,2).join("").toUpperCase()}</AvatarFallback></ShadcnAvatar>,
  Badge: ({props})=><ShadcnBadge variant={props.variant??"default"}>{props.label}</ShadcnBadge>,
  Alert: ({props})=><ShadcnAlert variant={props.variant??"default"}><Info className="size-4"/><AlertTitle>{props.title}</AlertTitle>{props.description&&<AlertDescription>{props.description}</AlertDescription>}</ShadcnAlert>,
  Progress: ({props})=><div className="pg-field">{props.label&&<ShadcnLabel>{props.label}</ShadcnLabel>}<ShadcnProgress aria-label={props.label??"Progresso"} value={props.max?100*props.value/props.max:props.value}/><span className="pg-muted">{Math.round(props.value)} / {props.max??100}</span></div>,
  Skeleton: ({props})=><ShadcnSkeleton className={props.rounded?"rounded-full":"rounded-md"} style={{width:props.width??"100%",height:props.height??"1.3rem"}}/>,
  Spinner: ({props})=><span role="status" className="inline-flex items-center gap-2"><ShadcnSpinner className={props.size==="lg"?"size-8":props.size==="sm"?"size-4":"size-6"}/>{props.label??"Carregando"}</span>,
  Tooltip: ({props})=><TooltipProvider><ShadcnTooltip><TooltipTrigger render={<span className="cursor-help underline decoration-dotted" tabIndex={0}/>}>{props.text}</TooltipTrigger><TooltipContent side={props.side??"top"}>{props.content}</TooltipContent></ShadcnTooltip></TooltipProvider>,
  Popover: ({props,bindings,emit})=>{const [open,setOpen]=useValue(props.open??props.defaultOpen??false,bindings?.open);return <ShadcnPopover open={open} onOpenChange={(v:boolean)=>{setOpen(v);notify(emit,"openChange");}}><PopoverTrigger render={<ShadcnButton variant="outline" type="button"/>}>{props.trigger}</PopoverTrigger><PopoverContent side={props.side??"bottom"} align={props.align??"center"}>{props.content}</PopoverContent></ShadcnPopover>;},
  Rating: ({props,bindings,emit})=>{
    const max=props.max??5;
    const [value,setValue]=useValue(props.value??0,bindings?.value);
    const current=Math.max(0,Math.min(max,value));
    const formatted=new Intl.NumberFormat("pt-BR",{maximumFractionDigits:2}).format(current);
    return <div className="pg-rating" role="group" aria-label={props.label??"Avaliação"}>
      {props.label&&<strong>{props.label}</strong>}
      <span className="sr-only">{"Nota "+formatted+" de "+max+" estrelas"}</span>
      {Array.from({length:max},(_,i)=>{
        const fill=ratingStarFillPercent(current,i,max);
        const glyph=<span aria-hidden="true" className="pg-rating-glyph" style={{backgroundImage:"linear-gradient(90deg, var(--warning) "+fill+"%, var(--muted-foreground) "+fill+"%)"}}>★</span>;
        return props.interactive === false
          ? <span key={i} className="pg-rating-static">{glyph}</span>
          : <button type="button" key={i} aria-label={(i+1)+" de "+max+" estrelas"} aria-pressed={current===i+1} onClick={()=>{setValue(i+1);notify(emit,"change");}}>{glyph}</button>;
      })}
    </div>;
  },
  Metric: ({props})=><article className="pg-metric"><span>{props.label}</span><strong>{props.prefix??""}{props.value}{props.suffix??""}</strong>{props.change&&<small className={`pg-metric--${props.changeType??"neutral"}`}>{props.change}</small>}</article>,
  BarGraph: ({props})=><Chart kind="bar" title={props.title} data={props.data}/>,
  LineGraph: ({props})=><Chart kind="line" title={props.title} data={props.data}/>,
  Input: ({props,bindings,emit})=>{const id=useId();const [value,setValue]=useValue(props.value??"",bindings?.value);return <div className="pg-field"><label htmlFor={id}>{props.label}</label><ShadcnInput id={id} name={props.name} type={props.type??"text"} required={props.required??props.checks?.some((c:any)=>c.type==="required")} disabled={props.disabled} readOnly={props.readOnly} placeholder={props.placeholder??""} value={value} onChange={e=>{setValue(e.target.value);notify(emit,"change");}} onFocus={()=>notify(emit,"focus")} onBlur={()=>notify(emit,"blur")} onKeyDown={e=>{if(e.key==="Enter")notify(emit,"submit");}}/></div>;},
  Textarea: ({props,bindings,emit})=>{const id=useId();const [value,setValue]=useValue(props.value??"",bindings?.value);return <div className="pg-field"><ShadcnLabel htmlFor={id}>{props.label}</ShadcnLabel><ShadcnTextarea id={id} name={props.name} rows={props.rows??3} disabled={props.disabled} required={props.required??props.checks?.some((c:any)=>c.type==="required")} readOnly={props.readOnly} placeholder={props.placeholder??""} value={value} onChange={e=>{setValue(e.target.value);notify(emit,"change");}}/></div>;},
  Select: ({props,bindings,emit})=>{const id=useId();const [value,setValue]=useValue(props.value??props.defaultValue??"",bindings?.value);return <div className="pg-field"><ShadcnLabel id={id}>{props.label}</ShadcnLabel><ShadcnSelect value={value} disabled={props.disabled} required={props.required} onValueChange={(v:string)=>{setValue(v);notify(emit,"change");}}><SelectTrigger aria-labelledby={id}><SelectValue placeholder={props.placeholder??"Selecione"}/></SelectTrigger><SelectContent>{props.options.map((raw:any)=>{const item=typeof raw==="string"?{label:raw,value:raw}:raw;return <SelectItem key={item.value} value={item.value} disabled={item.disabled}>{item.label}</SelectItem>})}</SelectContent></ShadcnSelect></div>;},
  Checkbox: ({props,bindings,emit})=>{const id=useId();const [checked,setChecked]=useValue(props.checked??props.defaultChecked??false,bindings?.checked);return <div className="flex items-center gap-2"><ShadcnCheckbox id={id} name={props.name} checked={checked} disabled={props.disabled} required={props.required} onCheckedChange={(v:boolean)=>{setChecked(v===true);notify(emit,"change");}}/><ShadcnLabel htmlFor={id}>{props.label}</ShadcnLabel></div>;},
  Radio: ({props,bindings,emit})=>{const [value,setValue]=useValue(props.value??props.defaultValue??"",bindings?.value);const id=useId();return <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">{props.label}</legend><ShadcnRadioGroup value={value} disabled={props.disabled} required={props.required} className={props.orientation==="horizontal"?"flex flex-row flex-wrap gap-3":"flex flex-col gap-2"} onValueChange={(v:string)=>{setValue(v);notify(emit,"change");}}>{props.options.map((raw:any,i:number)=>{const item=typeof raw==="string"?{label:raw,value:raw}:raw;return <div key={item.value} className="flex items-center gap-2"><RadioGroupItem id={`${id}-${i}`} value={item.value} disabled={item.disabled}/><ShadcnLabel htmlFor={`${id}-${i}`}>{item.label}</ShadcnLabel></div>})}</ShadcnRadioGroup></fieldset>;},
  Switch: ({props,bindings,emit})=>{const id=useId();const [checked,setChecked]=useValue(props.checked??props.defaultChecked??false,bindings?.checked);return <div className="flex items-center gap-2"><ShadcnSwitch id={id} name={props.name} checked={checked} disabled={props.disabled} required={props.required} onCheckedChange={(v:boolean)=>{setChecked(v===true);notify(emit,"change");}}/><ShadcnLabel htmlFor={id}>{props.label}</ShadcnLabel></div>;},
  Slider: ({props,bindings,emit})=>{const [value,setValue]=useValue(props.value??props.defaultValue??props.min??0,bindings?.value);return <div className="pg-field"><label>{props.label??"Valor"}: {value}<ShadcnSlider aria-label={props.label??"Valor"} min={props.min??0} max={props.max??100} step={props.step??1} orientation={props.orientation??"horizontal"} disabled={props.disabled} value={[value]} onValueChange={(v:number | readonly number[])=>{setValue(typeof v==="number"?v:(v[0]??0));notify(emit,"change");}}/></label></div>;},
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
  DropdownMenu: ({props,emit})=><ShadcnDropdownMenu><DropdownMenuTrigger render={<ShadcnButton type="button" variant="outline" disabled={props.disabled}/>}>{props.label}<ChevronDown className="size-4"/></DropdownMenuTrigger><DropdownMenuContent side={props.side??"bottom"} align={props.align??"start"}>{props.items.map((item:any)=><DropdownMenuItem key={item.value} disabled={item.disabled} onClick={()=>notify(emit,"select")}>{item.label}</DropdownMenuItem>)}</DropdownMenuContent></ShadcnDropdownMenu>,
  Toggle: ({props,bindings,emit})=>{const [value,setValue]=useValue(props.pressed??props.defaultPressed??false,bindings?.pressed);return <ShadcnToggle variant={props.variant??"default"} size={props.size??"default"} disabled={props.disabled} pressed={value} onPressedChange={(v:boolean)=>{setValue(v);notify(emit,"change");}}>{props.label}</ShadcnToggle>;},
  ToggleGroup: ({props,bindings,emit})=>{
    const initial=props.value??props.defaultValue??"";
    const [value,setValue]=useValue<string|string[]>(initial,bindings?.value);
    const selected=Array.isArray(value)?value:(value?[value]:[]);
    const parts=props.items.map((item:any)=><ToggleGroupItem key={item.value} value={item.value}>{item.label}</ToggleGroupItem>);
    const change=(next:string[])=>{
      setValue(props.type==="multiple"?next:(next.at(-1)??""));
      notify(emit,"change");
    };
    return <ShadcnToggleGroup variant={props.variant??"default"} size={props.size??"default"}
      value={selected} disabled={props.disabled} onValueChange={change}
      className={props.orientation==="vertical"?"flex flex-col items-stretch":"flex flex-row flex-wrap"}>
      {parts}
    </ShadcnToggleGroup>;
  },
  ButtonGroup: ({props,bindings,emit})=>{const [value,setValue]=useValue(props.selected??"",bindings?.selected);return <ShadcnButtonGroup orientation={props.orientation??"horizontal"}>{props.buttons.map((item:any)=><ShadcnButton key={item.value} type="button" disabled={item.disabled} variant={value===item.value?"default":"outline"} onClick={()=>{setValue(item.value);notify(emit,"change");}}>{item.label}</ShadcnButton>)}</ShadcnButtonGroup>;},
  Pagination: ({props,bindings,emit})=>{const [page,setPage]=useValue(props.page??1,bindings?.page);const change=(p:number)=>{setPage(p);notify(emit,"change");};return <nav className="pg-pagination" aria-label="Paginação"><button aria-label="Anterior" disabled={page<=1} onClick={()=>change(page-1)}><ChevronLeft size={15}/></button>{Array.from({length:Math.min(props.totalPages,30)},(_,i)=><button key={i} aria-current={page===i+1?"page":undefined} onClick={()=>change(i+1)}>{i+1}</button>)}<button aria-label="Próximo" disabled={page>=props.totalPages} onClick={()=>change(page+1)}><ChevronRight size={15}/></button></nav>;},
} satisfies Record<string,(args:ComponentArgs)=>ReactNode>;
