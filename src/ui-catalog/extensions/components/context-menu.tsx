import { ContextMenu as Root, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
export type ContextMenuProps={trigger:string;items:{label:string;disabled?:boolean}[]};
export function ContextMenu({props,emit}:{props:ContextMenuProps;emit?:(name:"select")=>void}) {
 return <Root><ContextMenuTrigger className="rounded-md border border-dashed bg-muted/40 p-5 text-center text-sm text-muted-foreground">{props.trigger}</ContextMenuTrigger>
  <ContextMenuContent className="min-w-44 rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">
   {props.items.map((item,i)=><ContextMenuItem key={i} disabled={item.disabled} className="rounded px-3 py-2 text-sm focus:bg-accent focus:text-accent-foreground" onClick={()=>emit?.("select")}>{item.label}</ContextMenuItem>)}
  </ContextMenuContent>
 </Root>;
}
