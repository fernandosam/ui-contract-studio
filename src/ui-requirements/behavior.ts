/** A non-executable, allowlisted predicate grammar shared by question and screen planning. */
export type Predicate={field:string;equals:string|boolean}|{all:Predicate[]}|{any:Predicate[]}|{not:Predicate};
export function evaluatePredicate(rule:Predicate,values:Record<string,unknown>,depth=0):boolean{
  if(depth>8)throw Error("Limite de profundidade de condição");
  if("field" in rule)return Object.hasOwn(values,rule.field) && values[rule.field]===rule.equals;
  if("all" in rule)return rule.all.every(r=>evaluatePredicate(r,values,depth+1));
  if("any" in rule)return rule.any.some(r=>evaluatePredicate(r,values,depth+1));
  return !evaluatePredicate(rule.not,values,depth+1);
}
export type FieldRule={kind:"required"|"email"|"minLength";value?:number};
export function evaluateValue(value:string,rules:FieldRule[]):string[]{
  const errors:string[]=[];
  for(const rule of rules){
    if(rule.kind==="required"&&!value.trim())errors.push("Campo obrigatório");
    if(rule.kind==="email"&&value!==""&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))errors.push("E-mail inválido");
    if(rule.kind==="minLength"&&value.length<(rule.value??0))errors.push("Tamanho mínimo não atendido");
  }
  return errors;
}
