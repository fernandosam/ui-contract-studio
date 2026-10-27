import {useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {
 AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,
 AlertDialogFooter,AlertDialogAction,AlertDialogCancel
} from "@/components/ui/alert-dialog";
import type {RequirementSpec} from "@/ui-requirements/schema";
import {
 newFormSession,changeFormField,blurFormField,beginLocalSubmit,cancelLocalSubmit,confirmLocalSubmit,
 type FormSession
} from "@/ui-requirements/form-session";

/** Isolated authoring-tool demo. Not in Pi catalog, not a backend adapter. */
export function RegistrationFlowDemo({requirements}:{requirements:RequirementSpec}){
 const [session,setSession]=useState<FormSession>(newFormSession);
 const formRef=useRef<HTMLFormElement>(null);
 const submit=(event:React.FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  const next=beginLocalSubmit(requirements,session);
  setSession(next);
  const first=Object.keys(next.errors)[0];
  if(first)formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
 };
 const confirmed=session.phase==="confirming";
 return <section data-testid="registration-flow-demo" className="space-y-3 rounded-lg border p-4">
  <h3 className="text-base font-semibold">Testar fluxo local de formulário</h3>
  <p className="text-xs text-muted-foreground">Exemplo interativo do assistente, sem persistência nem autorização Pi adicional. Os dados digitados não são enviados.</p>
  {session.phase==="complete"?
   <div role="status" className="rounded-md border p-3 text-sm">
    Operação de demonstração concluída. Nenhum registro foi salvo.
    <Button type="button" variant="outline" className="mt-2 block" onClick={()=>setSession(newFormSession())}>Reiniciar demonstração</Button>
   </div>:
   <form ref={formRef} noValidate onSubmit={submit} className="space-y-3">
    <div className={requirements.answers.layout==="two-columns"?"grid grid-cols-1 gap-3 sm:grid-cols-2":"space-y-3"}>
     {requirements.fields.map(field=>{
      const error=session.errors[field.name]?.[0];
      const id="flow-"+field.name;
      return <div key={field.name} className="space-y-1">
       <label htmlFor={id} className="block text-sm font-medium">{field.label}{field.required&&requirements.answers.validation!=="none"?" *":""}</label>
       <input id={id} name={field.name} type={field.type}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        required={field.required&&requirements.answers.validation!=="none"}
        value={session.values[field.name]??""} autoComplete="off"
        aria-invalid={!!error} aria-describedby={error?id+"-error":undefined}
        onChange={event=>setSession(s=>changeFormField(requirements,s,field.name,event.target.value))}
        onBlur={()=>setSession(s=>blurFormField(requirements,s,field.name))}/>
       {error&&<p id={id+"-error"} className="text-sm text-destructive" role="alert">{error}</p>}
      </div>;
     })}
    </div>
    <Button type="submit"> {requirements.answers.confirmation===true?"Revisar e confirmar":"Concluir demonstração"} </Button>
   </form>}
  <AlertDialog open={confirmed} onOpenChange={open=>{if(!open)setSession(s=>cancelLocalSubmit(s));}}>
   <AlertDialogContent>
    <AlertDialogHeader>
     <AlertDialogTitle>Confirmar cadastro</AlertDialogTitle>
     <AlertDialogDescription>{String(requirements.answers.confirmationMessage||"Confirma os dados?")}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
     <AlertDialogCancel onClick={()=>setSession(s=>cancelLocalSubmit(s))}>Cancelar</AlertDialogCancel>
     <AlertDialogAction onClick={()=>setSession(s=>confirmLocalSubmit(s))}>Confirmar simulação</AlertDialogAction>
    </AlertDialogFooter>
   </AlertDialogContent>
  </AlertDialog>
 </section>;
}
