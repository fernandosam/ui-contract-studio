import { HoverCard as Root, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
export type HoverCardProps={trigger:string;title:string;description:string;side?:"top"|"bottom"|"left"|"right"};
export function HoverCard({props}:{props:HoverCardProps}) {
 return <Root><HoverCardTrigger className="inline-flex cursor-help border-b border-dotted text-sm font-medium underline-offset-4">{props.trigger}</HoverCardTrigger>
  <HoverCardContent side={props.side??"bottom"} className="w-72 max-w-[90vw] space-y-1 rounded-md border bg-popover p-4 text-popover-foreground shadow-lg">
   <p className="font-semibold">{props.title}</p><p className="text-sm text-muted-foreground">{props.description}</p>
  </HoverCardContent>
 </Root>;
}
