import { Button } from "@/components/ui/button"
import { IconPlaceholder } from "./reui-button-adapters"

export function ReuiButtonPattern24() {
  return (
    <Button size="icon-xs" variant="outline" aria-label="Close">
      <IconPlaceholder
        lucide="XIcon"
        tabler="IconX"
        hugeicons="MultiplicationSignIcon"
        phosphor="XIcon"
        remixicon="RiCloseLine"
        aria-hidden="true"
      />
    </Button>
  )
}
