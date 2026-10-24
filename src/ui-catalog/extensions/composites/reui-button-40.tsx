import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "./reui-button-adapters"
import { IconPlaceholder } from "./reui-button-adapters"

export function ReuiButtonPattern40() {
  return (
    <Button variant="outline" aria-label="Search (Command K)">
      <IconPlaceholder
        lucide="SearchIcon"
        tabler="IconSearch"
        hugeicons="Search01Icon"
        phosphor="MagnifyingGlassIcon"
        remixicon="RiSearchLine"
        aria-hidden="true"
      />
      <span>Search</span>
      <KbdGroup aria-hidden="true">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </Button>
  )
}
