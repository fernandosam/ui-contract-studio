/**
 * T35 — bounded, local-only examples for one already-declared experimental Pi type.
 * Not a contract registry, admission, backend handler or code-generation API.
 * SpecScreen must still validate every variant against experimentalCatalog.
 */
type Field={name:string;label:string;type:"text"|"email"|"password"|"tel";required:boolean;minLength?:number;maxLength?:number};
type FormProps={
 title:string;description:string|null;fields:Field[];layout:"single"|"two-columns";
 validation:"on-submit"|"on-blur"|"none";submitLabel:string;
 confirmation:{title:string;description:string;confirmLabel:string}|null;
};
const form=(props:FormProps)=>({
 root:"example",
 elements:{example:{type:"DeclarativeFormFlow",props,children:[] as string[]}}
});
export const experimentalFormScenarios={
 minimal:form({
  title:"Contato demonstrativo",
  description:"Formulário mínimo, sem persistência nem chamadas externas.",
  fields:[{name:"email",label:"E-mail",type:"email",required:true}],
  layout:"single",validation:"on-submit",submitLabel:"Concluir demonstração",
  confirmation:null,
 }),
 corporate:form({
  title:"Cadastro corporativo demonstrativo",
  description:"Cinco campos e confirmação explícita; nenhuma operação remota.",
  fields:[
   {name:"name",label:"Nome",type:"text",required:true},
   {name:"email",label:"E-mail",type:"email",required:true},
   {name:"password",label:"Senha",type:"password",required:true,minLength:6},
   {name:"company",label:"Empresa",type:"text",required:true},
   {name:"phone",label:"Telefone",type:"tel",required:false},
  ],
  layout:"two-columns",validation:"on-blur",submitLabel:"Concluir demonstração",
  confirmation:{title:"Revisar cadastro",description:"Confirme apenas esta simulação local.",confirmLabel:"Confirmar simulação"},
 }),
} as const;
export type ExperimentalFormScenario=keyof typeof experimentalFormScenarios;
