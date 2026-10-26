/** ReUI c-input-1: composição TSX independente. */
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function Pattern() {
  return (
    <Field className="max-w-xs">
      <Input id="basic-input" type="text" placeholder="Basic Input" />
    </Field>
  )
}
