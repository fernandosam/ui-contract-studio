import { Badge } from "./reui-button-adapters"

import { Button } from "@/components/ui/button"

export function ReuiButtonPattern47() {
  return (
    <Button aria-label="Updates (new)">
      Updates
      <Badge variant="success" size="xs" aria-hidden="true">
        New
      </Badge>
    </Button>
  )
}
