/** Exemplo c-toggle-14 do ReUI (Base UI). */
"use client"

import { useState } from "react"

import { Toggle } from "@/components/ui/toggle"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  const [muted, setMuted] = useState(false)

  return (
    <div className="flex items-center justify-center">
      <Toggle
        size="lg"
        variant="outline"
        aria-label="Toggle mute"
        pressed={muted}
        onPressedChange={setMuted}
      >
        {muted ? (
          <IconPlaceholder
            lucide="VolumeOffIcon"
            tabler="IconVolumeOff"
            hugeicons="VolumeOffIcon"
            phosphor="SpeakerSlashIcon"
            remixicon="RiVolumeOffVibrateLine"
          />
        ) : (
          <IconPlaceholder
            lucide="Volume2Icon"
            tabler="IconVolume"
            hugeicons="VolumeHighIcon"
            phosphor="SpeakerHighIcon"
            remixicon="RiVolumeUpLine"
          />
        )}
        {muted ? "Muted" : "Sound"}
      </Toggle>
    </div>
  )
}
