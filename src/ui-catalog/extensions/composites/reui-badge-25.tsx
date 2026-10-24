/** Exemplo ReUI c-badge-25; composição TSX estática. */
import { Badge } from "@/ui-catalog/extensions/composites/reui-badge-adapter"

export default function Pattern() {
  return (
    <Badge variant="outline">
      <img
        src="https://flagcdn.com/us.svg"
        alt="US"
        width={18}
        height={18}
        className="rounded-xs"
      />
      USA
    </Badge>
  )
}
