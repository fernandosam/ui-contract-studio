/** ReUI oficial c-textarea-2, composição estática em TSX (Base UI). */
import { Textarea } from "@/components/ui/textarea"

export default function Pattern() {
  return (
    <div className="mx-auto w-full max-w-xs">
      <Textarea
        placeholder="Type your message here…"
        aria-invalid="true"
        className="w-full"
      />
    </div>
  )
}
