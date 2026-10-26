#!/usr/bin/env node
import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync} from "node:fs";
import {resolve,join,sep} from "node:path";
import {createHash} from "node:crypto";
import ts from "typescript";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const sha=value=>createHash("sha256").update(value).digest("hex");
const scenarios=read("src/ui-catalog/recommendations/scenarios.json").scenarios;
const definitions=read("scripts/composition-codegen/recipes.json");
const approved=new Set(read("src/ui-catalog/contracts.lock.json").components
  .filter(x=>x.status==="approved").map(x=>x.name));
const byId=new Map(scenarios.map(x=>[x.id,x]));
const folder="scripts/composition-codegen/recipes/";
const out="reports/composition-proposals/";
const safeDeps=new Set(["AlertDialog","Button","Checkbox","Input","Accordion","Avatar","Badge","Tooltip"]);
const blocked=/\b(?:fetch|XMLHttpRequest|eval|Function)\s*\(|dangerouslySetInnerHTML|document\.cookie|localStorage\b|sessionStorage\b/;

function parseSource(path,source,tsx){
 const file=ts.createSourceFile(path,source,ts.ScriptTarget.ES2022,true,tsx?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 if(file.parseDiagnostics.length)
  throw Error(path+": TypeScript syntax invalid: "+file.parseDiagnostics.map(x=>x.messageText).join(", "));
 if(!source.includes("PROPOSAL ONLY")&&!source.includes("REVIEW-ONLY"))
  throw Error(path+": missing review-only marker");
 if(blocked.test(source))throw Error(path+": disallowed side effect in template");
 for(const statement of file.statements.filter(ts.isImportDeclaration)){
  const value=statement.moduleSpecifier.text;
  if(!["zod","react","node:test","node:assert/strict"].includes(value) &&
     !/^@\/components\/ui\/[a-z-]+$/.test(value) &&
     !/^\.\/[A-Za-z][A-Za-z0-9.]*$/.test(value))
    throw Error(path+": disallowed import "+value);
 }
}
export function checkProposalRecipes(){
 const errors=[],seen=new Set();
 if(definitions.schemaVersion!==1||definitions.base!=="review-only")
  errors.push("Generator must operate in review-only mode");
 for(const recipe of definitions.recipes){
  const scenario=byId.get(recipe.id);
  if(seen.has(recipe.id))errors.push("Duplicate recipe "+recipe.id);
  seen.add(recipe.id);
  if(!scenario || scenario.strategy!=="react-candidate" || scenario.target!==recipe.target ||
     approved.has(recipe.target))errors.push(recipe.id+": invalid or already-approved target");
  if(!/^[A-Z][A-Za-z0-9]+$/.test(recipe.target)||recipe.componentFile!==recipe.target+".tsx"||
     recipe.schemaFile!==recipe.target+".schema.ts" ||
     recipe.schemaExport!==recipe.target[0].toLowerCase()+recipe.target.slice(1)+"Schema")
    errors.push(recipe.id+": invalid output contract naming");
  if(!recipe.fixtures?.valid||!Array.isArray(recipe.fixtures.invalid)||!recipe.fixtures.invalid.length)
    errors.push(recipe.id+": schema fixtures missing");
  if(scenario?.dependencies.some(x=>!approved.has(x)||!safeDeps.has(x)))
    errors.push(recipe.id+": dependency not allowlisted/approved");
 }
 for(const scenario of scenarios.filter(x=>x.strategy==="react-candidate"))
  if(!seen.has(scenario.id))errors.push(scenario.id+": missing code generation recipe");
 const actual=readdirSync(folder).sort();
 const expected=definitions.recipes.flatMap(x=>[x.id+".component.tsx.txt",x.id+".schema.ts.txt"]).sort();
 if(JSON.stringify(actual)!==JSON.stringify(expected))
  errors.push("Template drift: unregistered or missing recipe templates");
 return errors.sort();
}
function schemaTest(recipe){
 const exportName=recipe.schemaExport,filename=recipe.schemaFile.slice(0,-3);
 return [
  'import test from "node:test";',
  'import assert from "node:assert/strict";',
  'import {'+exportName+'} from "./'+filename+'";',
  '/** PROPOSAL ONLY: runnable Zod fixture tests, not behavioral certification. */',
  'test("'+recipe.id+': valid props",()=>{assert.equal('+exportName+
    '.safeParse('+JSON.stringify(recipe.fixtures.valid)+').success,true);});',
  'test("'+recipe.id+': invalid/unapproved props",()=>{',
  'for(const value of '+JSON.stringify(recipe.fixtures.invalid)+')',
  'assert.equal('+exportName+'.safeParse(value).success,false);',
  '});',''
 ].join("\n");
}
function reviewDoc(recipe,scenario){
 return [
  "# Proposta: "+recipe.target,"",
  "**REVISÃO OBRIGATÓRIA. NÃO PUBLICADO NO CATÁLOGO PI.**","",
  "Cenário: "+scenario.id,"",
  "## Necessidade",scenario.need,"",
  "## Justificativa",scenario.reason,"",
  "## Dependências de componentes aprovados",
  ...scenario.dependencies.map(x=>"- "+x),"",
  "## Revisão obrigatória",
  "- [ ] Revisar schema Zod, variantes Base UI e UI no navegador.",
  "- [ ] Revisar eventuais efeitos colaterais, acessibilidade, responsividade e segurança.",
  "- [ ] Executar testes de schema gerados e testes comportamentais em navegador.",
  "- [ ] Revisão humana independente com PR, aprovação do contrato e versionamento.",
  "- [ ] Só uma etapa de admissão separada pode alterar lock, registry e contexto Pi.",
  "- [ ] Nenhum callback, JSX/HTML livre ou ação remota é autorizado pelo gerador.","",
  "## Testes comportamentais ainda não executados",
  ...scenario.tests.map(x=>"- [ ] ["+x[0]+"] "+x[1]),"",
  "## Riscos",
  ...scenario.risks.map(x=>"- "+x),"",
 ].join("\n");
}
export function createProposal(id){
 const issues=checkProposalRecipes();
 if(issues.length)throw Error(issues.join("\n"));
 const recipe=definitions.recipes.find(x=>x.id===id),scenario=byId.get(id);
 if(!recipe||!scenario)throw Error("Unknown or non-candidate scenario: "+id);
 const component=readFileSync(folder+id+".component.tsx.txt","utf8");
 const schema=readFileSync(folder+id+".schema.ts.txt","utf8");
 const test=schemaTest(recipe);
 parseSource(recipe.componentFile,component,true);
 parseSource(recipe.schemaFile,schema,false);
 parseSource(recipe.target+".schema.test.ts",test,false);
 if(!component.includes('from "./'+recipe.target+'.schema"') ||
    !schema.includes("export const "+recipe.schemaExport+"=") ||
    !schema.includes(".strict()"))
  throw Error(id+": invalid schema/component bindings or permissive schema");
 const files={
  [recipe.componentFile]:component,
  [recipe.schemaFile]:schema,
  [recipe.target+".schema.test.ts"]:test,
  "REVIEW.md":reviewDoc(recipe,scenario),
 };
 const hashes=Object.fromEntries(Object.entries(files).map(([k,v])=>[k,sha(v)]));
 files["manifest.json"]=JSON.stringify({
  schemaVersion:1,scenarioId:id,target:recipe.target,admission:"review-required",registryChannel:"experimental",
  approvedDependencies:scenario.dependencies,fileSha256:hashes,
  tests:scenario.tests.map(([mode,description])=>({mode,description,status:"planned-not-executed"})),
 },null,2)+"\n";
 return {id,target:recipe.target,files};
}
const args=process.argv.slice(2);
const check=args.includes("--check"),all=args.includes("--all");
const id=args.find(x=>x.startsWith("--id="))?.slice(5);
const issues=checkProposalRecipes();
if(issues.length){issues.forEach(e=>console.error("✗ "+e));process.exit(1);}
if((all&&id)||(!all&&!id&&!check)||args.some(x=>!["--check","--all"].includes(x)&&!x.startsWith("--id="))){
 console.error("Use --check, --all or --id=alert-typed");process.exit(2);
}
const selected=check||all?definitions.recipes.map(x=>x.id):[id];
for(const name of selected){
 const proposal=createProposal(name);
 if(!check){
  const target=resolve(out,name);
  if(!target.startsWith(resolve(out)+sep))throw Error("Unsafe output path");
  mkdirSync(target,{recursive:true});
  const expected=new Set(Object.keys(proposal.files));
  for(const existing of readdirSync(target))
   if(!expected.has(existing))throw Error("Unrecognized output; review existing directory: "+existing);
  for(const [filename,contents] of Object.entries(proposal.files))
   if(existsSync(join(target,filename))&&readFileSync(join(target,filename),"utf8")!==contents)
    throw Error("Refusing to overwrite changed proposal "+filename);
  for(const [filename,contents] of Object.entries(proposal.files))
   writeFileSync(join(target,filename),contents);
 }
 console.log("✓ "+name+": "+Object.keys(proposal.files).length+
    (check?" artifacts validated (no write)":" proposal artifacts written to "+out+name));
}
console.log("No Pi lock, registry or approved contract was modified.");
