/** ReUI c-input-1: composição TSX independente. */
import { useId } from "react"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { reuiSemanticDefaults, type ReuiSemanticDataFor } from "./reui-semantic-config"

export default function Pattern({ data = reuiSemanticDefaults["c-input-1"] }: {
  data?: ReuiSemanticDataFor<"c-input-1">
}) {
  const id = useId()
  return (
    <Field className="max-w-xs">
      <Input id={id} type="text" placeholder={data.placeholder} aria-label={data.accessibleName} />
    </Field>
  )
}
