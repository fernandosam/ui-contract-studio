/** ReUI oficial c-textarea-1, composição estática em TSX (Base UI). */
import { Textarea } from "@/components/ui/textarea"

export default function Pattern() {
  return (
    <div className="mx-auto w-full max-w-xs">
      <Textarea placeholder="Type your message here…" className="w-full" />
    </div>
  )
}
