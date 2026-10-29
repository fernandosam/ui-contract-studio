/** Browser-only geometric evidence for the existing advisory layout score.
 * Measures the rendered preview, never accepts or changes a Pi contract.
 * An unmeasured check is explicitly recorded, rather than called a pass.
 */
export type RuntimeLayoutDimension="hierarchy"|"grouping"|"density"|"responsiveness";
export type RuntimeLayoutFinding={
 dimension:RuntimeLayoutDimension;code:string;deduction:number;
 message:string;suggestion:string;
};
export type RuntimeLayoutQualityReport={
 schemaVersion:1;basis:"browser-geometry";runtimeEvidence:"browser-measured";
 policy:"advisory-only";score:number;maxScore:100;
 scores:Record<RuntimeLayoutDimension,number>;
 viewport:{width:number;height:number;surfaceWidth:number};
 checks:{evaluated:number;notApplicable:string[]};
 findings:RuntimeLayoutFinding[];
 limitations:string[];
};
type Rect={left:number;right:number;top:number;bottom:number;width:number;height:number};
const axes:RuntimeLayoutDimension[]=["hierarchy","grouping","density","responsiveness"];
const epsilon=2;
function rect(el:Element):Rect{
 const b=el.getBoundingClientRect();
 return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height};
}
function visible(el:Element):boolean{
 const css=getComputedStyle(el);
 return css.display!=="none"&&css.visibility!=="hidden"&&
  css.opacity!=="0"&&rect(el).width>0&&rect(el).height>0;
}
function fits(inner:Rect,outer:Rect){
 return inner.left>=outer.left-epsilon&&inner.right<=outer.right+epsilon;
}
function intersects(a:Rect,b:Rect){
 return Math.min(a.right,b.right)-Math.max(a.left,b.left)>epsilon&&
  Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>epsilon;
}
function directChildren(container:Element){
 return [...container.children].filter(visible);
}
/** Returns null when no actual browser geometry is available (SSR/hidden preview). */
export function evaluateRenderedLayout(surface:HTMLElement):RuntimeLayoutQualityReport|null{
 if(typeof window==="undefined"||!surface.isConnected||!visible(surface))return null;
 const boundary=rect(surface);
 const width=window.innerWidth,height=window.innerHeight;
 if(width<=0||height<=0)return null;
 const scores:RuntimeLayoutQualityReport["scores"]={
  hierarchy:25,grouping:25,density:25,responsiveness:25
 };
 const findings:RuntimeLayoutFinding[]=[];
 const skipped:string[]=[];
 let evaluated=0;
 const check=(axis:RuntimeLayoutDimension,code:string,ok:boolean|null,message:string,suggestion:string)=>{
  if(ok===null){skipped.push(code);return;}
  evaluated++;
  if(ok)return;
  scores[axis]=Math.max(0,scores[axis]-5);
  findings.push({dimension:axis,code,deduction:5,message,suggestion});
 };
 const descendants=[...surface.querySelectorAll<HTMLElement>("*")].filter(visible).slice(0,500);
 const titles=descendants.filter(el=>el.matches("h1,h2,h3,h4,h5,h6,[data-slot='card-title']"));
 const title=titles[0];
 const titleBox=title?rect(title):null;
 const controls=descendants.filter(el=>el.matches("button,[role='button'],input:not([type='hidden']),select,textarea"));
 const groups=descendants.filter(el=>el.matches(".pg-stack,.pg-grid,.pg-card,[data-slot='card']"));
 const layouts=descendants.filter(el=>el.matches(".pg-grid,.pg-stack"));
 const grids=descendants.filter(el=>el.matches(".pg-grid"));
 const content=directChildren(surface);
 const contentBox=content[0]?rect(content[0]):null;
 const firstControl=controls[0]?rect(controls[0]):null;
 const overlaps=layouts.some(el=>{
  const children=directChildren(el);
  return children.some((item,i)=>children.slice(i+1).some(other=>
   intersects(rect(item),rect(other))));
 });
 const groupOverflow=groups.some(el=>el.scrollWidth>el.clientWidth+epsilon &&
  getComputedStyle(el).overflowX!=="auto"&&getComputedStyle(el).overflowX!=="scroll");
 const outOfGroup=layouts.some(el=>{
  const parentBox=rect(el);
  return directChildren(el).some(child=>!fits(rect(child),parentBox));
 });
 const controlOverlaps=controls.some((item,i)=>controls.slice(i+1).some(other=>{
  if(item.contains(other)||other.contains(item))return false;
  return intersects(rect(item),rect(other));
 }));
 const outsideControls=controls.some(el=>!fits(rect(el),boundary));
 const gridOutliers=grids.some(grid=>{
  const box=rect(grid);
  return directChildren(grid).some(child=>!fits(rect(child),box));
 });
 const mobileGridRows=grids.every(grid=>{
  const children=directChildren(grid);
  return children.every((item,i)=>children.slice(i+1).every(other=>
   Math.abs(rect(item).top-rect(other).top)>epsilon));
 });
 check("hierarchy","browser-content",content.length>0,
  "A prévia renderizada está vazia.","Verificar se a árvore Pi renderizou conteúdo visível.");
 check("hierarchy","browser-title",!!title,
  "Título semântico não foi observado.","Usar um título visível no contêiner principal.");
 check("hierarchy","browser-title-inside",titleBox?fits(titleBox,boundary):null,
  "Título ultrapassa a área de prévia.","Rever largura e espaçamento do título.");
 check("hierarchy","browser-reading-order",titleBox&&firstControl?
  titleBox.top<=firstControl.top+epsilon:null,
  "Um controle aparece visualmente antes do título.","Preservar a ordem de leitura do contrato.");
 check("hierarchy","browser-title-clipping",title?
  title.scrollWidth<=title.clientWidth+epsilon:null,
  "Título está cortado horizontalmente.","Permitir quebra de linha no cabeçalho.");
 check("grouping","browser-group-found",groups.length>0,
  "Nenhum contêiner de agrupamento foi encontrado.","Organizar regiões usando os contêineres admitidos.");
 check("grouping","browser-group-overlap",layouts.length>0?!overlaps:null,
  "Grupos filhos se sobrepõem.","Revisar gaps, dimensões e posicionamento dos grupos.");
 check("grouping","browser-group-overflow",groups.length>0?!groupOverflow:null,
  "Um grupo contém largura não acomodada.","Reduzir largura ou habilitar quebra/adaptação do conteúdo.");
 check("grouping","browser-group-containment",layouts.length>0?!outOfGroup:null,
  "Conteúdo sai dos limites de seu grupo.","Rever tamanho intrínseco e min-width dos filhos.");
 check("grouping","browser-group-visibility",groups.length>0?
  groups.every(g=>rect(g).height>0):null,
  "Há grupo sem altura renderizada.","Inspecionar regiões vazias ou colapsadas.");
 check("density","browser-elements",descendants.length>0,
  "Sem elementos mensuráveis.","Renderizar a interface antes de medir sua densidade.");
 check("density","browser-control-overlap",controls.length>1?!controlOverlaps:null,
  "Controles se sobrepõem.","Aumentar espaçamento ou empilhar controles.");
 check("density","browser-target-height",controls.length>0?
  controls.filter(el=>el.matches("button,[role='button']")).every(el=>rect(el).height>=28):null,
  "Botão com altura inferior a 28 px.","Rever tamanho mínimo dos botões visuais.");
 check("density","browser-grid-containment",grids.length>0?!gridOutliers:null,
  "Item de grid ultrapassa sua célula externa.","Rever largura mínima, colunas e overflow.");
 check("density","browser-mobile-columns",width<=639&&grids.length>0?mobileGridRows:null,
  "Grid permanece em múltiplas colunas no celular.","Usar uma coluna efetiva em viewport até 639 px.");
 check("responsiveness","browser-viewport-available",width>=240,
  "Viewport muito estreito para uma avaliação representativa.","Executar também em um tamanho de tela suportado.");
 check("responsiveness","browser-surface-in-viewport",
  boundary.left>=-epsilon&&boundary.right<=width+epsilon,
  "A área de prévia extrapola a largura visível.","Rever o contêiner externo em telas pequenas.");
 check("responsiveness","browser-horizontal-overflow",
  surface.scrollWidth<=surface.clientWidth+epsilon,
  "A prévia produz rolagem horizontal interna.","Corrigir largura mínima, tabelas e grids responsivos.");
 check("responsiveness","browser-content-bounds",contentBox?fits(contentBox,boundary):null,
  "O conteúdo principal extrapola os limites da prévia.","Conter a árvore renderizada na largura disponível.");
 check("responsiveness","browser-control-bounds",controls.length>0?!outsideControls:null,
  "Controle interativo fora da largura disponível.","Empilhar ou permitir quebra dos controles.");
 return {
  schemaVersion:1,basis:"browser-geometry",runtimeEvidence:"browser-measured",
  policy:"advisory-only",score:axes.reduce((sum,axis)=>sum+scores[axis],0),
  maxScore:100,scores,viewport:{width,height,surfaceWidth:Math.round(boundary.width)},
  checks:{evaluated,notApplicable:skipped},findings,
  limitations:[
   "Pontuação geométrica do viewport atual; não representa outros breakpoints sem testes adicionais.",
   "Checagens não aplicáveis são registradas, não equivalem a aprovação visual.",
   "Não certifica percepção humana, contraste, acessibilidade, teclado, funcionalidade ou admissão Pi."
  ]
 };
}
