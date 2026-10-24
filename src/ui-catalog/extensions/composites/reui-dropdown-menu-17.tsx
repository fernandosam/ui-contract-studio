/** ReUI c-dropdown-menu-17: composição TSX independente. */
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

const icons = {
  bell: (
    <IconPlaceholder
      lucide="BellIcon"
      tabler="IconBell"
      hugeicons="Notification01Icon"
      phosphor="BellIcon"
      remixicon="RiNotification3Line"
      aria-hidden="true"
    />
  ),
  check: (
    <IconPlaceholder
      lucide="CheckIcon"
      tabler="IconCheck"
      hugeicons="Tick02Icon"
      phosphor="CheckIcon"
      remixicon="RiCheckLine"
      aria-hidden="true"
    />
  ),
}

export default function Pattern() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications" />
        }
      >
        {icons.bell}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuItem>
            <span className="flex-1">New message from Alex</span>
            {icons.check}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span className="flex-1">Document approved</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span className="flex-1">Pipeline stage updated</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
