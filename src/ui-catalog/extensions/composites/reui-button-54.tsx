import { Button } from "@/components/ui/button"
import { Kbd } from "./reui-button-adapters"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { IconPlaceholder } from "./reui-button-adapters"

export function ReuiButtonPattern54() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="outline" size="icon" aria-label="Search">
            <IconPlaceholder
              lucide="SearchIcon"
              tabler="IconSearch"
              hugeicons="Search01Icon"
              phosphor="MagnifyingGlassIcon"
              remixicon="RiSearchLine"
            />
          </Button>
        }
      />
      <TooltipContent className="flex items-center gap-3">
        Search
        <Kbd className="-mr-1">⌘K</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}
