import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function ReuiButtonPattern13() {
  return (
    <Button disabled>
      <Spinner aria-hidden="true" />
      Please wait
    </Button>
  )
}
