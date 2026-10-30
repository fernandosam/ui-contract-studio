/** Contract identities must come from the reviewed contracts.lock.json. */
export type CacheContract = Readonly<{
  name: string;
  version: string;
  fingerprint: string;
}>;
export type CacheRequest = Readonly<{
  scope: 'public-contract-derived';
  namespace: string;
  key: string;
  contracts: readonly CacheContract[];
}>;
export declare function createContractVersionedCache<T = unknown>(options?: {
  maxEntries?: number;
  ttlMs?: number;
  now?: () => number;
}): {
  get(request: CacheRequest): T | undefined;
  set(request: CacheRequest, value: T): boolean;
  clear(): void;
  size(): number;
};
