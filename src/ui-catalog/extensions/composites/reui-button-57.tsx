import {
  Avatar,
  AvatarFallback,

} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function ReuiButtonPattern57() {
  return (
    <Button size="sm">
      <Avatar className="size-5">
        
        <AvatarFallback>CH</AvatarFallback>
      </Avatar>
      <span className="text-xs">@shadcn</span>
    </Button>
  )
}
