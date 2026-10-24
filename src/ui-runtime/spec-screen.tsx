import type { Spec } from "@json-render/core";
import { Renderer, StateProvider, ActionProvider, VisibilityProvider, ValidationProvider } from "@json-render/react";
import { catalog } from "../ui-catalog/catalog";
import { registry, actionImplementations } from "../ui-catalog/registry";
import { CompositeRegistryContext } from "../ui-catalog/composite-registry-context";
import { graphErrors } from "../../scripts/lib/spec-invariants.mjs";
import { componentDefinitions, componentEventDescriptors, actionDefinitions } from "../ui-catalog/catalog";

/** Validation BEFORE rendering: no unknown types, invalid props, orphan nodes or out-of-catalog actions. */
export function SpecScreen({spec}:{spec:unknown}) {
  const checked=catalog.validate(spec);
  const issues=graphErrors(spec,Object.keys(componentDefinitions),{allowedActions:Object.keys(actionDefinitions),allowedEvents:componentEventDescriptors});
  if (!checked.success || issues.length) {
    console.error("Spec bloqueada",!checked.success?checked.error:issues);
    return <main role="alert" className="ui-error">A interface foi bloqueada: especificação não autorizada.</main>;
  }
  const valid=checked.data as unknown as Spec;
  return <CompositeRegistryContext.Provider value={registry}><StateProvider initialState={valid.state??{}}><VisibilityProvider><ValidationProvider><ActionProvider handlers={{ buttonClick: actionImplementations.buttonClick, formSubmit: actionImplementations.formSubmit, linkClick: actionImplementations.linkClick }}><Renderer spec={valid} registry={registry} /></ActionProvider></ValidationProvider></VisibilityProvider></StateProvider></CompositeRegistryContext.Provider>;
}
