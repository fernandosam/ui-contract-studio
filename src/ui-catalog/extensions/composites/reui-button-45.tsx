import { Badge } from "./reui-button-adapters"

import { Button } from "@/components/ui/button"

export function ReuiButtonPattern45() {
  return (
    <Button variant="outline" className="gap-2" aria-label="Messages (12)">
      Messages
      <Badge variant="destructive-outline" size="sm" aria-hidden="true">
        12
      </Badge>
    </Button>
  )
}
