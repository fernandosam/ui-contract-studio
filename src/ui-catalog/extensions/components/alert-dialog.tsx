import { useState } from "react";
import { AlertDialog as Root, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
export type AlertDialogProps = { trigger:string; title:string; description:string; cancelLabel?:string; confirmLabel?:string; size?:"default"|"sm"; confirmVariant?:"default"|"destructive" };
export function AlertDialog({props,emit}:{props:AlertDialogProps;emit?:(name:"confirm")=>void}) {
 const [open,setOpen]=useState(false);
 return <Root open={open} onOpenChange={setOpen}>
  <AlertDialogTrigger render={<Button variant="outline" />}>{props.trigger}</AlertDialogTrigger>
  <AlertDialogContent size={props.size??"default"} className="max-w-md gap-4 rounded-xl border bg-background p-6 text-foreground shadow-xl">
   <AlertDialogHeader className="space-y-2"><AlertDialogTitle className="text-lg font-semibold">{props.title}</AlertDialogTitle><AlertDialogDescription className="text-sm text-muted-foreground">{props.description}</AlertDialogDescription></AlertDialogHeader>
   <AlertDialogFooter className="mt-4"><AlertDialogCancel>{props.cancelLabel??"Cancelar"}</AlertDialogCancel><AlertDialogAction variant={props.confirmVariant??"default"} onClick={()=>{setOpen(false);emit?.("confirm");}}>{props.confirmLabel??"Continuar"}</AlertDialogAction></AlertDialogFooter>
  </AlertDialogContent>
 </Root>;
}
