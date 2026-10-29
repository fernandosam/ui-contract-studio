import { createTreeEditSession } from "../../scripts/lib/spec-tree-history.mjs";
import { applyPiTreePatch } from "./tree-operations";

/** Channel selection belongs to the trusted host; patches cannot grant permissions. */
export function createPiTreeEditSession(
  spec: unknown,
  channel: "stable" | "experimental" = "stable",
) {
  return createTreeEditSession(spec, (current, patch) => applyPiTreePatch(current, patch, channel));
}
