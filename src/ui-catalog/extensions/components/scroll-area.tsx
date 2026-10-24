import type { ReactNode } from "react";
import { ScrollArea as ShadcnScrollArea } from "@/components/ui/scroll-area";
export type ScrollAreaProps = { height?:"sm"|"md"|"lg" };
const heights = {sm:"h-32",md:"h-64",lg:"h-96"} as const;
export function ScrollArea({props,children}:{props:ScrollAreaProps;children?:ReactNode}) {
 return <ShadcnScrollArea className={`w-full min-w-0 rounded-md border ${heights[props.height??"md"]}`}>
  <div className="min-w-0 space-y-3 p-4">{children}</div>
 </ShadcnScrollArea>;
}
