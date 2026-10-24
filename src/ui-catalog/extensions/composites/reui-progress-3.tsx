/** ReUI oficial c-progress-3, composição TSX isolada. */
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"

export default function Pattern() {
  return (
    <div className="mx-auto w-full max-w-xs">
      <Progress value={70} className="**:data-[slot=progress-track]:h-3">
        <ProgressLabel>Large progress</ProgressLabel>
        <ProgressValue />
      </Progress>
    </div>
  )
}
