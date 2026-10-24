import { Button } from "@/components/ui/button"
import { IconPlaceholder } from "./reui-button-adapters"

export function ReuiButtonPattern50() {
  return (
    <Button
      variant="link"
      className="group/back-button"
      render={<a href="#reui-button-demo" />}
      nativeButton={false}
    >
      <IconPlaceholder
        lucide="ChevronLeftIcon"
        tabler="IconChevronLeft"
        hugeicons="ArrowLeft01Icon"
        phosphor="CaretLeftIcon"
        remixicon="RiArrowLeftSLine"
        data-icon="inline-start"
        aria-hidden="true"
        className="transition-transform duration-200 group-hover/back-button:-translate-x-1"
      />
      Go back
    </Button>
  )
}
