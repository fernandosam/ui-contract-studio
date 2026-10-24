/** Exemplo ReUI c-tooltip-7, TSX isolado Base UI. */
import { Badge } from "@/ui-catalog/extensions/composites/reui-badge-adapter"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  return (
    <div className="flex items-center justify-center">
      <p className="text-sm">
        Verified domain{" "}
        <Tooltip>
          <TooltipTrigger className="text-muted-foreground align-middle">
            <IconPlaceholder
              lucide="BadgeCheckIcon"
              tabler="IconRosetteDiscountCheck"
              hugeicons="CheckmarkBadge01Icon"
              phosphor="SealCheckIcon"
              remixicon="RiVerifiedBadgeLine"
              className="size-4 text-emerald-600"
              aria-hidden="true"
            />
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                Verified
              </Badge>
              <p>Domain ownership has been confirmed.</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </p>
    </div>
  )
}
