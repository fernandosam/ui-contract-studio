import { useState } from "react";
import { AlertDialog as Root, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
export type AlertDialogProps = { trigger:string; title:string; description:string; cancelLabel?:string; confirmLabel?:string; size?:"default"|"sm"; confirmVariant?:"default"|"destructive" };

 // Development-only, opt-in event observation: records the existing local
 // signal but never grants an action, side effect or new Pi capability.
const signalConfirm=(emit?: (name:"confirm")=>void)=>{
 if(import.meta.env.DEV && typeof window!=="undefined" &&
    new URLSearchParams(window.location.search).get("semanticProbe")==="1"){
  const target=window as Window & {
   __uiContractSemanticEvents?:Array<{event:string;emitterAvailable:boolean}>;
  };
  (target.__uiContractSemanticEvents??=[]).push({
   event:"confirm",emitterAvailable:typeof emit==="function",
  });
 }
 return emit?.("confirm");
};
export function AlertDialog({props,emit}:{props:AlertDialogProps;emit?:(name:"confirm")=>void}) {
 const [open,setOpen]=useState(false);
 return <Root open={open} onOpenChange={setOpen}>
  <AlertDialogTrigger render={<Button variant="outline" />}>{props.trigger}</AlertDialogTrigger>
  <AlertDialogContent size={props.size??"default"} className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md gap-4 overflow-y-auto rounded-xl border bg-background p-6 text-foreground shadow-xl">
   <AlertDialogHeader className="space-y-2"><AlertDialogTitle className="text-lg font-semibold">{props.title}</AlertDialogTitle><AlertDialogDescription className="text-sm text-muted-foreground">{props.description}</AlertDialogDescription></AlertDialogHeader>
   <AlertDialogFooter className="mt-4"><AlertDialogCancel>{props.cancelLabel??"Cancelar"}</AlertDialogCancel><AlertDialogAction variant={props.confirmVariant??"default"} onClick={()=>{setOpen(false);signalConfirm(emit);}}>{props.confirmLabel??"Continuar"}</AlertDialogAction></AlertDialogFooter>
  </AlertDialogContent>
 </Root>;
}
