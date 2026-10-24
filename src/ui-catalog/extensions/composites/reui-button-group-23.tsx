/** ReUI c-button-group-23, composição TSX independente. */
import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  return (
    <ButtonGroup className="**:data-[slot=button]:border-0">
      <Button aria-label="Files">
        <IconPlaceholder
          lucide="FileIcon"
          tabler="IconFile"
          hugeicons="FileEmpty02Icon"
          phosphor="FileIcon"
          remixicon="RiFileLine"
          aria-hidden="true"
        />
        Files
      </Button>
      <ButtonGroupSeparator className="bg-primary/72" />
      <Button aria-label="Folder">
        <IconPlaceholder
          lucide="FolderIcon"
          tabler="IconFolder"
          hugeicons="FolderIcon"
          phosphor="FolderIcon"
          remixicon="RiFolderLine"
          aria-hidden="true"
        />
        Folder
      </Button>
      <ButtonGroupSeparator className="bg-primary/72" />
      <Button aria-label="Trash">
        <IconPlaceholder
          lucide="ImageIcon"
          tabler="IconPhoto"
          hugeicons="ImageIcon"
          phosphor="ImageIcon"
          remixicon="RiImageLine"
          aria-hidden="true"
        />
        Media
      </Button>
    </ButtonGroup>
  )
}
