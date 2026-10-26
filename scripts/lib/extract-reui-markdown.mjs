const tidy = text => text.replace(/\r/g,"").replace(/<[^>]*>/g,"").trim();

const canonicalSection = heading => {
  const h=heading.toLowerCase();
  if(/for ai agents|para agente|para agentes/.test(h))return "agent-guidance";
  if(/when to use|quando usar/.test(h))return "when-use";
  if(/when not to use|quando n[aã]o usar/.test(h))return "when-not-use";
  if(/agent notes|notas do agente/.test(h))return "agent-notes";
  if(/what is|o que [eé]/.test(h))return "definition";
  if(/why use|por que usar|porque usar/.test(h))return "rationale";
  if(/features|funcionalidad|comportamentos/.test(h))return "features";
  if(/integrat|integra/.test(h))return "integrations";
  if(/frequently asked|d[uú]vidas frequentes/.test(h))return "faq";
  return "other";
};

/** Offline extraction of source Markdown into REVIEW-REQUIRED proposals. */
export function extractReuiMarkdown(markdown, component, sourceUrl) {
  if(typeof markdown!=="string" || markdown.length>500_000 || markdown.length<20)
    throw new Error("Invalid or oversized source Markdown");
  if(!/^[A-Z][A-Za-z0-9]+$/.test(component))throw new Error("Invalid component name");
  const expected="https://reui.io/components/"+
    component.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();
  if(sourceUrl!==expected)throw new Error("Source must be the exact official ReUI component page");
  const sections=[];
  let current=null;
  for(const raw of markdown.replace(/\r/g,"").split("\n")){
    const heading=raw.match(/^(#{2,4})\s+(.+?)\s*#*\s*$/);
    const bold=raw.match(/^\*\*([^*]+)\*\*\s*:?$/);
    if(heading || bold){
      const title=tidy((heading?.[2]??bold?.[1])??"");
      current={title,level:heading?.[1].length??4,kind:canonicalSection(title),lines:[]};
      sections.push(current);
    }else if(current && raw.trim()){
      current.lines.push(tidy(raw).slice(0,1000));
    }
  }
  const normalized=sections.map(x=>({title:x.title,kind:x.kind,
    text:x.lines.join("\n").slice(0,6000)}));
  const bulletList=kind=>sections.filter(x=>x.kind===kind).flatMap(x=>
    x.lines.filter(line=>/^\s*[-*]\s+/.test(line))
      .map(line=>line.replace(/^\s*[-*]\s+/,"").trim())).filter(Boolean);
  const extractRelations=()=>{
    const text=sections.filter(x=>x.kind==="integrations").map(x=>x.lines.join(" ")).join(" ");
    return [...new Set([...text.matchAll(/\b(?:Shadcn\s+)?(Button|Checkbox|Input|Badge|Alert|Popover|Sonner|Dialog|Tooltip|Select|Textarea|Table)\b/g)]
      .map(x=>x[1]))].sort();
  };
  const faq=sections.filter(x=>x.level>=3 && x.kind==="other" && /\?$/.test(x.title));
  return {
    schemaVersion:1,component,source:{provider:"ReUI",url:sourceUrl},
    proposalStatus:"review-required",piAdmission:"not-authorized",
    extractionNote:"Offline Markdown parsing; headings and prose are unverified claims, not implemented behavior. Curate before committing an overlay.",
    sections:normalized,
    guidance:{whenUse:bulletList("when-use"),whenNotUse:bulletList("when-not-use"),
      agentNotes:bulletList("agent-notes")},
    integrationCandidates:extractRelations().map(name=>({component:name,status:"documentation-only"})),
    faqQuestions:faq.map(x=>({question:x.title,sourceSection:x.title})),
  };
}
