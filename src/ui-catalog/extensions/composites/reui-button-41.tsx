"use client"

import { useCopyToClipboard } from "./reui-button-adapters"
import { Button } from "@/components/ui/button"
import { IconPlaceholder } from "./reui-button-adapters"

export function ReuiButtonPattern41() {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 1500 })

  return (
    <Button
      variant="outline"
      aria-label={isCopied ? "Copied" : "Copy"}
      onClick={() => copyToClipboard("https://reui.io")}
    >
      {isCopied ? (
        <IconPlaceholder
          lucide="CheckIcon"
          tabler="IconCheck"
          hugeicons="Tick02Icon"
          phosphor="CheckIcon"
          remixicon="RiCheckLine"
          aria-hidden="true"
        />
      ) : (
        <IconPlaceholder
          lucide="CopyIcon"
          tabler="IconCopy"
          hugeicons="CopyIcon"
          phosphor="CopyIcon"
          remixicon="RiFileCopyLine"
          aria-hidden="true"
        />
      )}
      <span>{isCopied ? "Copied" : "Copy"}</span>
    </Button>
  )
}
