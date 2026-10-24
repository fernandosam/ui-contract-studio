/** Composição ReUI c-checkbox-12 (Base UI). */
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

export default function Pattern() {
  return (
    <Card className="w-full max-w-xs p-0">
      <FieldGroup className="gap-0">
        <Field>
          <FieldLabel className="justify-between px-4 py-3">
            <FieldTitle className="flex items-center gap-2">
              <IconPlaceholder
                lucide="LaptopIcon"
                tabler="IconDeviceLaptop"
                hugeicons="LaptopIcon"
                phosphor="LaptopIcon"
                remixicon="RiMacbookLine"
                aria-hidden="true"
                className="size-4 opacity-60"
              />
              Push notifications
            </FieldTitle>
            <Checkbox defaultChecked />
          </FieldLabel>
        </Field>
        <Separator />
        <Field>
          <FieldLabel className="justify-between px-4 py-3">
            <FieldTitle className="flex items-center gap-2">
              <IconPlaceholder
                lucide="MailIcon"
                tabler="IconMail"
                hugeicons="MailIcon"
                phosphor="EnvelopeIcon"
                remixicon="RiMailLine"
                aria-hidden="true"
                className="size-4 opacity-60"
              />
              Email notifications
            </FieldTitle>
            <Checkbox />
          </FieldLabel>
        </Field>
        <Separator />
        <Field>
          <FieldLabel className="justify-between px-4 py-3">
            <FieldTitle className="flex items-center gap-2">
              <IconPlaceholder
                lucide="SmartphoneIcon"
                tabler="IconDeviceMobile"
                hugeicons="SmartPhone01Icon"
                phosphor="DeviceMobileCameraIcon"
                remixicon="RiSmartphoneLine"
                aria-hidden="true"
                className="size-4 opacity-60"
              />
              SMS notifications
            </FieldTitle>
            <Checkbox />
          </FieldLabel>
        </Field>
      </FieldGroup>
    </Card>
  )
}
