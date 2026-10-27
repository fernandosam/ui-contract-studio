"use client";
import {useId,useRef,useState} from "react";
import type {FormEvent} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
 AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,
 AlertDialogFooter,AlertDialogAction,AlertDialogCancel
} from "@/components/ui/alert-dialog";
import {validateDeclarativeValues,type DeclarativeFormFlowProps} from "./DeclarativeFormFlow.schema";

/** PROPOSAL ONLY: local-only reusable form; no network, storage, secrets or Pi permission. */
export function DeclarativeFormFlow({props,emit}:{props:DeclarativeFormFlowProps;emit?:(event:"complete")=>void}){
 const id=useId();
 const form=useRef<HTMLFormElement>(null);
 const [values,setValues]=useState<Record<string,string>>({});
 const [errors,setErrors]=useState<Record<string,string[]>>({});
 const [phase,setPhase]=useState<"editing"|"confirming"|"complete">("editing");
 const [submissions,setSubmissions]=useState(0);
 const completed=useRef(false);
 const finish=()=>{
  if(completed.current)return;
  completed.current=true;
  setSubmissions(x=>x+1);
  setPhase("complete");
  emit?.("complete");
 };
 const submit=(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(phase!=="editing")return;
  const next=validateDeclarativeValues(props,values);
  setErrors(next);
  const first=Object.keys(next)[0];
  if(first){
   const input=[...form.current?.querySelectorAll<HTMLInputElement>("input")??[]].find(x=>x.name===first);
   input?.focus();
   return;
  }
  if(props.confirmation)setPhase("confirming");else finish();
 };
 const change=(name:string,value:string)=>{
  if(phase!=="editing")return;
  setValues(old=>({...old,[name]:value}));
  setErrors(old=>{if(!old[name])return old;const next={...old};delete next[name];return next;});
 };
 const blur=(name:string)=>{
  if(phase!=="editing"||props.validation!=="on-blur")return;
  const next=validateDeclarativeValues(props,values);
  setErrors(old=>{
   const updated={...old};
   if(next[name])updated[name]=next[name];else delete updated[name];
   return updated;
  });
 };
 const reset=()=>{completed.current=false;setValues({});setErrors({});setSubmissions(0);setPhase("editing");};
 return <section className="space-y-3 rounded-lg border p-4"
  data-testid="registration-flow-demo" aria-label={props.title}>
  <header className="space-y-1">
   <h3 className="font-semibold">{props.title}</h3>
   {props.description&&<p className="text-sm text-muted-foreground">{props.description}</p>}
   <p className="text-xs text-muted-foreground">Candidato experimental não admitido: execução demonstrativa sem persistência.</p>
  </header>
  {phase==="complete"?
   <div role="status" className="space-y-2 rounded-md border p-3 text-sm">
    Operação de demonstração concluída. Nenhum registro foi salvo.
    <p className="text-xs text-muted-foreground">Conclusões locais: {submissions}</p>
    <Button type="button" variant="outline" onClick={reset}>Reiniciar demonstração</Button>
   </div>:
   <form ref={form} noValidate onSubmit={submit} className="space-y-3">
    <div className={props.layout==="two-columns"?"grid grid-cols-1 gap-3 sm:grid-cols-2":"space-y-3"}>
     {props.fields.map(field=>{
      const fieldId=id+"-"+field.name,found=errors[field.name]??[];
      const errorId=fieldId+"-error";
      return <div key={field.name} className="space-y-1">
       <label htmlFor={fieldId} className="block text-sm font-medium">
        {field.label}{props.validation!=="none"&&field.required?" *":""}
       </label>
       <Input id={fieldId} name={field.name} type={field.type}
        autoComplete="off" value={values[field.name]??""}
        maxLength={field.maxLength} required={props.validation!=="none"&&field.required}
        aria-invalid={found.length>0||undefined}
        aria-describedby={found.length?errorId:undefined}
        onChange={event=>change(field.name,event.target.value)}
        onBlur={()=>blur(field.name)}/>
       {found.length>0&&<p id={errorId} role="alert" className="text-sm text-destructive">{found.join(". ")}</p>}
      </div>;
     })}
    </div>
    <Button type="submit">{props.confirmation?"Revisar e confirmar":props.submitLabel}</Button>
   </form>}
  <AlertDialog open={phase==="confirming"}
   onOpenChange={open=>{if(!open)setPhase(old=>old==="confirming"?"editing":old);}}>
   <AlertDialogContent>
    <AlertDialogHeader>
     <AlertDialogTitle>{props.confirmation?.title??"Confirmação"}</AlertDialogTitle>
     <AlertDialogDescription>{props.confirmation?.description??""}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
     <AlertDialogCancel onClick={()=>setPhase(old=>old==="confirming"?"editing":old)}>Cancelar</AlertDialogCancel>
     <AlertDialogAction onClick={()=>{if(phase==="confirming"&&!Object.keys(validateDeclarativeValues(props,values)).length)finish();}}>
      {props.confirmation?.confirmLabel??"Confirmar"}
     </AlertDialogAction>
    </AlertDialogFooter>
   </AlertDialogContent>
  </AlertDialog>
 </section>;
}
