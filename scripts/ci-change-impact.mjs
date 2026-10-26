#!/usr/bin/env node
/** Fail-closed CI browser impact classification. Only changes to prose-only documentation skip browsers. */
import {execFileSync} from 'node:child_process';
import {appendFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export function isDocumentationOnly(files) {
  return files.length>0 && files.every(path =>
    /^(?:README(?:\.pt-BR)?\.md|CHANGELOG(?:\.pt-BR)?\.md|CONTRIBUTING\.md|LICENSE|docs\/[^\0]+\.(?:md|mdx)|\.github\/(?:ISSUE_TEMPLATE\/[^\0]+\.md|PULL_REQUEST_TEMPLATE\.md))$/.test(path)
  );
}
export function browserRequired(files) {
  return !isDocumentationOnly(files);
}
export function changedFiles(base,head='HEAD') {
  if(!/^[0-9a-f]{40}$/.test(base) || !(head==='HEAD'||/^[0-9a-f]{40}$/.test(head)))
    throw new Error('SHA de comparação inválido');
  const output=execFileSync('git',['diff','--name-only','-z',base,head],{encoding:'buffer'});
  return output.toString('utf8').split('\0').filter(Boolean);
}
function main() {
  const base=process.env.CHANGE_BASE_SHA;
  const files=changedFiles(base);
  const value=browserRequired(files)?'true':'false';
  if(!process.env.GITHUB_OUTPUT)throw new Error('GITHUB_OUTPUT ausente');
  appendFileSync(process.env.GITHUB_OUTPUT,'browser='+value+'\n');
  console.log('Browser impact: '+value+' ('+files.length+' changed files)');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try{main()}catch(e){console.error(e.message);process.exitCode=1}
}
