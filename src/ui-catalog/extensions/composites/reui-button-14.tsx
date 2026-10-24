import { Button } from "@/components/ui/button"
import { IconPlaceholder } from "./reui-button-adapters"

export function ReuiButtonPattern14() {
  return (
    <Button>
      <IconPlaceholder
        lucide="CloudDownloadIcon"
        tabler="IconCloudDownload"
        hugeicons="CloudDownloadIcon"
        phosphor="CloudArrowDownIcon"
        remixicon="RiDownloadCloud2Line"
        aria-hidden="true"
      />
      Download
    </Button>
  )
}
