import { Item as Root, ItemContent, ItemTitle, ItemDescription } from "@/components/ui/item";
export type ItemProps={title:string;description:string|null;variant?:"default"|"outline"|"muted";size?:"default"|"sm"|"xs"};
export function Item({props}:{props:ItemProps}) {
 return <Root variant={props.variant??"default"} size={props.size??"default"} className="gap-2 rounded-lg p-3 data-[variant=outline]:border data-[variant=muted]:bg-muted/50"><ItemContent className="gap-1"><ItemTitle className="font-medium">{props.title}</ItemTitle>{props.description&&<ItemDescription className="text-sm text-muted-foreground">{props.description}</ItemDescription>}</ItemContent></Root>;
}
