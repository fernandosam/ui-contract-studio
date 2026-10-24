import { Button } from "@/components/ui/button"
import { IconPlaceholder } from "./reui-button-adapters"

export function ReuiButtonPattern19() {
  return (
    <Button variant="outline">
      Options
      <IconPlaceholder
        lucide="Settings2Icon"
        tabler="IconAdjustmentsHorizontal"
        hugeicons="FilterHorizontalIcon"
        phosphor="SlidersHorizontalIcon"
        remixicon="RiEqualizer2Line"
        aria-hidden="true"
      />
    </Button>
  )
}
