/** ReUI c-alert-18 (Base UI), composição estática e auditável. */
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/ui-catalog/extensions/composites/reui-alert-adapter"
import { Frame, FramePanel } from "@/ui-catalog/extensions/composites/reui-pattern-adapters"

import { Button } from "@/components/ui/button"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  return (
    <Frame variant="ghost">
      <FramePanel className="overflow-hidden p-0!">
        <Alert variant="info" className="border-0 shadow-none">
          <IconPlaceholder
            lucide="LightbulbIcon"
            tabler="IconBulb"
            hugeicons="Idea01Icon"
            phosphor="LightbulbIcon"
            remixicon="RiLightbulbLine"
          />
          <AlertTitle>New: Advanced Analytics</AlertTitle>
          <AlertAction>
            <Button
              size="xs"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground -mt-1 -mr-2 size-7 p-0 hover:bg-transparent"
            >
              <IconPlaceholder
                lucide="XIcon"
                tabler="IconX"
                hugeicons="MultiplicationSignIcon"
                phosphor="XIcon"
                remixicon="RiCloseLine"
                className="size-3.5"
              />
            </Button>
          </AlertAction>
          <AlertDescription>
            We&apos;ve just released a new dashboard for tracking your
            team&apos;s performance.
            <Button
              variant="link"
              size="sm"
              className="text-info h-auto p-0 underline"
            >
              Explore features
            </Button>
          </AlertDescription>
        </Alert>
      </FramePanel>
    </Frame>
  )
}
