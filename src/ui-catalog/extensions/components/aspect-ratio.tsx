import type { ReactNode } from "react";
import { AspectRatio as ShadcnAspectRatio } from "@/components/ui/aspect-ratio";
export type AspectRatioProps = { ratio: number };
export function AspectRatio({props,children}:{props:AspectRatioProps;children?:ReactNode}) {
 return <ShadcnAspectRatio ratio={props.ratio} className="w-full overflow-hidden rounded-md border bg-muted/50">{children}</ShadcnAspectRatio>;
}
