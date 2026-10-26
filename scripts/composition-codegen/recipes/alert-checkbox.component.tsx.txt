"use client";
import {useId, useState} from "react";
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,AlertDialogTrigger} from "@/components/ui/alert-dialog";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import type {AcknowledgedActionDialogProps} from "./AcknowledgedActionDialog.schema";

/** PROPOSAL ONLY: not registered in the Pi catalog. Emits an event; never deletes data. */
export function AcknowledgedActionDialog({props,emit}:{
  props:AcknowledgedActionDialogProps;emit?:(event:"confirm")=>void
}){
  const [open,setOpen]=useState(false);
  const [accepted,setAccepted]=useState(false);
  const checkboxId=useId();
  const changeOpen=(next:boolean)=>{setOpen(next);if(!next)setAccepted(false);};
  const confirm=()=>{if(!accepted)return;changeOpen(false);emit?.("confirm");};
  return <AlertDialog open={open} onOpenChange={changeOpen}>
    <AlertDialogTrigger render={<Button variant="outline" type="button"/>}>{props.trigger}</AlertDialogTrigger>
    <AlertDialogContent className="max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle>{props.title}</AlertDialogTitle>
        <AlertDialogDescription>{props.description}</AlertDialogDescription>
      </AlertDialogHeader>
      <div className="flex items-start gap-3 py-3">
        <Checkbox id={checkboxId} checked={accepted} onCheckedChange={checked=>setAccepted(checked===true)}/>
        <label htmlFor={checkboxId} className="cursor-pointer text-sm leading-relaxed">{props.acknowledgmentLabel}</label>
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction variant="destructive" disabled={!accepted} onClick={confirm}>{props.confirmLabel}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
