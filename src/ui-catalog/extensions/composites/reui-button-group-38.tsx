/** ReUI c-button-group-38; composição TSX independente. */
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  return (
    <ButtonGroup>
      <Button variant="outline" size="icon" aria-label="Skip back">
        <IconPlaceholder
          lucide="SkipBackIcon"
          tabler="IconPlayerSkipBack"
          hugeicons="PreviousIcon"
          phosphor="SkipBackIcon"
          remixicon="RiSkipBackLine"
          aria-hidden="true"
        />
      </Button>
      <Button variant="outline" size="icon" aria-label="Play">
        <IconPlaceholder
          lucide="PlayIcon"
          tabler="IconPlayerPlay"
          hugeicons="PlayIcon"
          phosphor="PlayIcon"
          remixicon="RiPlayLine"
          aria-hidden="true"
        />
      </Button>
      <Button variant="outline" size="icon" aria-label="Skip forward">
        <IconPlaceholder
          lucide="SkipForwardIcon"
          tabler="IconPlayerSkipForward"
          hugeicons="NextIcon"
          phosphor="SkipForwardIcon"
          remixicon="RiSkipForwardLine"
          aria-hidden="true"
        />
      </Button>
    </ButtonGroup>
  )
}
