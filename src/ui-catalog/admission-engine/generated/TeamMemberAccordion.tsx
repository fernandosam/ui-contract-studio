"use client";
import {Accordion,AccordionContent,AccordionItem,AccordionTrigger} from "@/components/ui/accordion";
import {Avatar,AvatarFallback} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import type {TeamMemberAccordionProps} from "./TeamMemberAccordion.schema";

/** PROPOSAL ONLY: local-only details without remote avatar URLs or JSX injection. */
export function TeamMemberAccordion({props}:{props:TeamMemberAccordionProps}){
  return <Accordion multiple={false} defaultValue={[]} className="w-full rounded-lg border">
    {props.members.map(member=><AccordionItem key={member.id} value={member.id} className="px-4">
      <AccordionTrigger disabled={member.disabled} className="gap-3 hover:no-underline">
        <span className="flex min-w-0 items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback>{member.name.trim().slice(0,2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 text-left">
            <span className="block truncate font-medium">{member.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{member.role}</span>
          </span>
          {member.status&&<Badge variant="secondary">{member.status}</Badge>}
        </span>
      </AccordionTrigger>
      <AccordionContent>{member.description}</AccordionContent>
    </AccordionItem>)}
  </Accordion>;
}
