/** Explainable, read-only Pi candidate selection using existing reviewed metadata.
 * Never converts semantic similarity into a contract, capability, event or permission.
 */
import {compareSemanticCapabilitySets} from '../../src/ui-runtime/semantic-comparison-core.mjs';

const stopwords = new Set([
  'a','ao','aos','as','com','como','da','das','de','do','dos','e','em','entre',
  'essa','esse','esta','este','eu','isso','mais','na','nas','no','nos','o','os',
  'ou','para','pela','pelo','por','pra','que','se','sem','ser','um','uma','uns','umas',
  'usar','utilizar','preciso','quero','componente','componentes','criar','exibir',
]);
const normalize = value => String(value ?? '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR')
  .replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const terms = text => [...new Set(normalize(text).split(' ')
  .filter(word => word.length >= 3 && !stopwords.has(word)))];
const match = (value, words) => {
  const available = new Set(terms(value));
  return words.filter(word => available.has(word));
};
const scoreDesc = (a,b) => b.score-a.score || a.type.localeCompare(b.type,'pt-BR');
const profileSource = profile => profile?.curatedSource ?? profile?.sources?.[0] ?? null;

/**
 * Contracts must be independently vetted by the caller. This function checks
 * lifecycle/stability again and refuses to select any non-stable entry.
 * @param {{requirement:string,contracts:object[],profiles:object[],allowedTypes?:string[],limit?:number}} input
 */
export function selectPiSemanticCandidates({requirement,contracts,profiles,allowedTypes,limit=10}) {
  if (typeof requirement !== 'string' || !requirement.trim() || requirement.length > 500)
    throw new Error('Informe --requirement com 1 a 500 caracteres.');
  if (!Array.isArray(contracts) || !Array.isArray(profiles))
    throw new Error('Catálogo e perfis semânticos são obrigatórios.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 25)
    throw new Error('O limite de candidatos deve estar entre 1 e 25.');
  const words=terms(requirement);
  const reviewed=new Map(profiles.map(profile=>[profile.component,profile]));
  const allowed=allowedTypes===undefined?null:new Set(allowedTypes);
  const candidates=contracts.filter(contract=>!allowed || allowed.has(contract.type)).map(contract=>{
    const profile=reviewed.get(contract.type);
    const nameHits=match(contract.type,words);
    const purposeHits=match(profile?.purpose,words);
    const positive=(profile?.whenUse??[]).map(excerpt=>({
      field:'whenUse',excerpt,matchedTerms:match(excerpt,words),
    })).filter(item=>item.matchedTerms.length>0)
      .sort((a,b)=>b.matchedTerms.length-a.matchedTerms.length || a.excerpt.localeCompare(b.excerpt,'pt-BR'));
    const negative=(profile?.whenNotUse??[]).map(excerpt=>({
      field:'whenNotUse',excerpt,matchedTerms:match(excerpt,words),
    })).filter(item=>words.length>0 && item.matchedTerms.length>=Math.max(2,Math.ceil(words.length*0.6)))
      .sort((a,b)=>b.matchedTerms.length-a.matchedTerms.length || a.excerpt.localeCompare(b.excerpt,'pt-BR'));
    const evidence=[
      ...(nameHits.length?[{field:'type',excerpt:contract.type,matchedTerms:nameHits}]:[]),
      ...(purposeHits.length?[{field:'purpose',excerpt:profile.purpose,matchedTerms:purposeHits}]:[]),
      ...positive.slice(0,2),
    ];
    const coverage=new Set(evidence.flatMap(item=>item.matchedTerms)).size;
    const score=nameHits.length*8+purposeHits.length*3+(positive[0]?.matchedTerms.length??0)*5;
    const stable=contract.lifecycle==='stable' && contract.stability==='stable' &&
      (contract.validation?.static==='approved' ||
        ['passed','ci-required'].includes(contract.validation?.e2e));
    const decision=!stable?'unavailable':
      negative.length?'avoid':
      score===0?'no-positive-evidence':
      'candidate';
    const rationale = !stable
      ? 'Contrato fora do canal Pi estável; documentação não autoriza sua seleção.'
      : negative.length
        ? 'A intenção coincide com uma orientação de quando evitar este componente.'
        : !score
          ? 'Não há evidência textual positiva suficiente para justificar a escolha.'
          : 'Correspondência consultiva com nome, finalidade ou quando usar; valide o schema Zod antes de gerar a interface.';
    return {
      type:contract.type,score,coverage:words.length?coverage/words.length:0,
      decision,piAvailable:stable,version:contract.version,
      stability:contract.stability,documentationReview:profile?.documentationReview??'unavailable',
      source:profileSource(profile),rationale,
      evidence,contraindications:negative.slice(0,3),
    };
  });
  const ranked=candidates.filter(c=>c.score>0 || c.contraindications.length>0)
    .sort((a,b)=>a.decision==='candidate'&&b.decision!=='candidate'?-1:
      b.decision==='candidate'&&a.decision!=='candidate'?1:scoreDesc(a,b));
  const positive=ranked.filter(c=>c.decision==='candidate');
  const first=positive[0], second=positive[1];
  // Require substantive coverage; lexical coincidences and ties must abstain.
  const confident=Boolean(first && words.length>0 && first.coverage>=0.6 &&
    (!second || (first.score-second.score>=3 && first.coverage>=second.coverage)));
  const status=confident?'recommended':positive.length?'ambiguous':'no-match';
  const selectedType=confident?first.type:null;
  const pairSource=first??ranked[0]??null;
  const comparison=pairSource?ranked.filter(c=>c.type!==pairSource.type).slice(0,3).map(other=>{
    const left=reviewed.get(pairSource.type),right=reviewed.get(other.type);
    const outcome=compareSemanticCapabilitySets({
      name:pairSource.type,capabilities:left?.capabilities??[],
    },{
      name:other.type,capabilities:right?.capabilities??[],
    });
    return {
      primary:pairSource.type,alternative:other.type,
      documentaryOverlap:outcome.shared.map(item=>({
        id:item.id,primaryState:item.left.state,alternativeState:item.right.state,
      })),
      primaryOnly:outcome.onlyLeft.map(item=>({id:item.id,state:item.state})),
      alternativeOnly:outcome.onlyRight.map(item=>({id:item.id,state:item.state})),
      note:'IDs comuns são apenas coincidências documentais; ausência de registro não prova ausência de implementação nem equivalência de APIs.',
    };
  }):[];
  return {
    schemaVersion:1,authority:'advisory-only',requirement,terms:words,
    status,selectedType,evaluated:candidates.length,candidates:ranked.slice(0,limit),
    comparison,
    selectionPolicy:'A escolha é orientativa: apenas contratos estáveis já admitidos, schemas Zod e ações autorizadas podem ser usados. Empates, baixa cobertura e lacunas exigem revisão explícita; nenhum contrato é promovido.',
  };
}
