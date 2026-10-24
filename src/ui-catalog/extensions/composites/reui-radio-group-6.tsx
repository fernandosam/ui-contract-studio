/** ReUI c-radio-group-6: composição independente Base UI. */
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"

export default function Pattern() {
  return (
    <FieldSet className="w-full max-w-xs">
      <FieldLegend>Battery Level</FieldLegend>
      <FieldDescription>Choose your preferred battery level.</FieldDescription>
      <RadioGroup defaultValue="medium">
        <Field orientation="horizontal">
          <RadioGroupItem value="high" id="battery-high" />
          <FieldLabel htmlFor="battery-high">High</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="medium" id="battery-medium" />
          <FieldLabel htmlFor="battery-medium">Medium</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="low" id="battery-low" />
          <FieldLabel htmlFor="battery-low">Low</FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>
  )
}
