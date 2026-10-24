import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


/** Real stateful local widget; no network requests. Historical template remains versioned for reference. */
export type SiteCardsActivityGoalProps = {
  title?:string; description?:string; content?:Record<string,string>;
  goal?:number; minimum?:number; maximum?:number; step?:number;
  chartValues?:number[]; showBarChart?:boolean;
};
export function SiteCardsActivityGoal({props,onEvent}:{props:SiteCardsActivityGoalProps;onEvent?:(event:string)=>void}) {
  const min=Math.min(props.minimum??0,props.maximum??1000);
  const max=Math.max(props.maximum??1000,min+1);
  const step=props.step??10;
  const bars=props.chartValues?.length ? props.chartValues : [400,300,200,300,200,278,189,239,300,200,278,189,349];
  const barMax=Math.max(...bars,1);
  const clamp=(n:number)=>Math.min(max,Math.max(min,n));
  const [goal,setGoal]=useState(()=>clamp(props.goal??350));
  const [saved,setSaved]=useState(false);
  useEffect(()=>{setGoal(clamp(props.goal??350));setSaved(false);},[props.goal,props.minimum,props.maximum]);
  const change=(delta:number)=>{setGoal(v=>clamp(v+delta));setSaved(false);onEvent?.("change");};
  return <Card data-composite="SiteCardsActivityGoal"><CardHeader><CardTitle>{props.title??props.content?.["c001.title"]??"Move Goal"}</CardTitle><CardDescription>{props.description??props.content?.["c001.description"]??"Set your daily activity goal."}</CardDescription></CardHeader>
    <CardContent className="space-y-4"><div className="flex items-center justify-center gap-4">
      <Button type="button" variant="outline" size="sm" aria-label="Diminuir objetivo" disabled={goal<=min} onClick={()=>change(-step)}>{props.step!==undefined?`− ${step}`:props.content?.["c002.label"]??`− ${step}`}</Button>
      <div className="min-w-24 text-center" role="status" aria-live="polite"><div className="text-3xl font-bold tabular-nums">{goal}</div><div className="text-xs text-muted-foreground">{props.content?.["c003.label"]??"Calories/day"}</div></div>
      <Button type="button" variant="outline" size="sm" aria-label="Aumentar objetivo" disabled={goal>=max} onClick={()=>change(step)}>{props.step!==undefined?`+ ${step}`:props.content?.["c004.label"]??`+ ${step}`}</Button></div>
      <p className="text-xs text-muted-foreground">{props.content?.["c006.title"]??"Goal"}</p>
      {props.showBarChart!==false&&<div className="flex h-24 items-end gap-1.5" role="img" aria-label="Histograma demonstrativo de metas de atividade">
        {bars.map((height,i)=><div key={i} className="min-w-0 flex-1 rounded-t-sm bg-primary" style={{height:`${Math.max(4,100*height/barMax)}%`}} />)}
      </div>}
    </CardContent><CardFooter className="flex justify-between gap-2"><span className="text-xs text-muted-foreground">{min}–{max}</span><Button type="button" size="sm" onClick={()=>{setSaved(true);onEvent?.("save");}}>{props.content?.["c007.label"]??"Set Goal"}</Button></CardFooter>
    {saved&&<p className="px-6 pb-4 text-xs text-muted-foreground" role="status">Objetivo atualizado localmente para {goal}.</p>}
  </Card>;
}
