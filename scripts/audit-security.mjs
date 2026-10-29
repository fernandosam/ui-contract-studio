#!/usr/bin/env node
/**
 * E09: cheap, offline guard for committed credentials and CI evidence retention.
 * This is intentionally not a replacement for GitHub secret scanning or npm audit.
 * Never emit a matching value to CI logs.
 */
import {execFileSync} from "node:child_process";
import {readFileSync,statSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

const signatures=[
 ["private-key",/-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/g],
 ["openai-key",/\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}\b/g],
 ["anthropic-key",/\bsk-ant-[A-Za-z0-9_-]{20,}\b/g],
 ["github-token",/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
 ["aws-access-key",/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
 ["slack-token",/\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
 ["age-private-identity",/\bAGE-SECRET-KEY-1[A-Z0-9]{40,}\b/g],
];

export function inspectTrackedFile(path,content){
 const issues=[];
 if(/(?:^|\/)\.env(?:\.[^/]*)?$/.test(path)&&
    !/\.env\.(?:example|sample|template)$/.test(path))
  issues.push("tracked-environment-file");
 if(/\.(?:pem|p12|pfx|key)$/.test(path))issues.push("tracked-private-key-file");
 if(typeof content!=="string"||content.includes("\0"))return issues;
 for(const [id,pattern] of signatures){
  pattern.lastIndex=0;
  if(pattern.test(content))issues.push(id);
 }
 if(/(?:^|\/)\.npmrc$/.test(path)&&
    /(?:_authToken|_password)\s*=\s*(?!\$\{)[^\s]+/.test(content))
  issues.push("npm-credential");
 if(/^\.github\/workflows\/[^/]+\.ya?ml$/.test(path)){
  const lines=content.split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
   if(!/uses:\s*actions\/upload-artifact@v4\s*$/.test(lines[i]))continue;
   let end=i+1;
   // Stop at the next step, not at the nested "with" or "path" properties.
   while(end<lines.length&&!/^\s{0,8}-\s+(?:name|uses|run):/.test(lines[end]))end++;
   const block=lines.slice(i+1,end).join("\n");
   const retention=block.match(/\bretention-days:\s*(\d+)\b/);
   if(!retention||Number(retention[1])>14||Number(retention[1])<1)
    issues.push("artifact-retention-missing-or-over-14d");
   if(/\beval-results\//.test(block)||/reports\/pi-eval\/runs\//.test(block))
    issues.push("raw-pi-output-in-artifact");
  }
 }
 return [...new Set(issues)];
}

export function auditTrackedFiles(files){
 const findings=[];
 for(const {path,content} of files){
  for(const issue of inspectTrackedFile(path,content))findings.push({path,issue});
 }
 return findings;
}

function run(){
 const names=execFileSync("git",["ls-files","-z"],{encoding:"utf8",maxBuffer:16*1024*1024})
  .split("\0").filter(Boolean);
 if(!names.length)throw Error("No tracked files: security audit must run from repository root");
 const files=names.map(path=>{
  const stat=statSync(path);
  if(!stat.isFile())return {path,content:""};
  return {path,content:readFileSync(path,"utf8")};
 });
 const findings=auditTrackedFiles(files);
 for(const item of findings)console.error("SECURITY: "+item.path+" ["+item.issue+"]");
 if(findings.length){
  console.error("Security audit blocked "+findings.length+" finding(s). Values were not printed.");
  process.exitCode=1;
 }else console.log("Security audit: tracked secrets and CI retention policy checks passed.");
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{run()}catch{console.error("Security audit could not inspect tracked files; fail closed.");process.exitCode=1}
}
