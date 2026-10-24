/** ReUI c-radio-group-10: composição independente Base UI. */
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/ui-catalog/extensions/composites/reui-pattern-adapters"

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"

export default function Pattern() {
  return (
    <Frame className="w-full max-w-xs" spacing="sm">
      <FrameHeader>
        <FrameTitle>Language</FrameTitle>
      </FrameHeader>
      <FramePanel className="overflow-hidden p-0!">
        <RadioGroup defaultValue="en">
          <FieldGroup className="gap-0">
            <Field>
              <FieldLabel className="p-3">
                <RadioGroupItem value="en" id="lang-en" />
                <FieldTitle>English</FieldTitle>
              </FieldLabel>
            </Field>
            <Separator />
            <Field>
              <FieldLabel className="p-3">
                <RadioGroupItem value="es" id="lang-es" />
                <FieldTitle>Spanish</FieldTitle>
              </FieldLabel>
            </Field>
            <Separator />
            <Field>
              <FieldLabel className="p-3">
                <RadioGroupItem value="fr" id="lang-fr" />
                <FieldTitle>French</FieldTitle>
              </FieldLabel>
            </Field>
            <Separator />
            <Field>
              <FieldLabel className="p-3">
                <RadioGroupItem value="de" id="lang-de" />
                <FieldTitle>German</FieldTitle>
              </FieldLabel>
            </Field>
          </FieldGroup>
        </RadioGroup>
      </FramePanel>
    </Frame>
  )
}
