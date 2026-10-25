import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {playgroundDefinitions} from "../src/ui-catalog/catalog";

const valid:Record<string,Record<string,unknown>>={
  Card:{title:null,description:null,footer:"Última atualização",size:"sm"},
  Separator:{orientation:"horizontal",label:"ou continuar",decorative:true},
  Tabs:{tabs:[{label:"Geral",value:"general",content:"Preferências gerais"},{label:"Avançado",value:"advanced",disabled:true}],value:null,defaultValue:null,listVariant:"line",fullWidth:true},
  Table:{columns:["Nome"],rows:[],caption:null,emptyMessage:"Nenhum registro",striped:true,compact:true},
  Badge:{label:"Ativo",tone:"success",appearance:"soft",dot:true,size:"sm"},
  Progress:{value:30,max:50,label:null,tone:"warning",showValue:false},
  Spinner:{label:null,size:"sm",tone:"info",hideLabel:true},
  Tooltip:{text:"Salvar",content:"Salvar alterações",triggerIcon:"Info",shortcut:"S"},
  Input:{label:"Nome",name:"name",placeholder:null,value:null,invalid:true,description:"Informe seu nome",maxLength:120},
  Textarea:{label:"Mensagem",name:"message",placeholder:null,value:null,rows:4,description:"Informe uma mensagem",invalid:true,maxLength:500},
  Select:{label:"Cidade",name:"city",options:[],placeholder:null,value:null,defaultValue:null,groups:[{label:"Goiás",options:[{label:"Goiânia",value:"goiania",description:"Capital"}]}]},
  Switch:{label:"Notificações",name:"notices",description:"Receber novos avisos",size:"sm"},
  Slider:{label:null,min:0,max:100,step:10,values:[10,40,80],showValue:true},
  ToggleGroup:{items:[{label:"Claro",value:"light",icon:"Sun"},{label:"Escuro",value:"dark",icon:"Moon",disabled:true}],type:"single"}
};
test("14 famílias possuem novas propriedades Zod estritas e serializáveis",()=>{
  assert.equal(Object.keys(valid).length,14);
  for(const [name,props] of Object.entries(valid)){
    const component=playgroundDefinitions[name as keyof typeof playgroundDefinitions];
    assert.ok(component,name);
    const accepted=component.props.safeParse(props);
    assert.ok(accepted.success,name+": "+(accepted.success?"":accepted.error.message));
    const rejected=component.props.safeParse({...props,onClick:"alert(1)",className:"bg-[url(evil)]"});
    assert.ok(!rejected.success,name+": não aceitar execução/CSS livre");
  }
});

test("Slider limita número de controles e Select não aceita opção de HTML arbitrário",()=>{
  const slider=playgroundDefinitions.Slider.props;
  assert.equal(slider.safeParse({...valid.Slider,values:[1,2,3,4]}).success,false);
  assert.equal(slider.safeParse({...valid.Slider,values:[]}).success,false);
  assert.equal(playgroundDefinitions.Select.props.safeParse({...valid.Select,groups:[{label:"Inválido",options:[{label:"Item",value:"v",html:"<img>"}]}]}).success,false);
  assert.equal(playgroundDefinitions.Badge.props.safeParse({...valid.Badge,tone:"unknown"}).success,false);
});

test("matriz de 31 famílias cobre exatamente os 559 TSX versionados, sem admitir exceções silenciosas",()=>{
  const families=JSON.parse(readFileSync("src/ui-catalog/reui-guidance.json","utf8")) as Record<string,{examples:[string,string][]}>;
  const admission=JSON.parse(readFileSync("src/ui-catalog/reui-semantic-admissions.json","utf8")).entries as Array<{exampleId:string;family:string;classification:string}>;
  const byId=new Map(admission.map(x=>[x.exampleId,x]));
  assert.equal(Object.keys(families).length,31);
  assert.equal(admission.length,559);
  const ids=new Set<string>();
  for(const [family,{examples}] of Object.entries(families)){
    assert.ok(examples.length>0,family);
    const slug=family.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();
    for(let index=0;index<examples.length;index++){
      const [,id]=examples[index];
      assert.ok(!ids.has(id),id);
      ids.add(id);
      assert.equal(byId.get(id)?.family,family,id);
      assert.ok(existsSync(`src/ui-catalog/extensions/composites/reui-${slug}-${index+1}.tsx`),id);
    }
  }
  assert.equal(ids.size,559);
  assert.deepEqual(new Set(admission.map(x=>x.exampleId)),ids);
});
