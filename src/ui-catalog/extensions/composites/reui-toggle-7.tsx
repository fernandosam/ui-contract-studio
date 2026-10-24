/** Exemplo c-toggle-7 do ReUI (Base UI). */
"use client"

import { useState } from "react"
import { Badge } from "@/ui-catalog/extensions/composites/reui-button-adapters"

import { Toggle } from "@/components/ui/toggle"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  const [pressed, setPressed] = useState(false)

  return (
    <div className="flex items-center justify-center">
      <Toggle
        aria-label="Toggle notifications"
        pressed={pressed}
        onPressedChange={setPressed}
      >
        <div className="relative">
          <IconPlaceholder
            lucide="BellIcon"
            tabler="IconBell"
            hugeicons="NotificationIcon"
            phosphor="BellIcon"
            remixicon="RiNotificationLine"
          />
          {!pressed && (
            <Badge
              variant="destructive"
              size="xs"
              className="absolute -top-2 -right-2 rounded-full!"
            >
              3
            </Badge>
          )}
        </div>
      </Toggle>
    </div>
  )
}
