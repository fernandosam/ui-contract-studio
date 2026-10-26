import { z } from "zod"

/**
 * APIs semânticas opt-in de cinco exemplos locais ReUI.
 * Não são contratos Pi: dados recebidos aqui não criam permissões no catálogo oficial.
 * Todos os campos são texto simples, booleanos ou coleções de tamanho limitado.
 */
const label = z.string().trim().min(1).max(120)
const description = z.string().trim().min(1).max(600)
const identifier = z.string().regex(/^[a-z][a-z0-9-]{0,39}$/)

export const reuiSemanticSchemas = {
  "c-accordion-1": z.object({
    items: z.array(z.object({
      id: identifier,
      title: label,
      description,
    }).strict()).min(1).max(8).superRefine((items, ctx) => {
      const seen = new Set<string>()
      items.forEach((item, index) => {
        if (seen.has(item.id)) {
          ctx.addIssue({ code: "custom", path: [index, "id"], message: "IDs devem ser únicos" })
        }
        seen.add(item.id)
      })
    }),
  }).strict(),
  "c-alert-1": z.object({ title: label, description }).strict(),
  "c-checkbox-1": z.object({ label, checkedInitially: z.boolean() }).strict(),
  "c-input-1": z.object({ placeholder: label, accessibleName: label }).strict(),
  "c-dialog-1": z.object({
    triggerLabel: label,
    title: label,
    description,
    nameLabel: label,
    usernameLabel: label,
    saveLabel: label,
    cancelLabel: label,
    initialName: label,
    initialUsername: label,
  }).strict(),
} as const

export type ReuiConfigurableId = keyof typeof reuiSemanticSchemas
export type ReuiSemanticDataFor<K extends ReuiConfigurableId> = z.infer<(typeof reuiSemanticSchemas)[K]>
export type ReuiSemanticData = { [K in ReuiConfigurableId]: ReuiSemanticDataFor<K> }[ReuiConfigurableId]

export const reuiSemanticDefaults: { [K in ReuiConfigurableId]: ReuiSemanticDataFor<K> } = {
  "c-accordion-1": {
    items: [
      { id: "item-1", title: "Is it accessible ?", description: "Yes. It adheres to the WAI-ARIA design pattern." },
      { id: "item-2", title: "Is it styled?", description: "Yes. It comes with default styles that matches the other components' aesthetic." },
      { id: "item-3", title: "Is it animated?", description: "Yes. It's animated by default, but you can disable it if you prefer." },
    ],
  },
  "c-alert-1": { title: "Alert!", description: "This is an alert with a title and description." },
  "c-checkbox-1": { label: "Basic checkbox", checkedInitially: false },
  "c-input-1": { placeholder: "Basic Input", accessibleName: "Basic Input" },
  "c-dialog-1": {
    triggerLabel: "Basic Dialog",
    title: "Edit profile",
    description: "Make changes to your profile here. Click save when you're done. Your profile will be updated immediately.",
    nameLabel: "Name",
    usernameLabel: "Username",
    saveLabel: "Save changes",
    cancelLabel: "Cancel",
    initialName: "Pedro Duarte",
    initialUsername: "@peduarte",
  },
}

export function isConfigurableReuiId(id: string): id is ReuiConfigurableId {
  return Object.prototype.hasOwnProperty.call(reuiSemanticSchemas, id)
}

/** Validação também na entrada React: não confie somente na edição via explorador. */
export function parseReuiSemanticData<K extends ReuiConfigurableId>(
  id: K,
  value?: unknown,
): ReuiSemanticDataFor<K> {
  return reuiSemanticSchemas[id].parse(value ?? reuiSemanticDefaults[id]) as ReuiSemanticDataFor<K>
}
