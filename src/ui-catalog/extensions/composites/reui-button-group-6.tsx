/** ReUI c-button-group-6: composição TSX independente. */
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  return (
    <ButtonGroup>
      <Button variant="outline" size="icon">
        <IconPlaceholder
          lucide="FlipHorizontalIcon"
          tabler="IconBorderHorizontal"
          hugeicons="BorderHorizontalIcon"
          phosphor="SquareSplitHorizontalIcon"
          remixicon="RiSplitCellsHorizontal"
          aria-hidden="true"
        />
      </Button>
      <Button variant="outline" size="icon">
        <IconPlaceholder
          lucide="FlipVerticalIcon"
          tabler="IconBorderVertical"
          hugeicons="BorderVerticalIcon"
          phosphor="SquareSplitVerticalIcon"
          remixicon="RiSplitCellsVertical"
          aria-hidden="true"
        />
      </Button>
      <Button variant="outline" size="icon">
        <IconPlaceholder
          lucide="RotateCwIcon"
          tabler="IconRotateClockwise"
          hugeicons="Rotate01Icon"
          phosphor="ArrowClockwiseIcon"
          remixicon="RiResetRightLine"
          aria-hidden="true"
        />
      </Button>
    </ButtonGroup>
  )
}
