export function parseIsoDate(value){
 if(!value||!/^\d{4}-\d{2}-\d{2}$/.test(value))return undefined;
 const [year,month,day]=value.split('-').map(Number);
 const date=new Date(year,month-1,day);
 return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:undefined;
}
export const toIsoDate=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
export function dateError(value,minDate,maxDate,required){
 const min=parseIsoDate(minDate),max=parseIsoDate(maxDate),selected=parseIsoDate(value);
 if(min&&max&&min>max)return 'Os limites de data são inconsistentes.';
 if(!value)return required?'Informe uma data.':null;
 if(!selected)return 'Data inválida.';
 if(min&&selected<min)return 'Data anterior ao mínimo permitido.';
 if(max&&selected>max)return 'Data posterior ao máximo permitido.';
 return null;
}
