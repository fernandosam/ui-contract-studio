/** ReUI c-button-group-56; composição TSX independente. */
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

const attachment = {
  name: "Q4-Product-Roadmap.pdf",
  size: "2.4 MB",
}

export default function Pattern() {
  return (
    <ButtonGroup>
      <Button variant="outline" size="xs">
        <IconPlaceholder
          lucide="PaperclipIcon"
          tabler="IconPaperclip"
          hugeicons="Attachment02Icon"
          phosphor="PaperclipIcon"
          remixicon="RiAttachment2"
          aria-hidden="true"
        />
        {attachment.name}
        <span className="opacity-60">({attachment.size})</span>
      </Button>
      <Button variant="outline" size="icon-xs" aria-label="Download attachment">
        <IconPlaceholder
          lucide="DownloadIcon"
          tabler="IconDownload"
          hugeicons="Download01Icon"
          phosphor="DownloadSimpleIcon"
          remixicon="RiDownload2Line"
          aria-hidden="true"
        />
      </Button>
    </ButtonGroup>
  )
}
