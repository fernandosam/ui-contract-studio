import { Button } from "@/components/ui/button"
import { IconPlaceholder } from "./reui-button-adapters"

export function ReuiButtonPattern17() {
  return (
    <Button variant="secondary">
      Open Project
      <IconPlaceholder
        lucide="ExternalLinkIcon"
        tabler="IconExternalLink"
        hugeicons="LinkSquare01Icon"
        phosphor="ArrowSquareOutIcon"
        remixicon="RiExternalLinkLine"
        aria-hidden="true"
      />
    </Button>
  )
}
