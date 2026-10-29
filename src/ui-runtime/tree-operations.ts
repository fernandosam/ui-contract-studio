import { applyTreePatch, type TreePatchResult } from "../../scripts/lib/spec-tree-operations.mjs";
import {
  catalog, experimentalCatalog, stableComponentDefinitions,
  unifiedComponentDefinitions, stableComponentEventDescriptors,
  experimentalComponentEventDescriptors, actionDefinitions,
} from "../ui-catalog/catalog";
import { evaluateLayoutQuality } from "../ui-requirements/layout-quality";
import type { RequirementSpec } from "../ui-requirements/schema";
import type { PatternRequirements } from "../ui-requirements/patterns";

/**
 * Critical deterministic contract checks, deliberately separate from the
 * advisory layout quality score. Styling suggestions and browser measurements
 * are NOT certification or admission gates.
 */
const HARD_LAYOUT_RULES = new Set([
  "registration-root", "registration-first", "registration-last",
  "registration-container", "registration-order", "registration-sections",
  "registration-fields", "registration-references", "registration-columns",
  "registration-limits", "registration-centered", "registration-grid",
  "registration-dom", "registration-stacks",
  "pattern-root", "pattern-order", "pattern-content", "pattern-closing",
  "pattern-region", "pattern-membership", "pattern-references",
  "pattern-columns", "pattern-limits", "pattern-content-count",
  "pattern-container", "pattern-grid", "pattern-reading-order",
  "pattern-stacks",
]);

/**
 * The caller provides requirements from the trusted requirements engine.
 * Patches never supply, modify or select their own layout policy.
 */
export type TreeLayoutContext = RequirementSpec | PatternRequirements;
function validateSemanticLayout(spec: unknown, context?: TreeLayoutContext) {
  if (!context) return { success: true };
  const report = evaluateLayoutQuality(context, spec);
  return { success: report !== null &&
    !report.findings.some(finding => HARD_LAYOUT_RULES.has(finding.code)) };
}

/** E08: real Zod + graph/authorization + structural/semantic layout checks per edit. */
export function applyPiTreePatch(
  spec: unknown, patch: unknown, channel: "stable" | "experimental" = "stable",
  layoutContext?: TreeLayoutContext,
): TreePatchResult {
  const validateLayout = (candidate: unknown) => validateSemanticLayout(candidate, layoutContext);
  if (channel === "experimental") return applyTreePatch(spec, patch, {
    validateSpec: candidate => experimentalCatalog.validate(candidate),
    allowedTypes: Object.keys(unifiedComponentDefinitions),
    allowedActions: Object.keys(actionDefinitions),
    allowedEvents: experimentalComponentEventDescriptors,
    validateLayout,
  });
  return applyTreePatch(spec, patch, {
    validateSpec: candidate => catalog.validate(candidate),
    allowedTypes: Object.keys(stableComponentDefinitions),
    allowedActions: Object.keys(actionDefinitions),
    allowedEvents: stableComponentEventDescriptors,
    validateLayout,
  });
}
