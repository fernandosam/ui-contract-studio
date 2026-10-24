import { Badge } from "./reui-button-adapters"

import { Button } from "@/components/ui/button"
import { IconPlaceholder } from "./reui-button-adapters"

export function ReuiButtonPattern48() {
  return (
    <Button
      size="icon"
      variant="outline"
      className="relative"
      aria-label="Notifications (8)"
    >
      <IconPlaceholder
        lucide="BellIcon"
        tabler="IconBell"
        hugeicons="NotificationIcon"
        phosphor="BellIcon"
        remixicon="RiNotificationLine"
        aria-hidden="true"
      />
      <Badge
        variant="destructive"
        size="xs"
        className="absolute -top-1 -right-1 rounded-full px-1"
        aria-hidden="true"
      >
        8
      </Badge>
    </Button>
  )
}
