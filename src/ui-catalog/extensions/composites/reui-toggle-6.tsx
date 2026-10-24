/** Exemplo c-toggle-6 do ReUI (Base UI). */
import { Toggle } from "@/components/ui/toggle"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  return (
    <div className="flex items-center justify-center">
      <Toggle variant="outline" aria-label="Toggle bookmark">
        <IconPlaceholder
          lucide="BookmarkIcon"
          tabler="IconBookmark"
          hugeicons="Bookmark02Icon"
          phosphor="BookmarkSimpleIcon"
          remixicon="RiBookmarkLine"
          className="group-aria-pressed/toggle:fill-accent-foreground"
        />
        Bookmark
      </Toggle>
    </div>
  )
}
