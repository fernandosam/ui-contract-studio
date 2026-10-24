import { CheckCircle2, CircleDot, Clock3 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import type { z } from "zod"
import type { extensionDefinitions } from "@/ui-catalog/extensions/catalog"

export type OnboardingChecklistProps = z.infer<typeof extensionDefinitions.OnboardingChecklist.props>

const statuses = {
  completed: { label: "Concluída", icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400" },
  active: { label: "Em andamento", icon: CircleDot, className: "text-amber-600 dark:text-amber-400" },
  pending: { label: "Pendente", icon: Clock3, className: "text-muted-foreground" },
} as const

/**
 * Semântica própria: etapas + status + detalhes. A renderização preserva
 * o padrão visual do c-accordion-11, mas não incorpora seus textos de exemplo.
 * Sem rede, ações remotas, callbacks ou autorização por status.
 */
export function OnboardingChecklist({ props }: { props: OnboardingChecklistProps }) {
  const initial = props.defaultOpenId ?? props.steps.find(step => step.status === "active")?.id
  return (
    <Accordion multiple={false} defaultValue={initial ? [initial] : []}
      className="w-full overflow-hidden rounded-lg border border-border" data-composite="OnboardingChecklist">
      {props.steps.map(step => {
        const status = statuses[step.status]
        const Icon = status.icon
        return (
          <AccordionItem key={step.id} value={step.id} className="px-4">
            <AccordionTrigger className="py-4 hover:no-underline">
              <span className="flex min-w-0 items-center gap-3">
                <Icon className={`size-5 shrink-0 ${status.className}`} aria-hidden="true" />
                <span className="min-w-0 text-left font-medium">{step.title}</span>
              </span>
              <Badge variant="secondary" className="ml-auto shrink-0">{status.label}</Badge>
            </AccordionTrigger>
            <AccordionContent className="pb-4 pl-8 text-sm text-muted-foreground">
              {step.description}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
