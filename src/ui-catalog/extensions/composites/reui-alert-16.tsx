/** ReUI c-alert-16 (Base UI), composição estática e auditável. */
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
        <Alert
          variant="destructive"
          className="bg-destructive/5 border-0 shadow-none"
        >
          <IconPlaceholder
            lucide="CreditCardIcon"
            tabler="IconCreditCard"
            hugeicons="CreditCardIcon"
            phosphor="CreditCardIcon"
            remixicon="RiBankCardLine"
          />
          <AlertTitle>Subscription Expiring</AlertTitle>
          <AlertAction>
            <Button size="xs" variant="destructive">
              Renew Now
            </Button>
          </AlertAction>
          <AlertDescription>
            Your annual subscription will expire in 3 days. Renew now to avoid
            service interruption and data loss.
          </AlertDescription>
        </Alert>
      </FramePanel>
    </Frame>
  )
}
