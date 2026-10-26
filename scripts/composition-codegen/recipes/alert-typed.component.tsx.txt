"use client";
import {useId, useState} from "react";
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,AlertDialogTrigger} from "@/components/ui/alert-dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import type {TypedConfirmationDialogProps} from "./TypedConfirmationDialog.schema";

/** PROPOSAL ONLY: exact-match gate; no remote action or permission granted. */
export function TypedConfirmationDialog({props,emit}:{
  props:TypedConfirmationDialogProps;emit?:(event:"confirm")=>void
}){
  const [open,setOpen]=useState(false);
  const [entered,setEntered]=useState("");
  const inputId=useId();
  const helpId=useId();
  const changeOpen=(next:boolean)=>{setOpen(next);if(!next)setEntered("");};
  const valid=entered===props.expectedText;
  const confirm=()=>{if(!valid)return;changeOpen(false);emit?.("confirm");};
  return <AlertDialog open={open} onOpenChange={changeOpen}>
    <AlertDialogTrigger render={<Button type="button" variant="outline"/>}>{props.trigger}</AlertDialogTrigger>
    <AlertDialogContent className="max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle>{props.title}</AlertDialogTitle>
        <AlertDialogDescription>{props.description}</AlertDialogDescription>
      </AlertDialogHeader>
      <div className="space-y-2 py-3">
        <label htmlFor={inputId} className="block text-sm font-medium">Digite exatamente: {props.expectedText}</label>
        <Input id={inputId} aria-describedby={helpId} autoComplete="off"
          spellCheck={false} value={entered} onChange={event=>setEntered(event.target.value)}
          aria-invalid={entered.length>0&&!valid}/>
        <p id={helpId} className="text-xs text-muted-foreground">A confirmação só será habilitada quando o texto corresponder exatamente.</p>
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction variant="destructive" disabled={!valid} onClick={confirm}>{props.confirmLabel}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
