import {useState} from "react";
import {PreviewThemeSelector} from "./preview-theme";
import {TypedConfirmationDialog} from "@/ui-catalog/extensions/composites/proposals/TypedConfirmationDialog";
import {typedConfirmationDialogSchema} from "@/ui-catalog/extensions/composites/proposals/TypedConfirmationDialog.schema";

/**
 * Fixed administrative fixture. The candidate runs locally inside the explorer,
 * and is available through the explicit experimental Pi registry only.
 */
export function TypedConfirmationPilot(){
 const [expected,setExpected]=useState("EXCLUIR");
 const [count,setCount]=useState(0);
 const props=typedConfirmationDialogSchema.safeParse({
  trigger:"Simular exclusão",title:"Confirmação simulada",
  description:"Este teste não exclui dados nem envia informações para um servidor.",
  expectedText:expected,confirmLabel:"Confirmar",
 });
 return <section className="space-y-3 rounded-lg border border-border bg-card p-4"
   aria-label="Prévia executável isolada TypedConfirmationDialog"
   data-testid="typed-confirmation-pilot">
  <div className="space-y-1">
   <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">Prévia executável · TypedConfirmationDialog</h4><PreviewThemeSelector/></div>
   <p className="text-xs text-muted-foreground">Executa a receita React local no explorador administrativo. Sem ações remotas e sem operações destrutivas; catálogo Pi experimental.</p>
  </div>
  <label className="grid gap-1 text-xs font-medium" htmlFor="pilot-expected">
   Texto exigido na demonstração
   <input id="pilot-expected" value={expected} maxLength={80}
     onChange={event=>setExpected(event.target.value)}
     className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
     aria-invalid={!props.success} />
  </label>
  {!props.success&&<p role="alert" className="text-xs text-destructive">
   Informe de 1 a 80 caracteres para manter o schema Zod válido.
  </p>}
  {props.success && <TypedConfirmationDialog props={props.data}
   emit={event=>{if(event==="confirm")setCount(x=>x+1);}}/>}
  <p role="status" className="text-xs text-muted-foreground"
    data-testid="typed-confirmation-confirmations">
   Confirmações locais: {count}. Nenhuma operação externa executada.
  </p>
  <p className="text-xs font-medium">Contrato experimental: E2E completo e revisão de acessibilidade continuam distintos desta prévia.</p>
 </section>;
}
