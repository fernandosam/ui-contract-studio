/** Exemplo c-switch-3 do ReUI (Base UI). */
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function Pattern() {
  return (
    <div className="flex flex-col items-start justify-start gap-3">
      <div className="flex items-center gap-2">
        <Switch id="switch-disabled-unchecked" disabled />
        <Label htmlFor="switch-disabled-unchecked">Disabled (Unchecked)</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="switch-disabled-checked" defaultChecked disabled />
        <Label htmlFor="switch-disabled-checked">Disabled (Checked)</Label>
      </div>
    </div>
  )
}
