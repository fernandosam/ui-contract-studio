/** Exemplo ReUI c-badge-18; composição TSX estática. */
import { Badge } from "@/ui-catalog/extensions/composites/reui-badge-adapter"

export default function Pattern() {
  return (
    <div className="flex items-center gap-2.5">
      <Badge size="sm">Small</Badge>
      <Badge size="default">Default</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  )
}
