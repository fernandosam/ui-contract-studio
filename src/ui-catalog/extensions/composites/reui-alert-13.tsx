/** ReUI c-alert-13 (Base UI), composição estática e auditável. */
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
    <Frame stacked>
      <FramePanel className="p-0!">
        <Alert
          variant="success"
          className="rounded-none border-0 shadow-none"
        >
          <IconPlaceholder
            lucide="CircleCheckIcon"
            tabler="IconCircleCheck"
            hugeicons="CheckmarkCircle01Icon"
            phosphor="CheckCircleIcon"
            remixicon="RiCheckboxCircleLine"
          />
          <AlertTitle>Deployment Successful</AlertTitle>
          <AlertDescription>
            Your application has been successfully deployed to the production
            environment.
          </AlertDescription>
        </Alert>
      </FramePanel>
      <FramePanel className="p-0!">
        <Alert
          variant="warning"
          className="rounded-none border-0 shadow-none"
        >
          <IconPlaceholder
            lucide="AlertTriangleIcon"
            tabler="IconAlertTriangle"
            hugeicons="Alert02Icon"
            phosphor="WarningIcon"
            remixicon="RiAlertLine"
            className="text-yellow-500"
          />
          <AlertTitle>Resource Limit Reached</AlertTitle>
          <AlertAction>
            <Button size="xs">Verify</Button>
          </AlertAction>
          <AlertDescription>
            Your current plan has reached its resource limits. Consider
            upgrading to a higher tier.
          </AlertDescription>
        </Alert>
      </FramePanel>
    </Frame>
  )
}
