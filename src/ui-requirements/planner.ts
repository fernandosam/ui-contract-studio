import {isApprovedContract,capabilityAvailable} from "./capabilities";
import type {RequirementSpec} from "./schema";

export type RequirementCoverage={id:string;status:"covered-static"|"review-required"|"blocked";detail:string};
export type CompositionPlan={components:string[];pattern:string;coverage:RequirementCoverage[];blockers:string[];warnings:string[];tests:{id:string;kind:"integration"|"visual"|"manual-a11y";status:"not-executed"}[]};
export function planInterface(spec:RequirementSpec):CompositionPlan {
  const requested=spec.answers;
  const components=["Card",requested.layout==="two-columns"?"Grid":"Stack","Input",requested.confirmation===true?"AlertDialog":"Button"];
  const blockers=[...spec.missing.map(id=>"Resposta obrigatória: "+id)];
  const coverage:RequirementCoverage[]=[];
  const add=(id:string,status:RequirementCoverage["status"],detail:string)=>coverage.push({id,status,detail});
  if(!spec.fields.length){blockers.push("Nenhum campo selecionado");add("fields","blocked","Informe pelo menos um campo.");}
  else add("fields","covered-static","Campos tipados e rótulos disponíveis no catálogo.");
  if(requested.validation==="business"){
    blockers.push("Validação de negócio não disponível como fluxo seguro de formulário.");
    add("validation","blocked","Input.checks não executa validações de negócio no adaptador atual.");
  } else if(requested.validation==="native"){
    add("validation","review-required","Restrições HTML de entrada; disparo de validação e bloqueio de envio precisam de teste em navegador.");
  } else add("validation","covered-static","Somente apresentação.");
  if(requested.confirmation===true){
    add("confirmation",capabilityAvailable("AlertDialog","confirm-signal")?"review-required":"blocked",
      "AlertDialog permite confirmação local; conexão com submissão real não implementada.");
  }
  if(requested.persistence==="backend"){
    blockers.push("Persistência remota depende de ação/backend autorizado.");
    add("persistence","blocked","Não criar URLs ou handlers por inferência.");
  } else add("persistence","covered-static","Somente prévia e dados locais; não há salvamento.");
  for(const component of components)if(!isApprovedContract(component))blockers.push("Contrato não admitido: "+component);
  const warnings=[
    "Evidência estática não certifica comportamento em navegador.",
    "Botão ou AlertDialog demonstrativos não realizam submissão/persistência.",
    ...(requested.validation==="native"?["Verificar required/email e navegação por teclado manualmente."]:[]),
  ];
  return {components:[...new Set(components)],pattern:"registration",coverage,blockers,warnings,
    tests:[{id:"valid-contracts",kind:"integration",status:"not-executed"},
      {id:"responsive-layout",kind:"visual",status:"not-executed"},
      {id:"native-field-accessibility",kind:"manual-a11y",status:"not-executed"}]};
}
