import {
  Avatar,
  AvatarFallback,

} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function ReuiButtonPattern58() {
  return (
    <Button variant="outline" size="sm">
      <Avatar className="size-5">
        
        <AvatarFallback>CH</AvatarFallback>
      </Avatar>
      <span className="text-xs">@shadcn</span>
    </Button>
  )
}
