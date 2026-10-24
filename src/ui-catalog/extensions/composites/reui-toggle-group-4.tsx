/** ReUI c-toggle-group-4; composição TSX isolada. */
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export default function Pattern() {
  return (
    <div className="flex items-center justify-center">
      <ToggleGroup variant="outline" spacing={2} defaultValue={["week"]}>
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
        <ToggleGroupItem value="month">Month</ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
