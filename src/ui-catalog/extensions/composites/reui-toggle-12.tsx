/** Exemplo c-toggle-12 do ReUI (Base UI). */
import { Toggle } from "@/components/ui/toggle"
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
          render={<Toggle variant="outline" aria-label="Pin to sidebar" />}
        >
          <IconPlaceholder
            lucide="PinIcon"
            tabler="IconPin"
            hugeicons="Pin02Icon"
            phosphor="PushPinIcon"
            remixicon="RiPushpinLine"
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Pin to sidebar</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
