/** ReUI c-button-group-1: composição TSX independente. */
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"

export default function Pattern() {
  return (
    <ButtonGroup>
      <Button variant="outline">Button</Button>
      <Button variant="outline">Another Button</Button>
    </ButtonGroup>
  )
}
