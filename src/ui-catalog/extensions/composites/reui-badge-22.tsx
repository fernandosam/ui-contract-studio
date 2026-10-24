/** Exemplo ReUI c-badge-22; composição TSX estática. */
import { Badge } from "@/ui-catalog/extensions/composites/reui-badge-adapter"

export default function Pattern() {
  return (
    <Badge variant="info-light">
      <span className="ms-0.25 size-1.25 rounded-full! bg-[currentColor]" />{" "}
      Badge
    </Badge>
  )
}
