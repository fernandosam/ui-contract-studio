/** Adaptado do ReUI c-separator-2, referência pública keenthemes/reui (Base UI). */
import { Separator } from "@/components/ui/separator"

export function SeparatorPattern2() {
  return (
    <div className="flex items-center justify-center">
      <div className="flex h-5 items-center gap-4 text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    </div>
  )
}
