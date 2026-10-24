/** ReUI c-avatar-2: composição TSX independente. */
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  return (
    <div className="flex items-center gap-2">
      <Avatar>
        <AvatarFallback>AJ</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>
          <IconPlaceholder
            lucide="UserIcon"
            tabler="IconUser"
            hugeicons="UserIcon"
            phosphor="UserIcon"
            remixicon="RiUserLine"
            className="size-4"
            aria-hidden="true"
          />
        </AvatarFallback>
      </Avatar>
    </div>
  )
}
