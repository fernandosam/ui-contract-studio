/** ReUI c-avatar-19: composição TSX independente. */
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export default function Pattern() {
  return (
    <Button variant="outline" size="sm" className="gap-1.5">
      <Avatar className="size-5">
        <AvatarImage
          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&q=80"
          alt="@nick.bold"
        />
        <AvatarFallback>CH</AvatarFallback>
      </Avatar>
      <span className="text-xs">@nick.bold</span>
    </Button>
  )
}
