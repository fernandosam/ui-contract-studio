import type { Spec } from "@json-render/core";
import { Renderer, StateProvider, ActionProvider, VisibilityProvider, ValidationProvider } from "@json-render/react";
import { catalog, experimentalCatalog, stableComponentDefinitions, unifiedComponentDefinitions, stableComponentEventDescriptors, experimentalComponentEventDescriptors } from "../ui-catalog/catalog";
import { registry, experimentalRegistry, actionImplementations } from "../ui-catalog/registry";
import { CompositeRegistryContext } from "../ui-catalog/composite-registry-context";
import { graphErrors } from "../../scripts/lib/spec-invariants.mjs";
import { actionDefinitions } from "../ui-catalog/catalog";
import { DataAccessContext } from "../ui-data/data-access-context";

/** Validation BEFORE rendering: no unknown types, invalid props, orphan nodes or out-of-catalog actions. */
export function SpecScreen({spec,channel="stable",remoteDataEnabled=false}:{spec:unknown;channel?:"stable"|"experimental";remoteDataEnabled?:boolean}) {
  const isExperimental = channel==="experimental";
  const checked=isExperimental?experimentalCatalog.validate(spec):catalog.validate(spec);
  const definitions=isExperimental?unifiedComponentDefinitions:stableComponentDefinitions;
  const events=isExperimental?experimentalComponentEventDescriptors:stableComponentEventDescriptors;
  const runtimeRegistry=isExperimental?experimentalRegistry:registry;
  const issues=graphErrors(spec,Object.keys(definitions),{allowedActions:Object.keys(actionDefinitions),allowedEvents:events});
  if (!checked.success || issues.length) {
    // Do not emit untrusted props/values to console diagnostics.
    console.warn("Spec bloqueada: contrato ou estrutura inválida.");
    return <main role="alert" className="ui-error">A interface foi bloqueada: especificação não autorizada.</main>;
  }
  const valid=checked.data as unknown as Spec;
  // Network capability is owned by the trusted host, never by the validated JSON tree.
  return <DataAccessContext.Provider value={{remoteData:remoteDataEnabled===true}}><CompositeRegistryContext.Provider value={runtimeRegistry}><StateProvider initialState={valid.state??{}}><VisibilityProvider><ValidationProvider><ActionProvider handlers={{ buttonClick: actionImplementations.buttonClick, formSubmit: actionImplementations.formSubmit, linkClick: actionImplementations.linkClick }}><Renderer spec={valid} registry={runtimeRegistry} /></ActionProvider></ValidationProvider></VisibilityProvider></StateProvider></CompositeRegistryContext.Provider></DataAccessContext.Provider>;
}
