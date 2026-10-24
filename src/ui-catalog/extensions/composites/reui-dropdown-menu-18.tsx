/** ReUI c-dropdown-menu-18: composição TSX independente. */
"use client"

import type { ReactNode } from "react"

import { ClaudeAiIcon } from "@/ui-catalog/extensions/composites/reui-svg/claudeAiIcon"
import { Gemini } from "@/ui-catalog/extensions/composites/reui-svg/gemini"
import { Openai } from "@/ui-catalog/extensions/composites/reui-svg/openai"
import { OpenaiDark } from "@/ui-catalog/extensions/composites/reui-svg/openaiDark"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconPlaceholder } from "@/ui-catalog/extensions/composites/reui-button-adapters"

interface MenuItem {
  id: string
  label: string
  logo: ReactNode
  logoDark?: ReactNode
}

const menuItems: Array<MenuItem> = [
  {
    id: "gpt4o",
    label: "GPT-5.4",
    logo: <Openai />,
    logoDark: <OpenaiDark />,
  },
  {
    id: "claude",
    label: "Claude 4.6 Opus",
    logo: <ClaudeAiIcon />,
  },
  { id: "gemini", label: "Gemini 3.1 Pro", logo: <Gemini /> },
]

export default function Pattern() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="w-36">
            Select model
            <IconPlaceholder
              lucide="ChevronDownIcon"
              tabler="IconChevronDown"
              hugeicons="ArrowDown01Icon"
              phosphor="CaretDownIcon"
              remixicon="RiArrowDownSLine"
              className="ml-auto"
              aria-hidden="true"
            />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Model</DropdownMenuLabel>
          {menuItems.map((item) => (
            <DropdownMenuItem key={item.id}>
              {item.logoDark ? (
                <>
                  <span aria-hidden className="dark:hidden">
                    {item.logo}
                  </span>
                  <span aria-hidden className="hidden dark:block">
                    {item.logoDark}
                  </span>
                </>
              ) : (
                item.logo
              )}
              <span>{item.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
