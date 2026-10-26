/** Adapted from public ReUI c-accordion-1 Base UI pattern (keenthemes/reui). */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { reuiSemanticDefaults, type ReuiSemanticDataFor } from "./reui-semantic-config"

export function AccordionPattern1({ data = reuiSemanticDefaults["c-accordion-1"] }: {
  data?: ReuiSemanticDataFor<"c-accordion-1">
}) {
  return (
    <Accordion multiple={false} defaultValue={[data.items[0].id]}>
      {data.items.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>{item.description}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
