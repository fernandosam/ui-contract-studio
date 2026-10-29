/**
 * Independent official shadcn/ui visual-audit inventory gate.
 * A selected demo is not a claim of equivalence to the local JSON-render fixture.
 * The remaining installed primitives require explicit pending-review exclusions.
 */
export function validateOfficialVisualInventory(plan,manifest,pi){
 const errors=[];
 const fail=message=>errors.push(message);
 const installed=(plan?.groups??[]).flatMap(group=>(group.items??[]).map(item=>item.name));
 const uniqueInstalled=new Set(installed);
 const examples=manifest?.examples??[];
 const exclusions=manifest?.excludedComponents??[];
 const expectedType=slug=>slug.split("-").map(part=>part[0]?.toUpperCase()+part.slice(1)).join("");
 const types=new Set((pi?.components??[]).map(item=>item.type));
 if(plan?.schemaVersion!==3)fail("Plano shadcn sem schemaVersion 3");
 if(installed.length!==uniqueInstalled.size)fail("Plano shadcn possui primitivas duplicadas");
 if(manifest?.schemaVersion!==1)fail("Inventário visual sem schemaVersion 1");
 if(manifest?.selectionPolicy?.mode!=="curated-official-examples")fail("Política de seleção explícita obrigatória");
 const minimum=manifest?.selectionPolicy?.minimumSelected;
 if(!Number.isInteger(minimum)||minimum<50)fail("A seleção não pode reduzir o piso de cobertura prioritária de 50 referências");
 if(manifest?.selectionPolicy?.reviewRequiredForExcluded!==true)fail("Excluídos devem permanecer pendentes de revisão");
 if(examples.length<minimum)fail(`Referências selecionadas insuficientes: ${examples.length}/${minimum}`);
 if(examples.length+exclusions.length!==installed.length)fail(`Total de classificações inesperado: ${examples.length}+${exclusions.length} vs ${installed.length}`);
 if(manifest?.upstream!=="https://ui.shadcn.com")fail("Domínio de origem diferente da documentação oficial");
 if(manifest?.sourceRepository!=="https://github.com/shadcn-ui/ui")fail("Repositório de origem não oficial");
 if(manifest?.sourcePath!=="apps/v4/content/docs/components/base")fail("Diretório upstream oficial inesperado");
 if(typeof manifest?.sourceRef!=="string"||!manifest.sourceRef.trim())fail("Ref upstream precisa estar declarado");
 if(pi?.schemaVersion!==3||!Array.isArray(pi?.components))fail("Catálogo Pi v3 indisponível");
 const seen=new Set();
 for(const item of examples){
  const slug=item?.component;
  if(typeof slug!=="string"||!/^([a-z]+-)*[a-z]+$/.test(slug)){fail("Componente selecionado com slug inválido");continue;}
  if(seen.has(slug))fail("Referência oficial duplicada: "+slug);
  seen.add(slug);
  if(!uniqueInstalled.has(slug))fail("Referência não instalada: "+slug);
  if(item.docPath!==`/docs/components/base/${slug}`)fail("Caminho oficial divergente: "+slug);
  if(!/^[a-z0-9-]+-demo$/.test(item.exampleId??""))fail("Identificador de exemplo oficial inválido: "+slug);
  if(!/^base-[a-z0-9-]+$/.test(item.style??""))fail("Estilo upstream não identificado: "+slug);
  if(!["block","component"].includes(item.capture))fail("Tipo de captura inválido: "+slug);
  const expected=expectedType(slug);
  const actual=types.has(expected)?expected:null;
  if(item.localType!==actual)fail(`Contrato local incorreto: ${slug}; esperado ${actual??"null"}`);
 }
 for(const item of exclusions){
  const slug=item?.component;
  if(typeof slug!=="string"||!uniqueInstalled.has(slug)){fail("Exclusão não instalada: "+String(slug));continue;}
  if(seen.has(slug))fail("Componente ao mesmo tempo capturado e excluído: "+slug);
  seen.add(slug);
  if(typeof item.reason!=="string"||item.reason.trim().length<20)fail("Exclusão sem justificativa específica: "+slug);
 }
 const missing=installed.filter(name=>!seen.has(name));
 if(missing.length)fail("Primitivas sem seleção nem pendência registrada: "+missing.join(", "));
 if(seen.size!==installed.length)fail("Inventário visual não reconcilia as primitivas do plano");
 return {
  ok:errors.length===0,
  errors,
  statistics:{
   installed:installed.length,
   selected:examples.length,
   pendingReview:exclusions.length,
   comparable:examples.filter(item=>item.localType!==null).length,
   officialOnly:examples.filter(item=>item.localType===null).length,
   viewports:["desktop","mobile"],
  },
 };
}
