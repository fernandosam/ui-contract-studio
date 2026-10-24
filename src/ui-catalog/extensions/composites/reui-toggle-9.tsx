/** Exemplo c-toggle-9 do ReUI (Base UI). */
"use client"

import { useState } from "react"

import { Toggle } from "@/components/ui/toggle"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  const [pressed, setPressed] = useState(false)

  return (
    <div className="flex items-center justify-center">
      <Toggle
        aria-label="Toggle favorite"
        pressed={pressed}
        onPressedChange={setPressed}
      >
        {pressed ? (
          <IconPlaceholder
            lucide="HeartIcon"
            tabler="IconHeart"
            hugeicons="FavouriteIcon"
            phosphor="HeartIcon"
            remixicon="RiHeartLine"
            className="fill-current"
          />
        ) : (
          <IconPlaceholder
            lucide="HeartIcon"
            tabler="IconHeart"
            hugeicons="FavouriteIcon"
            phosphor="HeartIcon"
            remixicon="RiHeartLine"
          />
        )}
      </Toggle>
    </div>
  )
}
