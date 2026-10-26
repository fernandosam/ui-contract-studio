import type { Spec } from "@json-render/core";
import { Renderer, StateProvider, ActionProvider, VisibilityProvider, ValidationProvider } from "@json-render/react";
import { catalog, experimentalCatalog, stableComponentDefinitions, unifiedComponentDefinitions, stableComponentEventDescriptors, experimentalComponentEventDescriptors } from "../ui-catalog/catalog";
import { registry, experimentalRegistry, actionImplementations } from "../ui-catalog/registry";
import { CompositeRegistryContext } from "../ui-catalog/composite-registry-context";
import { graphErrors } from "../../scripts/lib/spec-invariants.mjs";
import { actionDefinitions } from "../ui-catalog/catalog";

/** Validation BEFORE rendering: no unknown types, invalid props, orphan nodes or out-of-catalog actions. */
export function SpecScreen({spec,channel="stable"}:{spec:unknown;channel?:"stable"|"experimental"}) {
  const isExperimental = channel==="experimental";
  const checked=isExperimental?experimentalCatalog.validate(spec):catalog.validate(spec);
  const definitions=isExperimental?unifiedComponentDefinitions:stableComponentDefinitions;
  const events=isExperimental?experimentalComponentEventDescriptors:stableComponentEventDescriptors;
  const runtimeRegistry=isExperimental?experimentalRegistry:registry;
  const issues=graphErrors(spec,Object.keys(definitions),{allowedActions:Object.keys(actionDefinitions),allowedEvents:events});
  if (!checked.success || issues.length) {
    console.error("Spec bloqueada",!checked.success?checked.error:issues);
    return <main role="alert" className="ui-error">A interface foi bloqueada: especificação não autorizada.</main>;
  }
  const valid=checked.data as unknown as Spec;
  return <CompositeRegistryContext.Provider value={runtimeRegistry}><StateProvider initialState={valid.state??{}}><VisibilityProvider><ValidationProvider><ActionProvider handlers={{ buttonClick: actionImplementations.buttonClick, formSubmit: actionImplementations.formSubmit, linkClick: actionImplementations.linkClick }}><Renderer spec={valid} registry={runtimeRegistry} /></ActionProvider></ValidationProvider></VisibilityProvider></StateProvider></CompositeRegistryContext.Provider>;
}
