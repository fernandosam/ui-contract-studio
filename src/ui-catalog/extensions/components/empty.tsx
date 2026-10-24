import type { ReactNode } from "react";
import { Empty as ShadcnEmpty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
export type EmptyProps = { title:string; description:string|null };
export function Empty({props,children}:{props:EmptyProps;children?:ReactNode}) {
 return <ShadcnEmpty className="gap-4 rounded-lg border border-dashed p-8">
  <EmptyHeader className="gap-2"><EmptyTitle className="text-lg font-semibold">{props.title}</EmptyTitle>
   {props.description&&<EmptyDescription className="text-sm">{props.description}</EmptyDescription>}
  </EmptyHeader>
  {children&&<EmptyContent className="gap-3">{children}</EmptyContent>}
 </ShadcnEmpty>;
}
