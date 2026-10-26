/* eslint-disable @typescript-eslint/no-explicit-any -- Every public prop is restricted by the Zod catalog and validated specs. */
import { defineRegistry } from "@json-render/react";
import { toast } from "sonner";
import { catalog, experimentalCatalog, certifiedExperimentalNames } from "./catalog";
import { experimentalImplementations } from "./admission-engine/generated/implementations";
import { playgroundImplementations } from "./components/playground";
import { extensionImplementations } from "./extensions/registry";

/** Exactly one implementation per approved catalog component. */
export const componentImplementations = {
  ...playgroundImplementations, ...extensionImplementations,
  ...Object.fromEntries(Object.entries(experimentalImplementations)
    .filter(([type])=>certifiedExperimentalNames.has(type))),
};
export const experimentalComponentImplementations = {
  ...playgroundImplementations, ...extensionImplementations, ...experimentalImplementations,
};

export const actionImplementations = {
  // Built-in state actions are processed by ActionProvider; entries preserve the contract.
  setState: async () => {},
  pushState: async () => {},
  removeState: async () => {},
  buttonClick: async (params: any) => {toast.success(params.message??"Ação demonstrativa executada.");},
  formSubmit: async (params: any) => {toast.info(`${params.formName??"Formulário"}: persistência desabilitada neste exemplo.`);},
  linkClick: async (params: any) => {toast.info(`Navegação demonstrativa: ${params.href}`);},
};

export const { registry } = defineRegistry(catalog, { components: componentImplementations, actions: actionImplementations });

/** Explicit opt-in registry: experimental contracts remain local-only. */
export const { registry: experimentalRegistry } = defineRegistry(experimentalCatalog, {
  components: experimentalComponentImplementations, actions: actionImplementations,
});
