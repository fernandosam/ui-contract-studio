import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { summarizeShadcnBlockSources, validateShadcnSourceEvidence, gitBlobSha } from "./shadcn-block-sources.mjs";

const unique = xs => [...new Set(xs)].sort();
const origin = "apps/v4/registry/bases/base/blocks/";
const snapshots = "audits/upstream/shadcn-blocks/";

export function analyzeShadcnBlocks({root, inventory, pins, reviews, manifest, contracts, approved}) {
  const file = path => resolve(root,path);
  const errors=[],records=[];
  const baseline=new Set(reviews.baselineBlockIds);
  const decisions=new Map();
  const slugs=new Set(),ids=new Set(),usedFiles=new Set();
  if(pins.schemaVersion!==2 || reviews.schemaVersion!==1)
    errors.push("Invalid shadcn source pin or decision schema");
  for(const decision of reviews.entries){
    if(decisions.has(decision.blockId))errors.push(decision.blockId+": duplicate shadcn decision");
    decisions.set(decision.blockId,decision);
  }
  for(const block of inventory.blocks){
    if(ids.has(block.id)||slugs.has(block.name))errors.push(block.name+": duplicate block ID or slug");
    ids.add(block.id);slugs.add(block.name);
    const revision=pins.pins[block.name];
    if(!/^[a-f0-9]{40}$/.test(revision??""))
      errors.push(block.name+": immutable upstream revision required");
    const upstreamFiles=[];
    for(const sourcePath of block.sourceFiles){
      if(!sourcePath.startsWith(origin+block.name+"/")||!/^[a-z0-9/_.-]+$/.test(sourcePath)){
        errors.push(block.name+": invalid upstream source path "+sourcePath);
        continue;
      }
      const path=snapshots+sourcePath.slice(origin.length);
      usedFiles.add(path);
      if(!existsSync(file(path))){
        errors.push(block.name+": missing official upstream source snapshot "+path);
        continue;
      }
      const content=readFileSync(file(path),"utf8");
      if(gitBlobSha(content)!==pins.sourceBlobs[sourcePath])
        errors.push(block.name+": pinned upstream Git blob integrity mismatch "+sourcePath);
      upstreamFiles.push({path:sourcePath,content});
    }
    const evidence=upstreamFiles.length===block.sourceFiles.length &&
      /^[a-f0-9]{40}$/.test(revision??"") ?
      summarizeShadcnBlockSources(block,upstreamFiles,revision):null;
    if(evidence)errors.push(...validateShadcnSourceEvidence(block,evidence));
    const review=decisions.get(block.id);
    if(!review||review.blockSlug!==block.name||
      !["declarative","react","reuse-primitive","defer"].includes(review.implementation)||
      !["existing-approved","reviewed","review-required"].includes(review.reviewStatus)||
      !review.reason?.trim())
      errors.push(block.name+": explicit implementation/review decision required");
    if(review?.reviewStatus==="existing-approved"&&!baseline.has(block.id))
      errors.push(block.name+": new block cannot claim legacy approval");
    if(review?.reviewStatus==="reviewed"&&
      (!review.reviewer?.trim()||!/^\d{4}-\d\d-\d\d$/.test(review.reviewedOn??"")||
      !review.reviewReference?.trim()))
      errors.push(block.name+": reviewed decision requires reviewer, date and reference");
    const exposed=approved.has(block.id);
    const generated=manifest.components.find(x=>x.name===block.id&&x.blockSlug===block.name);
    if(exposed && (!review || review.reviewStatus==="review-required" ||
      (review.reviewStatus==="existing-approved"&&!baseline.has(block.id))))
      errors.push(block.name+": blocked publication to Pi without reviewed decision");
    if(exposed&&review?.implementation==="defer")
      errors.push(block.name+": deferred integration cannot be admitted to Pi");
    if(exposed&&!generated)
      errors.push(block.name+": approved block must have generated composition entry");
    if(!exposed&&review?.reviewStatus==="existing-approved")
      errors.push(block.name+": legacy approved block missing from Pi lock");
    const adapted=contracts.find(x=>x.name===block.id)?.dependencies??[];
    const upstream=evidence?.dependencies??[];
    records.push({
      id:block.id,name:block.name,family:block.family,
      kind:"shadcn-block",implementation:review?.implementation??"review-required",
      reviewStatus:review?.reviewStatus??"review-required",
      reviewedBy:review?.reviewer??null,
      upstreamCommit:revision??null,upstreamFileCount:upstreamFiles.length,
      sourceFingerprint:evidence?.fingerprint??null,
      upstreamDependencies:upstream,
      externalPackages:evidence?.externalPackages??[],
      adaptedDependencies:adapted,
      absentFromAdaptation:upstream.filter(x=>!adapted.includes(x)),
      additionalInAdaptation:adapted.filter(x=>!upstream.includes(x)),
      signals:evidence?.signals??null,
      suggestedImplementation:evidence?.suggestedImplementation??"review-required",
      localTemplate:generated?.template??null,exposedToPi:exposed,
    });
  }
  for(const id of baseline)if(!ids.has(id))errors.push(id+": historical baseline block removed");
  for(const id of decisions.keys())if(!ids.has(id))errors.push(id+": orphan shadcn decision");
  for(const name of Object.keys(pins.pins))if(!slugs.has(name))errors.push(name+": orphan upstream pin");
  for(const path of Object.keys(pins.sourceBlobs))
    if(!usedFiles.has(snapshots+path.slice(origin.length)))errors.push(path+": orphan source blob");
  const walk=folder=>readdirSync(folder,{withFileTypes:true}).flatMap(entry=>
    entry.isDirectory()?walk(join(folder,entry.name)):[relative(root,join(folder,entry.name)).replaceAll("\\","/")]);
  for(const path of walk(file(snapshots)))
    if(!usedFiles.has(path))errors.push(path+": unregistered upstream source snapshot");
  records.sort((a,b)=>a.name.localeCompare(b.name));
  return {blocks:records,errors:unique(errors),sourceFiles:usedFiles.size};
}
