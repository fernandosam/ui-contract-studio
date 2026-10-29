import { defineRegistry } from "@json-render/react";
import { toast } from "sonner";
import { catalog, experimentalCatalog, certifiedExperimentalNames, actionDefinitions } from "./catalog";
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
  // Runtime inputs (including state bindings) are untrusted even after spec validation.
  buttonClick: async (raw: unknown) => {
    const parsed=actionDefinitions.buttonClick.params.safeParse(raw);
    if(!parsed.success)throw Error("Parâmetros de ação local inválidos");
    toast.success(parsed.data.message??"Ação demonstrativa executada.");
  },
  formSubmit: async (raw: unknown) => {
    const parsed=actionDefinitions.formSubmit.params.safeParse(raw);
    if(!parsed.success)throw Error("Parâmetros de ação local inválidos");
    toast.info(`${parsed.data.formName??"Formulário"}: persistência desabilitada neste exemplo.`);
  },
  linkClick: async (raw: unknown) => {
    const parsed=actionDefinitions.linkClick.params.safeParse(raw);
    if(!parsed.success)throw Error("Parâmetros de ação local inválidos");
    toast.info(`Navegação demonstrativa: ${parsed.data.href}`);
  },
};

export const { registry } = defineRegistry(catalog, { components: componentImplementations, actions: actionImplementations });

/** Explicit opt-in registry: experimental contracts remain local-only. */
export const { registry: experimentalRegistry } = defineRegistry(experimentalCatalog, {
  components: experimentalComponentImplementations, actions: actionImplementations,
});
