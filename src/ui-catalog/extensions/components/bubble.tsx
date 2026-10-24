import { Bubble as Root, BubbleContent } from "@/components/ui/bubble";
export type BubbleProps={text:string;variant?:"default"|"secondary"|"muted"|"tinted"|"outline"|"ghost"|"destructive";align?:"start"|"end"};
export function Bubble({props}:{props:BubbleProps}) {
 return <div className={`flex w-full ${props.align==="end"?"justify-end":"justify-start"}`}><Root variant={props.variant??"default"} align={props.align??"start"} className="max-w-[80%] rounded-xl bg-muted px-3 py-2 text-sm text-foreground data-[variant=default]:bg-primary data-[variant=default]:text-primary-foreground data-[variant=destructive]:bg-destructive/10 data-[variant=destructive]:text-destructive data-[variant=outline]:border data-[variant=ghost]:bg-transparent"><BubbleContent>{props.text}</BubbleContent></Root></div>;
}
