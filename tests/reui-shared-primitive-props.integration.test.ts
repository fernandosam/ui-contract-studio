import test from "node:test";
import assert from "node:assert/strict";
import { playgroundDefinitions } from "../src/ui-catalog/catalog";

// Validate the API admitted to Pi, not the unrestricted ReUI TSX examples.
test("Carousel admite apenas opções locais de apresentação", () => {
  const schema=playgroundDefinitions.Carousel.props;
  assert.equal(schema.safeParse({
    items:[{title:"Primeiro",description:null}],orientation:"horizontal",
    loop:true,showArrows:false,showIndicators:true,slidesPerView:3,
    ariaLabel:"Destaques",
  }).success,true);
  assert.equal(schema.safeParse({
    items:[],src:"https://example.com/image.png"
  }).success,false);
  assert.equal(schema.safeParse({items:[],autoplay:true}).success,false);
});

test("Avatar e Alert oferecem status e comportamento local tipado",()=>{
  assert.equal(playgroundDefinitions.Avatar.props.safeParse({
    src:null,name:"Ana",size:"sm",status:"online"
  }).success,true);
  assert.equal(playgroundDefinitions.Avatar.props.safeParse({
    src:null,name:"Ana",status:"invisible"
  }).success,false);
  assert.equal(playgroundDefinitions.Alert.props.safeParse({
    title:"Atualização",description:null,tone:"success",dismissible:true
  }).success,true);
  assert.equal(playgroundDefinitions.Alert.props.safeParse({
    title:"Atualização",description:null,onDismiss:"https://example.com"
  }).success,false);
});

test("DropdownMenu admite separadores, checkbox e um submenu; não aceita callbacks",()=>{
  const schema=playgroundDefinitions.DropdownMenu.props;
  assert.equal(schema.safeParse({
    label:"Opções",
    items:[
      {type:"label",value:"header",label:"Exibição"},
      {value:"open",label:"Abrir",shortcut:"Ctrl+O"},
      {type:"separator",value:"sep"},
      {type:"checkbox",value:"compact",label:"Compacto",defaultChecked:true},
      {type:"submenu",value:"more",label:"Mais",items:[
        {value:"details",label:"Detalhes",disabled:false},
      ]},
    ],
  }).success,true);
  assert.equal(schema.safeParse({
    label:"Opções",items:[{type:"submenu",value:"a",label:"A",items:[
      {type:"submenu",value:"b",label:"B",items:[]},
    ]}],
  }).success,false);
  assert.equal(schema.safeParse({
    label:"Opções",items:[{label:"Executar",value:"execute",onClick:"run()"}],
  }).success,false);
});

test("Pagination valida janela, salto e tamanho opcional sem aceitar opções arbitrárias",()=>{
  const schema=playgroundDefinitions.Pagination.props;
  assert.equal(schema.safeParse({
    totalPages:100,page:8,siblingCount:2,showFirstLast:true,
    showGoTo:true,showPageSize:true,totalItems:1000,
    pageSize:25,pageSizeOptions:[10,25,50],
  }).success,true);
  assert.equal(schema.safeParse({totalPages:10,siblingCount:99}).success,false);
  assert.equal(schema.safeParse({totalPages:10,pageSizeOptions:[0]}).success,false);
});
