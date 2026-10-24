import { Button } from "@/components/ui/button"
import { IconPlaceholder } from "./reui-button-adapters"

export function ReuiButtonPattern49() {
  return (
    <Button variant="link" render={<a href="#reui-button-demo" />} nativeButton={false}>
      <IconPlaceholder
        lucide="ChevronLeftIcon"
        tabler="IconChevronLeft"
        hugeicons="ArrowLeft01Icon"
        phosphor="CaretLeftIcon"
        remixicon="RiArrowLeftSLine"
        data-icon="inline-start"
        aria-hidden="true"
      />
      Go back
    </Button>
  )
}
