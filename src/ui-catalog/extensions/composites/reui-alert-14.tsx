/** ReUI c-alert-14 (Base UI), composição estática e auditável. */
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
        <Alert className="border-0 shadow-none">
          <IconPlaceholder
            lucide="ShieldCheckIcon"
            tabler="IconShieldCheck"
            hugeicons="ShieldEnergyIcon"
            phosphor="ShieldCheckIcon"
            remixicon="RiShieldCheckLine"
            className="text-emerald-500"
          />
          <AlertTitle>Security Update</AlertTitle>
          <AlertAction>
            <Button variant="outline" size="xs">
              Dismiss
            </Button>
            <Button size="xs">Update</Button>
          </AlertAction>
          <AlertDescription>
            Update your password and enable 2FA to improve your account
            security.
          </AlertDescription>
        </Alert>
      </FramePanel>
    </Frame>
  )
}
