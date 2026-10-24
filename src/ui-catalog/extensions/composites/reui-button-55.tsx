import {
  Avatar,
  AvatarFallback,

} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function ReuiButtonPattern55() {
  return (
    <Button>
      <Avatar className="size-5">
        
        <AvatarFallback>CH</AvatarFallback>
      </Avatar>
      <span className="text-xs">@shadcn</span>
    </Button>
  )
}
