import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { extractPreviewTexts, transformReuiPreviewText, isReuiExampleModule } from "../src/ui-catalog/reui-preview-i18n";

const directory="src/ui-catalog/extensions/composites";
const translations=JSON.parse(readFileSync("src/ui-catalog/reui-preview-text.pt-BR.json","utf8")) as Record<string,string>;
const examples=readdirSync(directory).filter(isReuiExampleModule);

test("Gallery 3: all 559 example previews have complete pt-BR text coverage",()=>{
 assert.equal(examples.length,559);
 const needed=new Set<string>();
 for(const filename of examples){
  const source=readFileSync(join(directory,filename),"utf8");
  extractPreviewTexts(source,filename).forEach(s=>needed.add(s));
 }
 const missing=[...needed].filter(s=>!translations[s]?.trim());
 assert.deepEqual(missing,[], "Untranslated visible strings");
 assert.deepEqual(Object.keys(translations).sort(),[...needed].sort(),"Catalog must exactly match the currently compiled source");
});

test("Gallery 3: Alert content is translated in the TSX output without changing UI contracts",()=>{
 const filename="reui-alert-4.tsx";
 const source=readFileSync(join(directory,filename),"utf8");
 const transformed=transformReuiPreviewText(source,filename,translations,true);
 assert.ok(transformed.replacements>=5);
 assert.ok(!transformed.code.includes("Payment Failed"));
 assert.ok(!transformed.code.includes("Please check your payment details"));
 assert.ok(transformed.code.includes(translations["Payment Failed"]));
 assert.ok(transformed.code.includes('variant="destructive"'),"functional props are retained");
 assert.ok(transformed.code.includes('lucide="CircleAlertIcon"'),"icon names are retained");
 const tsx=ts.createSourceFile(filename,transformed.code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.deepEqual(tsx.parseDiagnostics,[],"localized TSX must parse");
});

test("Gallery 3: Button and Accordion previews also translate dynamic visible text",()=>{
 for(const filename of ["reui-button-1.tsx","reui-button-41.tsx","reui-accordion-1.tsx","reui-select-9.tsx"]){
  const source=readFileSync(join(directory,filename),"utf8");
  const transformed=transformReuiPreviewText(source,filename,translations,true);
  assert.ok(transformed.replacements>0,filename);
  assert.deepEqual(transformed.missing,[],filename);
  const tsx=ts.createSourceFile(filename,transformed.code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.deepEqual(tsx.parseDiagnostics,[],filename);
 }
});
