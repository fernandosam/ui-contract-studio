/** ReUI oficial c-progress-2, composição TSX isolada. */
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"

export default function Pattern() {
  return (
    <div className="mx-auto w-full max-w-xs">
      <Progress value={30} className="**:data-[slot=progress-track]:h-1">
        <ProgressLabel>Small progress</ProgressLabel>
        <ProgressValue />
      </Progress>
    </div>
  )
}
