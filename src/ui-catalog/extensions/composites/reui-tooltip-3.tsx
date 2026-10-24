/** Exemplo ReUI c-tooltip-3, TSX isolado Base UI. */
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  return (
    <div className="flex items-center justify-center">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="More information" />
          }
        >
          <IconPlaceholder
            lucide="InfoIcon"
            tabler="IconInfoCircle"
            hugeicons="InformationCircleIcon"
            phosphor="InfoIcon"
            remixicon="RiInformationLine"
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-center text-sm">
            Additional information and help context.
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
