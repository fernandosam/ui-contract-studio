/** Composição ReUI c-checkbox-18 (Base UI). */
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  return (
    <Field orientation="horizontal" className="w-auto">
      <Checkbox id="tooltip-checkbox" />
      <div className="flex items-center gap-1.5">
        <FieldLabel htmlFor="tooltip-checkbox">
          Enable advanced analytics
        </FieldLabel>
        <Tooltip>
          <TooltipTrigger className="text-muted-foreground">
            <IconPlaceholder
              lucide="HelpCircleIcon"
              tabler="IconHelpCircle"
              hugeicons="HelpCircleIcon"
              phosphor="QuestionIcon"
              remixicon="RiQuestionLine"
              aria-hidden="true"
              className="size-3.5"
            />
          </TooltipTrigger>
          <TooltipContent side="right">
            Advanced analytics provides deeper insights into user behavior and
            system performance.
          </TooltipContent>
        </Tooltip>
      </div>
    </Field>
  )
}
