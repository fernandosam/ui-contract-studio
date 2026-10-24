/** ReUI c-alert-5 (Base UI), composição estática e auditável. */
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/ui-catalog/extensions/composites/reui-alert-adapter"

import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  return (
    <Alert variant="info">
      <IconPlaceholder
        lucide="CircleAlertIcon"
        tabler="IconAlertCircle"
        hugeicons="AlertCircleIcon"
        phosphor="WarningCircleIcon"
        remixicon="RiErrorWarningLine"
      />
      <AlertTitle>Info! Something important</AlertTitle>
      <AlertDescription>
        This is an important message. Please read it carefully.
      </AlertDescription>
    </Alert>
  )
}
