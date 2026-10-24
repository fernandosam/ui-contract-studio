import { type ComponentType } from "react"
import {
  reuiCompositePropsSchema,
  reuiCompositeCatalog,
  reuiCompositeById,
  type ReuiCompositeProps,
  type ReuiCompositeDescriptor,
} from "./reui-composite-definitions"
import { ReuiPattern } from "./reui-preview"

export { reuiCompositeCatalog, reuiCompositeById, reuiCompositePropsSchema }
export type { ReuiCompositeProps, ReuiCompositeDescriptor }

/** Código dos exemplos é reutilizado sem injetar JSX, classes ou callbacks livres. */
const sizes: Record<NonNullable<ReuiCompositeProps["width"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-3xl",
  full: "max-w-none",
}
const alignments: Record<NonNullable<ReuiCompositeProps["align"]>, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
}

/**
 * Factory com restrições de layout por enum. Não aceita children, JSX arbitrário,
 * className, HTML, URLs, callbacks ou importações dinâmicas controladas pelo usuário.
 */
export function createReuiComposite(descriptor: ReuiCompositeDescriptor): ComponentType<ReuiCompositeProps> {
  function Composite(props: ReuiCompositeProps) {
    const parsed = reuiCompositePropsSchema.safeParse(props)
    if (!parsed.success) throw new Error("Propriedades inválidas para " + descriptor.name)
    const { width = "full", align = "center" } = parsed.data
    return (
      <div data-composite={descriptor.name} data-reui-composite={descriptor.id}
        className={"flex min-w-0 w-full " + alignments[align]}>
        <div className={"min-w-0 w-full " + sizes[width]}>
          <ReuiPattern kind={descriptor.kind} id={descriptor.id} />
        </div>
      </div>
    )
  }
  Composite.displayName = descriptor.name
  return Composite
}

/** 559 componentes React nomeados, reutilizando fontes TSX individuais e versionadas. */
export const reuiCompositeImplementations: Readonly<Record<string, ComponentType<ReuiCompositeProps>>> =
  Object.freeze(Object.fromEntries(
    reuiCompositeCatalog.map(descriptor => [descriptor.name, createReuiComposite(descriptor)]),
  ))

export function ReuiComposite({ id, ...props }: ReuiCompositeProps & { id: string }) {
  const descriptor = reuiCompositeById[id]
  if (!descriptor) return null
  const Implementation = reuiCompositeImplementations[descriptor.name]
  return <Implementation {...props} />
}
