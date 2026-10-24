/** ReUI c-input-16: composição TSX independente. */
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  return (
    <Field className="max-w-xs">
      <div className="flex items-center gap-2">
        <FieldLabel htmlFor="username">Username</FieldLabel>
        <Tooltip>
          <TooltipTrigger className="inline-flex items-center">
            <IconPlaceholder
              lucide="HelpCircleIcon"
              tabler="IconHelpCircle"
              hugeicons="HelpCircleIcon"
              phosphor="QuestionIcon"
              remixicon="RiQuestionLine"
              className="text-muted-foreground size-3.5"
            />
          </TooltipTrigger>
          <TooltipContent>
            Your unique identifier on the platform.
          </TooltipContent>
        </Tooltip>
      </div>
      <Input id="username" placeholder="johndoe" />
      <FieldDescription>
        Your unique identifier on the platform.
      </FieldDescription>
    </Field>
  )
}
