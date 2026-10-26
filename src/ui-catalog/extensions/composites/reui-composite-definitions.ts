import { z } from "zod"
import reuiGuidance from "@/ui-catalog/reui-guidance.json"
import reuiExampleGuidance from "@/ui-catalog/reui-example-guidance.pt-BR.json"
import { isConfigurableReuiId, type ReuiSemanticData } from "./reui-semantic-config"

/**
 * Manifesto revisável de componentes React ReUI: preserva exemplo, proveniência,
 * orientação de uso e restrições de entrada. NÃO altera os contratos Pi aprovados.
 */
export const reuiCompositePropsSchema = z.object({
  width: z.enum(["sm", "md", "lg", "full"]).optional(),
  align: z.enum(["start", "center", "end"]).optional(),
}).strict()

export type ReuiCompositeProps = z.infer<typeof reuiCompositePropsSchema> & { data?: ReuiSemanticData }

export type ReuiCompositeDescriptor = Readonly<{
  id: string
  name: string
  kind: string
  title: string
  sourcePath: string
  sourceUrl: string
  bestFor: string
  whenNotUse: readonly string[]
  whenUse: readonly string[]
  familyWhenNotUse: readonly string[]
  agentNotes: readonly string[]
  exampleProps: Readonly<ReuiCompositeProps>
  configurable: boolean
  status: "react-composite"
}>

type ReuiExampleGuide = {
  bestFor: string
  whenNotUse: string[]
  sourceUrl: string
  language: "pt-BR"
}
type FamilyGuide = {
  whenUse: string[]
  whenNotUse: string[]
  agentNotes: string[]
  examples: [title: string, id: string][]
}
const families = reuiGuidance as unknown as Record<string, FamilyGuide>
const examples = reuiExampleGuidance as Record<string, ReuiExampleGuide>
const basename = (kind: string) => kind.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()

/** 559 entradas: cada id corresponde a um arquivo TSX local e um componente React. */
export const reuiCompositeCatalog: readonly ReuiCompositeDescriptor[] = Object.freeze(
  Object.entries(families).flatMap(([kind, family]): ReuiCompositeDescriptor[] =>
    family.examples.map(([title, id], index): ReuiCompositeDescriptor => {
      const guide = examples[id]
      if (!guide) throw new Error("Orientações ReUI ausentes para " + id)
      return Object.freeze({
        id,
        name: "Reui" + kind.replace(/[^a-zA-Z0-9]/g, "") + String(index + 1).padStart(2, "0"),
        kind,
        title,
        sourcePath: "src/ui-catalog/extensions/composites/reui-" + basename(kind) + "-" + (index + 1) + ".tsx",
        sourceUrl: guide.sourceUrl,
        bestFor: guide.bestFor,
        whenNotUse: Object.freeze([...guide.whenNotUse]),
        whenUse: Object.freeze([...family.whenUse]),
        familyWhenNotUse: Object.freeze([...family.whenNotUse]),
        agentNotes: Object.freeze([...family.agentNotes]),
        exampleProps: Object.freeze({}),
        configurable: isConfigurableReuiId(id),
        status: "react-composite" as const,
      })
    }),
  ),
)

export const reuiCompositeById: Readonly<Record<string, ReuiCompositeDescriptor>> = Object.freeze(
  Object.fromEntries(reuiCompositeCatalog.map(descriptor => [descriptor.id, descriptor])),
)
