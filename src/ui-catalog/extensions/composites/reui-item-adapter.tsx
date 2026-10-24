/** Adaptador de composição para exemplos ReUI; não expõe JSX ao contrato JSON. */
import type {ComponentProps} from "react";
import {cn} from "cn";
import {mergeProps} from "@base-ui/react/merge-props";
import {useRender} from "@base-ui/react/use-render";
export function Item({className,size,render,...props}:useRender.ComponentProps<"div">&{size?:"xs"|"sm"|"default"}) {
 const base={"data-slot":"item","data-size":size,className:cn("flex min-w-0 items-center gap-3 rounded-md p-2 text-sm",size==="xs"&&"text-xs",className)};
 return useRender({defaultTagName:"div",render,props:mergeProps<"div">(base,props)});
}
export function ItemGroup({className,...props}:ComponentProps<"div">){return <div className={cn("flex flex-col gap-1",className)} {...props}/>}
export function ItemMedia({className,variant,...props}:ComponentProps<"div">&{variant?:"icon"|"default"|"image"}){return <div className={cn("shrink-0",variant==="icon"&&"flex size-8 items-center justify-center rounded-md bg-muted",className)} {...props}/>}
export function ItemContent({className,...props}:ComponentProps<"div">){return <div className={cn("flex min-w-0 flex-col gap-1",className)} {...props}/>}
export function ItemTitle({className,...props}:ComponentProps<"div">){return <div className={cn("font-medium",className)} {...props}/>}
export function ItemActions({className,...props}:ComponentProps<"div">){return <div className={cn("ml-auto flex shrink-0 items-center gap-1",className)} {...props}/>}
/** Texto descritivo usado apenas nas composições ReUI. */
export function ItemDescription({className,...props}:ComponentProps<"p">){return <p className={cn("text-xs text-muted-foreground",className)} {...props}/>}
