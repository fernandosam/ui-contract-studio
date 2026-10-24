/** ReUI oficial c-textarea-4, composição estática em TSX (Base UI). */
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

export default function Pattern() {
  return (
    <div className="mx-auto w-full max-w-xs">
      <Field className="w-full">
        <FieldLabel htmlFor="textarea-with-desc">Feedback</FieldLabel>
        <Textarea
          id="textarea-with-desc"
          placeholder="Type your message here…"
          rows={6}
        />
        <FieldDescription>
          Type your message and press enter to send.
        </FieldDescription>
      </Field>
    </div>
  )
}
