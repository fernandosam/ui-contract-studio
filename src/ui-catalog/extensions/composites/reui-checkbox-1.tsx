/** Composição ReUI c-checkbox-1 (Base UI). */
import { useId } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { reuiSemanticDefaults, type ReuiSemanticDataFor } from "./reui-semantic-config"

export default function Pattern({ data = reuiSemanticDefaults["c-checkbox-1"] }: {
  data?: ReuiSemanticDataFor<"c-checkbox-1">
}) {
  const id = useId()
  return (
    <Field orientation="horizontal" className="w-auto">
      <Checkbox id={id} defaultChecked={data.checkedInitially} />
      <FieldLabel htmlFor={id}>{data.label}</FieldLabel>
    </Field>
  )
}
