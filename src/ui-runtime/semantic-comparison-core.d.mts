export type ComparedCapabilityRecord = {id: string; description: string; state: string};
export declare function compareSemanticCapabilitySets<T extends ComparedCapabilityRecord>(
  left: {name: string; capabilities: readonly T[]},
  right: {name: string; capabilities: readonly T[]},
): {
  shared: {id: string; left: T; right: T}[];
  onlyLeft: T[];
  onlyRight: T[];
};
