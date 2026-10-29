import { createContext } from "react";

/** Trusted host-owned capability. Never derive it from a JSON spec or component props. */
export type DataAccessCapabilities = Readonly<{ remoteData: boolean }>;
export const DataAccessContext = createContext<DataAccessCapabilities>(
  Object.freeze({ remoteData: false }),
);
