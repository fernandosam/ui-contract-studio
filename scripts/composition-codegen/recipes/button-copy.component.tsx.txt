"use client";
import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import type {CopyFeedbackButtonProps} from "./CopyFeedbackButton.schema";

/** PROPOSAL ONLY: clipboard write occurs only after an explicit user click. */
export function CopyFeedbackButton({props}:{props:CopyFeedbackButtonProps}){
  const [state,setState]=useState<"idle"|"pending"|"success"|"error">("idle");
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(timer.current!==null)clearTimeout(timer.current);},[]);
  const copy=async()=>{
    if(state==="pending")return;
    if(timer.current!==null)clearTimeout(timer.current);
    setState("pending");
    try{
      if(!navigator.clipboard?.writeText)throw new Error("clipboard-unavailable");
      await navigator.clipboard.writeText(props.text);
      setState("success");
    }catch{
      setState("error");
    }
    timer.current=setTimeout(()=>{setState("idle");timer.current=null;},2500);
  };
  return <div className="inline-flex items-center gap-2">
    <Button type="button" variant="outline" disabled={state==="pending"}
      onClick={()=>{void copy();}}>{state==="pending"?"Copiando…":props.label}</Button>
    <span role="status" aria-live="polite" className="text-xs text-muted-foreground">
      {state==="success"?"Copiado":state==="error"?"Não foi possível copiar":""}
    </span>
  </div>;
}
