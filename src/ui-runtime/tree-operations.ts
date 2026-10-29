import { applyTreePatch, type TreePatchResult } from "../../scripts/lib/spec-tree-operations.mjs";
import {
  catalog, experimentalCatalog, stableComponentDefinitions,
  unifiedComponentDefinitions, stableComponentEventDescriptors,
  experimentalComponentEventDescriptors, actionDefinitions,
} from "../ui-catalog/catalog";

/** The only supported E08 entry point: real Zod + graph checks before/after every edit. */
export function applyPiTreePatch(
  spec: unknown, patch: unknown, channel: "stable" | "experimental" = "stable",
): TreePatchResult {
  if (channel === "experimental") return applyTreePatch(spec, patch, {
    validateSpec: candidate => experimentalCatalog.validate(candidate),
    allowedTypes: Object.keys(unifiedComponentDefinitions),
    allowedActions: Object.keys(actionDefinitions),
    allowedEvents: experimentalComponentEventDescriptors,
  });
  return applyTreePatch(spec, patch, {
    validateSpec: candidate => catalog.validate(candidate),
    allowedTypes: Object.keys(stableComponentDefinitions),
    allowedActions: Object.keys(actionDefinitions),
    allowedEvents: stableComponentEventDescriptors,
  });
}
