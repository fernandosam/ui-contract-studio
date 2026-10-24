import { useEffect, useId, useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { z } from "zod"
import type { extensionDefinitions } from "@/ui-catalog/extensions/catalog"

export type CharacterCountTextareaProps = z.infer<typeof extensionDefinitions.CharacterCountTextarea.props>

/** Campo local, com limite acessível. Não salva ou envia dados. */
export function CharacterCountTextarea({ props }: { props: CharacterCountTextareaProps }) {
  const [value, setValue] = useState(props.initialValue ?? "")
  useEffect(() => setValue(props.initialValue ?? ""), [props.initialValue])
  const id = useId()
  const counterId = id + "-counter"
  const remaining = props.maxLength - value.length
  const warningThreshold = props.warningThreshold ?? Math.min(20, props.maxLength)
  const severity = remaining === 0 ? "text-destructive font-semibold"
    : remaining <= warningThreshold ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground"
  return (
    <div data-composite="CharacterCountTextarea" className="w-full space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{props.label}</Label>
        <span id={counterId} aria-live="polite" className={"text-xs tabular-nums " + severity}>
          {value.length}/{props.maxLength}
        </span>
      </div>
      <Textarea
        id={id} name={props.name} rows={props.rows ?? 2}
        value={value} maxLength={props.maxLength}
        onChange={event => setValue(event.target.value)}
        placeholder={props.placeholder}
        disabled={props.disabled}
        aria-describedby={counterId}
        className="min-h-0 resize-y"
      />
    </div>
  )
}
