import { CircleDotIcon } from "lucide-react";
import { Marker as Root, MarkerIcon, MarkerContent } from "@/components/ui/marker";
export type MarkerProps={text:string;variant?:"default"|"separator"|"border"};
export function Marker({props}:{props:MarkerProps}) {
 return <Root variant={props.variant??"default"} role="status" className="gap-2 rounded-md p-2 text-sm data-[variant=border]:border data-[variant=separator]:border-b"><MarkerIcon><CircleDotIcon className="size-4" /></MarkerIcon><MarkerContent>{props.text}</MarkerContent></Root>;
}
