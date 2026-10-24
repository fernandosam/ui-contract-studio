import { Kbd as ShadcnKbd, KbdGroup } from "@/components/ui/kbd";
export type KbdProps = { keys:string[] };
export function Kbd({props}:{props:KbdProps}) {
 return <KbdGroup aria-label={props.keys.join(" + ")} className="inline-flex flex-wrap items-center gap-1">
  {props.keys.map((key,i)=><ShadcnKbd key={i} className="min-w-7 rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground shadow-xs">{key}</ShadcnKbd>)}
 </KbdGroup>;
}
