import type {ReactNode,HTMLAttributes} from 'react';
import {Plus,Minus,ArrowUpRight,Settings,Lock,CircleHelp,ChevronRight,CircleCheck,QrCode} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import {cn} from 'cn';

/** Thin local adapters for visual parity with the ReUI examples.
 * Source: https://github.com/keenthemes/reui/tree/main/registry-reui/bases/base/components/accordion
 * No arbitrary icons, remote scripts or external dependencies.
 */
const icons:Record<string,LucideIcon>={
 PlusIcon:Plus,MinusIcon:Minus,ArrowUpRightIcon:ArrowUpRight,SettingsIcon:Settings,
 LockIcon:Lock,HelpCircleIcon:CircleHelp,ChevronRightIcon:ChevronRight,
 CircleCheckIcon:CircleCheck,QrCodeIcon:QrCode,
};
export function IconPlaceholder({lucide,className,strokeWidth}:{
 lucide:string; tabler?:string; hugeicons?:string; phosphor?:string; remixicon?:string;
 className?:string;strokeWidth?:number;
}){
 const Icon=icons[lucide]??CircleHelp;
 return <Icon aria-hidden="true" strokeWidth={strokeWidth} className={className}/>;
}
export function Frame({children,stacked,spacing='sm',variant='default',dense=false,className,...props}:{children:ReactNode;stacked?:boolean;dense?:boolean;spacing?:'xs'|'sm'|'md';variant?:'default'|'ghost';className?:string}&HTMLAttributes<HTMLDivElement>){
 return <div className={cn("grid w-full",spacing==='xs'?'gap-1':spacing==='sm'?'gap-2':'gap-3',stacked&&'rounded-lg',dense&&'gap-1',variant==='ghost'&&'bg-transparent',className)} data-reui-frame {...props}>{children}</div>;
}
export function FramePanel({children,className,...props}:HTMLAttributes<HTMLDivElement>){
 return <div data-reui-frame-panel className={cn("min-w-0 rounded-xl border bg-card p-3",className)} {...props}>{children}</div>;
}

/** Estruturas visuais utilizadas por composições ReUI; nenhuma é um nó JSON. */
export function FrameHeader({className,...props}:HTMLAttributes<HTMLDivElement>){return <div className={cn("flex items-center justify-between gap-2 px-1",className)} {...props}/>}
export function FrameTitle({className,...props}:HTMLAttributes<HTMLHeadingElement>){return <h3 className={cn("text-sm font-semibold",className)} {...props}/>}

/** Descrição visual das composições ReUI. Não pertence ao contrato JSON. */
export function FrameDescription({className,...props}:HTMLAttributes<HTMLParagraphElement>){return <p className={cn("text-sm text-muted-foreground",className)} {...props}/>}
