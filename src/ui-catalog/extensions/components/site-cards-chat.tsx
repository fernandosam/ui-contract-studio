import { useId, useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ChatMessage = {role:"mine"|"theirs";text:string};
export type SiteCardsChatProps = {title?:string;description?:string;content?:Record<string,string>;recipient?:string;initialMessages?:ChatMessage[]};
/** Demo conversation, no external API, sockets or persistence. */
export function SiteCardsChat({props,onEvent}:{props:SiteCardsChatProps;onEvent?:(event:string)=>void}) {
  const defaults:ChatMessage[]=[
    {role:"theirs",text:props.content?.["c005.text"]??"Hi Sofia, how are you doing?"},
    {role:"mine",text:props.content?.["c006.text"]??"I’m good! Just finishing up some work."},
    {role:"theirs",text:props.content?.["c007.text"]??"Excellent, let me know when you are free."}
  ];
  const inputId=useId();
  const [messages,setMessages]=useState<ChatMessage[]>(()=>props.initialMessages??defaults);
  const [draft,setDraft]=useState('');
  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();const text=draft.trim();if(!text)return;
    setMessages(prev=>[...prev.slice(-49),{role:"mine",text}]);setDraft('');onEvent?.('send');
  };
  return <Card data-composite="SiteCardsChat"><CardHeader><CardTitle>{props.title??props.recipient??props.content?.["c001.title"]??"Sofia Davis"}</CardTitle>
    <CardDescription>{props.description??props.content?.["c001.description"]??"m@example.com"}</CardDescription></CardHeader>
    <CardContent><p className="mb-2 text-xs text-muted-foreground">{props.content?.["c003.label"]??"Online"}</p><ol className="max-h-72 space-y-2 overflow-auto" aria-label="Mensagens locais">{messages.map((m,i)=><li key={i} className={`w-fit max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role==='mine'?'ml-auto bg-primary text-primary-foreground':'bg-muted'}`}>{m.text}</li>)}</ol></CardContent>
    <CardFooter><form className="flex w-full min-w-0 gap-2" onSubmit={submit}><Label htmlFor={inputId} className="sr-only">{props.content?.["c008.label"]??"Message"}</Label><Input id={inputId} value={draft} maxLength={500} placeholder={props.content?.["c008.placeholder"]??"Message"} onChange={e=>setDraft(e.target.value)} /><Button type="submit" disabled={!draft.trim()}>{props.content?.["c009.label"]??"Send"}</Button></form></CardFooter>
  </Card>;
}
