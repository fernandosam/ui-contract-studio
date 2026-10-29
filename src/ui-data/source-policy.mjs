/** Pure, fail-closed boundary: a JSON spec cannot grant network permissions. */
export function canReadDataSource(sourceId, capabilities) {
  if (sourceId === "demo-processos") return true;
  return sourceId === "processos-api" && capabilities?.remoteData === true;
}
