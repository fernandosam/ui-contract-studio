/** Adaptador exclusivamente para composições ReUI. Não faz parte do contrato JSON. */
import type {ComponentProps, ReactNode} from "react";
import {cn} from "cn";
const Part=({className,...props}:ComponentProps<"div">)=><div className={cn("flex w-full flex-col items-center justify-center gap-3 text-center",className)} {...props}/>;
export const Empty=({className,...props}:ComponentProps<"div">)=><Part className={cn("rounded-xl border border-dashed bg-card p-6",className)} {...props}/>;
export const EmptyHeader=Part;
export const EmptyContent=Part;
export const EmptyDescription=({className,...props}:ComponentProps<"p">)=><p className={cn("text-sm text-muted-foreground",className)} {...props}/>;
export const EmptyTitle=({className,...props}:ComponentProps<"h3">)=><h3 className={cn("font-semibold",className)} {...props}/>;
export function EmptyMedia({variant,className,children,...props}:ComponentProps<"div">&{variant?:"icon"|"default";children?:ReactNode}){return <div className={cn(variant==="icon"&&"rounded-lg bg-muted p-3",className)} {...props}>{children}</div>}
