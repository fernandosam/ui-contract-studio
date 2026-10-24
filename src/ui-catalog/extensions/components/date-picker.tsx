import { useId,useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover,PopoverContent,PopoverTrigger } from '@/components/ui/popover';
import { useBoundProp } from '@json-render/react';
import { parseIsoDate,toIsoDate,dateError } from '@/ui-data/date-rules.mjs';
export type DatePickerProps={label:string;name:string;value:string|null;placeholder:string|null;
 minDate:string|null;maxDate:string|null;disabled:boolean|null;required:boolean|null};
export function DatePicker({props,statePath,onChange}:{props:DatePickerProps;statePath?:string;onChange?:()=>void}){
 const id=useId(),errorId=useId();
 const [local,setLocal]=useState<string|null>(props.value);
 const [bound,setBound]=useBoundProp<string|null>(props.value,statePath);
 const [open,setOpen]=useState(false),[touched,setTouched]=useState(false);
 const value=statePath?(bound??null):local;
 const error=dateError(value,props.minDate,props.maxDate,Boolean(props.required));
 const selected=parseIsoDate(value),min=parseIsoDate(props.minDate),max=parseIsoDate(props.maxDate);
 const choose=(date:Date|undefined)=>{
   if(!date)return;
   const next=toIsoDate(date);
   if(dateError(next,props.minDate,props.maxDate,false))return;
   if(statePath)setBound(next);else setLocal(next);
   setTouched(true);setOpen(false);onChange?.();
 };
 return <div className="flex flex-col gap-2 max-w-xs">
  <label id={id} className="text-sm font-medium">{props.label}{props.required?' *':''}</label>
  <Popover open={open} onOpenChange={next=>{setOpen(next);if(!next)setTouched(true);}}>
   <PopoverTrigger disabled={Boolean(props.disabled)} render={<Button type="button" variant="outline" data-testid="date-picker-trigger"
    aria-invalid={Boolean(touched&&error)} aria-describedby={touched&&error?errorId:undefined}
    aria-labelledby={id} className="w-full justify-start text-left font-normal"/>}>
    <CalendarDays className="mr-2 size-4" aria-hidden="true"/>
    <span>{selected?selected.toLocaleDateString('pt-BR'):props.placeholder??'Selecione uma data'}</span>
   </PopoverTrigger>
   <PopoverContent className="w-auto p-0" align="start">
    <Calendar mode="single" selected={selected} onSelect={choose}
     disabled={(day:Date)=>Boolean((min&&day<min)||(max&&day>max))}/>
   </PopoverContent>
  </Popover>
  <input type="hidden" name={props.name} value={value??''}/>
  {touched&&error&&<p id={errorId} role="alert" className="text-sm text-destructive">{error}</p>}
 </div>;
}
