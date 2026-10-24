/** ReUI c-alert-15 (Base UI), composição estática e auditável. */
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
    <Frame>
      <FramePanel className="overflow-hidden p-0!">
        <Alert variant="invert" className="border-0 shadow-none">
          <IconPlaceholder
            lucide="ZapIcon"
            tabler="IconBolt"
            hugeicons="ZapIcon"
            phosphor="LightningIcon"
            remixicon="RiFlashlightLine"
            className="text-yellow-500"
          />
          <AlertTitle>Pro Feature</AlertTitle>
          <AlertAction>
            <Button
              variant="outline"
              size="xs"
              className="bg-background/10 border-border/10"
            >
              Dismiss
            </Button>
            <Button
              size="xs"
              className="border-blue-800 bg-blue-500 text-white hover:border-blue-900 hover:bg-blue-600"
            >
              Upgrade
            </Button>
          </AlertAction>
          <AlertDescription>
            This feature is only available for Pro users. Upgrade your plan to
            get access.
          </AlertDescription>
        </Alert>
      </FramePanel>
    </Frame>
  )
}
