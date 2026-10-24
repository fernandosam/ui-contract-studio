/** Adapted from public ReUI c-accordion-9 Base UI pattern (keenthemes/reui). */
import { Badge } from "@/components/ui/badge"
import { Frame, FramePanel } from "@/ui-catalog/extensions/composites/reui-pattern-adapters"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Avatar,
  AvatarFallback
} from "@/components/ui/avatar"

const users = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex@apple.com",
    role: "Admin",
    initials: "AJ",
    content:
      "Alex has full administrative access to the platform, including billing management, user provisioning, and security configurations.",
  },
  {
    id: "2",
    name: "Sarah Chen",
    email: "sarah@openai.com",
    role: "Viewer",
    initials: "SC",
    content:
      "Sarah has read-only access to projects and reports. She cannot modify settings or invite new members.",
  },
  {
    id: "3",
    name: "Michael Rodriguez",
    email: "michael@meta.com",
    role: "Editor",
    initials: "MR",
    content:
      "Michael is part of the design team and has permissions to edit projects, manage assets, and update design system components.",
  },
]

export function AccordionPattern9() {
  return (
    <Frame stacked spacing="sm">
      {users.map((user) => (
        <FramePanel key={user.id}>
          <Accordion
            multiple={false}
            defaultValue={["1"]}
            className="border-none"
          >
            <AccordionItem
              value={user.id}
              className="border-none bg-transparent p-0 **:data-[slot=accordion-content]:p-0!"
            >
              <AccordionTrigger className="items-center px-1 py-1 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Avatar className="size-8 border">

                    <AvatarFallback className="text-xs">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="inline-flex items-center gap-2">
                    <span className="text-foreground/90 font-semibold tracking-tight">
                      {user.name}
                    </span>
                    <Badge
                      variant={
                        user.role === "Admin" ? "secondary" : "secondary"
                      }
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground py-0 pl-11">
                {user.content}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </FramePanel>
      ))}
    </Frame>
  )
}
