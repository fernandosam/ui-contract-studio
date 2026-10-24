import {useEffect,useId,useState} from 'react';
import {Card,CardContent,CardDescription,CardHeader,CardTitle,CardFooter} from '@/components/ui/card';
import {Button} from '@/components/ui/button';

export type PlanOption={id:string;label:string;description?:string;displayPrice?:string};
export type SiteCardsPaymentMethodProps={
 content?:Record<string,string>;title?:string;description?:string;
 plans?:PlanOption[];defaultPlan?:string;checkoutLabel?:string;
};
const DEFAULT_PLANS:PlanOption[]=[
 {id:'starter',label:'Starter Plan',description:'Perfect for small businesses.',displayPrice:'$10'},
 {id:'pro',label:'Pro Plan',description:'Advanced features with more storage.',displayPrice:'$20'},
];
/** Local plan picker, no cardholder data, payment processing or external calls. */
export function SiteCardsPaymentMethod({props,onEvent}:{props:SiteCardsPaymentMethodProps;onEvent?:(event:string)=>void}){
 const plans=props.plans?.length?props.plans:DEFAULT_PLANS;
 const [selected,setSelected]=useState(()=>plans.some(p=>p.id===props.defaultPlan)?props.defaultPlan!:plans[0].id);
 const [confirmed,setConfirmed]=useState(false);
 const id=useId();
 useEffect(()=>{setSelected(plans.some(p=>p.id===props.defaultPlan)?props.defaultPlan!:plans[0].id);setConfirmed(false);},[props.defaultPlan,props.plans]);
 const current=plans.find(p=>p.id===selected)??plans[0];
 return <Card data-composite="SiteCardsPaymentMethod">
  <CardHeader><CardTitle>{props.title??props.content?.['c001.title']??'Payment Method'}</CardTitle>
   <CardDescription>{props.description??props.content?.['c001.description']??'Choose a plan (demo only).'}</CardDescription></CardHeader>
  <CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{props.content?.['c003.text']??'Select the plan that best fits your needs.'}</p>
   <fieldset className="space-y-2"><legend className="text-sm font-semibold">Plan</legend>
    {plans.map(plan=><label key={plan.id} htmlFor={`${id}-${plan.id}`} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary">
      <input id={`${id}-${plan.id}`} type="radio" name={`${id}-plan`} value={plan.id} checked={selected===plan.id} onChange={()=>{setSelected(plan.id);setConfirmed(false);onEvent?.('planChange');}}/>
      <span className="flex-1"><span className="block text-sm font-semibold">{plan.label}</span>{plan.description&&<span className="block text-xs text-muted-foreground">{plan.description}</span>}</span>
      {plan.displayPrice&&<span className="text-sm font-semibold">{plan.displayPrice}</span>}
    </label>)}
   </fieldset>
   <p className="text-xs text-muted-foreground">Somente demonstração: não insira números de cartão, CVV ou informações bancárias. Nenhuma cobrança será realizada.</p>
  </CardContent>
  <CardFooter className="flex flex-col items-stretch gap-2"><Button type="button" onClick={()=>{setConfirmed(true);onEvent?.('select');}}>{props.checkoutLabel??props.content?.['c010.label']??'Continue'}</Button>
   {confirmed&&<p role="status" className="text-xs text-muted-foreground">Plano {current.label} selecionado localmente. Não há pagamento.</p>}
  </CardFooter>
 </Card>;
}
