/** Code-owned capability, not a property in agent-generated JSON. */
export type DataSourceCapabilities = Readonly<{ remoteData: boolean }>;
export declare function canReadDataSource(
  sourceId: string,
  capabilities?: DataSourceCapabilities,
): boolean;
