/** Exemplo ReUI c-badge-23; composição TSX estática. */
import { Badge } from "@/ui-catalog/extensions/composites/reui-badge-adapter"

export default function Pattern() {
  return (
    <Badge variant="outline" render={<a href="#" />}>
      Badge
    </Badge>
  )
}
