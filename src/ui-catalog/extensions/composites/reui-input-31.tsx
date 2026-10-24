/** ReUI c-input-31: composição TSX independente. */
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function Pattern() {
  return (
    <Field className="w-full max-w-xs">
      <FieldLabel htmlFor="minimal-input">Invisible Input</FieldLabel>
      <Input
        id="minimal-input"
        placeholder="Type here..."
        className="border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
      />
    </Field>
  )
}
