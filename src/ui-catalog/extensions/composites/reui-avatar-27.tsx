/** ReUI c-avatar-27: composição TSX independente. */
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export default function Pattern() {
  return (
    <Button
      size="sm"
      className="rounded-full gap-1 pl-0.5"
    >
      <Avatar className="border-primary size-6 border">
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CH</AvatarFallback>
      </Avatar>
      <span className="text-xs">@shadcn</span>
    </Button>
  )
}
