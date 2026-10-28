/**
 * Read-only indexes over the semantic report. The profile/capability records and
 * the versioned ReUI baseline remain the sources of truth; these indexes do not
 * assess runtime behavior or admit Pi contracts.
 */
export function buildSemanticCoverage({profiles, reuiExamples = [], reuiFamilies = []}) {
  const sort = values => [...values].sort((a, b) => a.localeCompare(b));
  const familyNames = sort(new Set([...reuiFamilies, ...reuiExamples.map(item => item.family)]));
  const familySet = new Set(familyNames);
  const guidanceSet = new Set(reuiFamilies);
  const examplesByFamily = new Map(familyNames.map(name => [name, []]));
  for (const example of reuiExamples) examplesByFamily.get(example.family).push(example.exampleId ?? example.id);

  const counts = capabilities => ({
    implementedStaticEvidence: capabilities.filter(item => item.state === "implemented-static-evidence").length,
    documentedNotImplemented: capabilities.filter(item => item.state === "documented-not-implemented").length,
    runtimeReviewRequired: capabilities.filter(item => item.state === "runtime-review-required").length,
  });
  const components = [...profiles].sort((a,b) => a.component.localeCompare(b.component)).map(profile => {
    const capabilities = profile.capabilities ?? [];
    const classified = counts(capabilities);
    const curated = !!profile.curatedSource;
    return {
      component: profile.component,
      reuiFamily: familySet.has(profile.component) ? profile.component : null,
      documentation: curated ? profile.documentationReview : "guidance-only",
      overlay: profile.curatedSource ?? null,
      sources: profile.sources,
      capabilityCounts: classified,
      // Resolve IDs against profiles[].capabilities for exact code needles.
      verifiedStaticCapabilityIds: sort(capabilities.filter(x => x.state === "implemented-static-evidence").map(x => x.id)),
      notImplementedCapabilityIds: sort(capabilities.filter(x => x.state === "documented-not-implemented").map(x => x.id)),
      insufficientRuntimeEvidenceCapabilityIds: sort(capabilities.filter(x => x.state === "runtime-review-required").map(x => x.id)),
      documentationGap: !curated,
      piContractListed: profile.approvedPiType,
      authorization: "not-granted-by-semantic-coverage",
    };
  });
  const componentByName = new Map(components.map(item => [item.component, item]));
  const families = familyNames.map(family => {
    const item = componentByName.get(family);
    const exampleIds = sort(examplesByFamily.get(family) ?? []);
    return {
      family,
      guidance: guidanceSet.has(family) ? "present" : "missing",
      overlay: item?.overlay ?? null,
      documentation: item?.documentation ?? "missing",
      inventoryExampleCount: exampleIds.length,
      // IDs link to reuiExampleProfiles[].source, never to an implied Pi API.
      inventoryExampleIds: exampleIds,
      capabilityCounts: item?.capabilityCounts ?? counts([]),
      documentationGap: !item?.overlay,
    };
  });
  const total = counts(profiles.flatMap(profile => profile.capabilities ?? []));
  return {
    sourcePaths: {
      inventory: "src/ui-catalog/reui-primitive-source-baseline.json",
      reuiGuidance: "src/ui-catalog/reui-guidance.json",
      curatedOverlays: "src/ui-catalog/knowledge/",
      staticEvidence: "profiles[].capabilities[].evidence[] (exact path and contains needle)",
    },
    interpretation: {
      implementedStaticEvidence: "Code text evidence verified by semantic:check; NOT a runtime/E2E certification or Pi authorization.",
      documentedNotImplemented: "Implementation gap; documentation is not an available capability.",
      runtimeReviewRequired: "Insufficient runtime evidence; cannot claim implementation from documentation or static code alone.",
      documentationGap: "No curated overlay for the family/component; does NOT imply absent implementation.",
    },
    totals: {
      inventoryFamilies: familyNames.filter(name => (examplesByFamily.get(name)?.length ?? 0) > 0).length,
      guidanceFamilies: familyNames.filter(name => guidanceSet.has(name)).length,
      curatedFamilies: families.filter(item => !!item.overlay).length,
      familiesWithDocumentationGaps: families.filter(item => item.documentationGap).length,
      inventoryExamples: reuiExamples.length,
      indexedComponents: components.length,
      curatedComponents: components.filter(item => !!item.overlay).length,
      componentsWithDocumentationGaps: components.filter(item => item.documentationGap).length,
      capabilities: total,
      implementationGaps: total.documentedNotImplemented,
      insufficientRuntimeEvidence: total.runtimeReviewRequired,
    },
    families,
    components,
  };
}
