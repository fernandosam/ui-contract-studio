/** ReUI c-alert-19 (Base UI), composição estática e auditável. */
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/ui-catalog/extensions/composites/reui-alert-adapter"
import { Frame, FramePanel } from "@/ui-catalog/extensions/composites/reui-pattern-adapters"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export default function Pattern() {
  return (
    <Frame>
      <FramePanel className="overflow-hidden p-0!">
        <Alert className="grid-cols-[32px_1fr] gap-x-3 border-0 shadow-none">
          <Avatar className="size-8 border">
            <AvatarImage
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&dpr=2&q=80"
              alt="Alex Johnson"
            />
            <AvatarFallback>AJ</AvatarFallback>
          </Avatar>
          <AlertTitle className="flex items-center gap-2">
            <span className="truncate">Alex Johnson</span>
            <span className="text-muted-foreground truncate font-normal">
              sent you a message
            </span>
          </AlertTitle>
          <AlertAction>
            <Button size="xs" variant="outline">
              View
            </Button>
            <Button size="xs">Reply</Button>
          </AlertAction>
          <AlertDescription className="line-clamp-1">
            &quot;Hey! I&apos;ve finished the draft for the new design system.
            Let me know what you think when you have a moment.&quot;
          </AlertDescription>
        </Alert>
      </FramePanel>
    </Frame>
  )
}
