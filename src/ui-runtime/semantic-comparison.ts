import {compareSemanticCapabilitySets} from './semantic-comparison-core.mjs';
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

/** Shared with Pi's advisory selector; IDs are documentary, never equivalent APIs. */
export function compareSemanticContracts(left: SemanticComparisonEntry, right: SemanticComparisonEntry) {
 return compareSemanticCapabilitySets(left,right);
}
