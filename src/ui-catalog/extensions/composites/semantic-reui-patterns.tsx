/**
 * Semantic adaptations live OUTSIDE immutable audited ReUI example files.
 * Gallery 3 renders the pinned original. Only opt-in data rendering uses these
 * equivalent local-only adapters, with all payloads validated by strict Zod.
 */
import { useId, useState, type FormEvent } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "./reui-alert-adapter"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  parseReuiSemanticData,
  type ReuiConfigurableId, type ReuiSemanticData, type ReuiSemanticDataFor,
} from "./reui-semantic-config"

function ConfigurableAccordion({ data }: { data: ReuiSemanticDataFor<"c-accordion-1"> }) {
  return (
    <Accordion multiple={false} defaultValue={[data.items[0].id]}>
      {data.items.map(item => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>{item.description}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

function ConfigurableAlert({ data }: { data: ReuiSemanticDataFor<"c-alert-1"> }) {
  return <Alert><AlertTitle>{data.title}</AlertTitle><AlertDescription>{data.description}</AlertDescription></Alert>
}

function ConfigurableCheckbox({ data }: { data: ReuiSemanticDataFor<"c-checkbox-1"> }) {
  const id = useId()
  return (
    <Field orientation="horizontal" className="w-auto">
      <Checkbox id={id} defaultChecked={data.checkedInitially} />
      <FieldLabel htmlFor={id}>{data.label}</FieldLabel>
    </Field>
  )
}

function ConfigurableInput({ data }: { data: ReuiSemanticDataFor<"c-input-1"> }) {
  const id = useId()
  return (
    <Field className="max-w-xs">
      <Input id={id} type="text" placeholder={data.placeholder} aria-label={data.accessibleName} />
    </Field>
  )
}

/** The form only updates local demo state; it does not persist user data. */
function ConfigurableDialog({ data }: { data: ReuiSemanticDataFor<"c-dialog-1"> }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState({ name: data.initialName, username: data.initialUsername })
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setProfile({ name: String(formData.get("name")), username: String(formData.get("username")) })
    setOpen(false)
  }
  return (
    <div className="flex items-center justify-center">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" />}>{data.triggerLabel}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{data.title}</DialogTitle>
            <DialogDescription>{data.description}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="contents">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={`${id}-name`}>{data.nameLabel}</FieldLabel>
                <Input id={`${id}-name`} name="name" defaultValue={profile.name} />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${id}-username`}>{data.usernameLabel}</FieldLabel>
                <Input id={`${id}-username`} name="username" defaultValue={profile.username} />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>{data.cancelLabel}</DialogClose>
              <Button type="submit">{data.saveLabel}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ReuiSemanticPattern({ id, data }: { id: ReuiConfigurableId; data: ReuiSemanticData }) {
  switch (id) {
    case "c-accordion-1": return <ConfigurableAccordion data={parseReuiSemanticData(id, data)} />
    case "c-alert-1": return <ConfigurableAlert data={parseReuiSemanticData(id, data)} />
    case "c-checkbox-1": return <ConfigurableCheckbox data={parseReuiSemanticData(id, data)} />
    case "c-input-1": return <ConfigurableInput data={parseReuiSemanticData(id, data)} />
    case "c-dialog-1": return <ConfigurableDialog data={parseReuiSemanticData(id, data)} />
  }
}
