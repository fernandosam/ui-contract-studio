/** Advisory semantic comparison of existing catalog records. Not an admission policy. */
export type ComparedCapability = {
 id: string;
 description: string;
 state: string;
};

export type SemanticComparisonEntry = {
 name: string;
 description?: string;
 purpose?: string;
 whenUse: readonly string[];
 whenNotUse: readonly string[];
 capabilities: readonly ComparedCapability[];
 version?: string;
 maturity?: string;
 piAvailable: boolean;
 reviewed: boolean;
 sourceUrl?: string;
 sourceProvider?: string;
 reviewedOn?: string;
};

export type CapabilityPair = { id: string; left: ComparedCapability; right: ComparedCapability };

const byId = (items: readonly ComparedCapability[]) =>
 new Map(items.filter(item => item.id.trim()).map(item => [item.id, item] as const));

const byName = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id, 'pt-BR');

/** Shared identifiers are documentary overlaps, never proof of equivalent APIs. */
export function compareSemanticContracts(left: SemanticComparisonEntry, right: SemanticComparisonEntry) {
 if (left.name === right.name) throw new Error('Selecione componentes diferentes para comparar.');
 const leftIds = byId(left.capabilities);
 const rightIds = byId(right.capabilities);
 const shared: CapabilityPair[] = [...leftIds.entries()]
  .filter(([id]) => rightIds.has(id))
  .map(([id, capability]) => ({ id, left: capability, right: rightIds.get(id)! }))
  .sort(byName);
 const onlyLeft = [...leftIds.values()].filter(item => !rightIds.has(item.id)).sort(byName);
 const onlyRight = [...rightIds.values()].filter(item => !leftIds.has(item.id)).sort(byName);
 return { shared, onlyLeft, onlyRight };
}
