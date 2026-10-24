import {
  Avatar,
  AvatarFallback,

} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function ReuiButtonPattern56() {
  return (
    <Button variant="outline">
      <Avatar className="size-5">
        
        <AvatarFallback>CH</AvatarFallback>
      </Avatar>
      <span className="text-xs">@shadcn</span>
    </Button>
  )
}
