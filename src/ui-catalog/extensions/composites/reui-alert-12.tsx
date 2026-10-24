/** ReUI c-alert-12 (Base UI), composição estática e auditável. */
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/ui-catalog/extensions/composites/reui-alert-adapter"
import { Frame, FramePanel } from "@/ui-catalog/extensions/composites/reui-pattern-adapters"

import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  return (
    <Frame>
      <FramePanel className="overflow-hidden p-0!">
        <Alert className="border-0 shadow-none">
          <IconPlaceholder
            lucide="InfoIcon"
            tabler="IconInfoCircle"
            hugeicons="InformationCircleIcon"
            phosphor="InfoIcon"
            remixicon="RiInformationLine"
            className="text-destructive"
          />
          <AlertTitle>System Update</AlertTitle>
          <AlertDescription>
            A new system update is available. Please restart your application
            to apply the changes.
          </AlertDescription>
        </Alert>
      </FramePanel>
    </Frame>
  )
}
