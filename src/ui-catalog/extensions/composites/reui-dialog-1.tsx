/** ReUI c-dialog-1; composição TSX estática Base UI. */
"use client"

import { useId, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { reuiSemanticDefaults, type ReuiSemanticDataFor } from "./reui-semantic-config"

export default function Pattern({ data = reuiSemanticDefaults["c-dialog-1"] }: {
  data?: ReuiSemanticDataFor<"c-dialog-1">
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState({
    name: data.initialName,
    username: data.initialUsername,
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setProfile({
      name: String(formData.get("name")),
      username: String(formData.get("username")),
    })
    setOpen(false)
  }

  return (
    <div className="flex items-center justify-center">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" />}>
          {data.triggerLabel}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{data.title}</DialogTitle>
            <DialogDescription>
              {data.description}
            </DialogDescription>
          </DialogHeader>
          {/* The form sits inside the portaled content so Save can submit it. */}
          <form onSubmit={handleSubmit} className="contents">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={`${id}-name`}>{data.nameLabel}</FieldLabel>
                <Input
                  id={`${id}-name`}
                  name="name"
                  defaultValue={profile.name}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${id}-username`}>{data.usernameLabel}</FieldLabel>
                <Input
                  id={`${id}-username`}
                  name="username"
                  defaultValue={profile.username}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                {data.cancelLabel}
              </DialogClose>
              <Button type="submit">{data.saveLabel}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
