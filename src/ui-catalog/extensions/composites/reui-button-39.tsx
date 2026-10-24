import { Badge } from "./reui-button-adapters"

import { Button } from "@/components/ui/button"
import { IconPlaceholder } from "./reui-button-adapters"

export function ReuiButtonPattern39() {
  return (
    <Button
      variant="outline"
      className="relative gap-2"
      aria-label="Inbox (8 unread)"
    >
      <IconPlaceholder
        lucide="MailIcon"
        tabler="IconMail"
        hugeicons="MailIcon"
        phosphor="EnvelopeIcon"
        remixicon="RiMailLine"
        aria-hidden="true"
      />
      Inbox
      <Badge
        variant="destructive"
        size="sm"
        className="absolute -top-1.5 -right-2 rounded-full px-1"
        aria-hidden="true"
      >
        8
      </Badge>
    </Button>
  )
}
