import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Star } from "lucide-react"
import type { z } from "zod"
import type { extensionDefinitions } from "@/ui-catalog/extensions/catalog"

export type RatingDistributionProps = z.infer<typeof extensionDefinitions.RatingDistribution.props>

/**
 * Sumário de avaliações: dados semânticos, nunca percentuais recebidos do agente.
 * counts[i] é a quantidade de avaliações com i+1 estrelas. Sem rede ou mutações.
 */
export function RatingDistribution({ props }: { props: RatingDistributionProps }) {
  const total = props.counts.reduce((sum, count) => sum + count, 0)
  const score = props.counts.reduce((sum, count, index) => sum + count * (index + 1), 0) / total
  const title = props.title ?? "Resumo das avaliações"
  return (
    <section data-composite="RatingDistribution" aria-label={title} className="w-full space-y-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <strong className="text-3xl font-semibold tabular-nums">{score.toFixed(1)}</strong>
        <div className="flex items-center gap-1" aria-label={score.toFixed(1) + " de 5 estrelas"}>
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} aria-hidden="true" className={
              "size-4 " + (index < Math.round(score) ? "fill-amber-400 text-amber-400" : "text-muted-foreground")
            } />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {total.toLocaleString("pt-BR")} {total === 1 ? "avaliação" : "avaliações"}
        </span>
      </div>
      <Separator />
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map(stars => {
          const count = props.counts[stars - 1]
          const percent = count / total * 100
          return (
            <div key={stars} className="flex items-center gap-3 text-sm">
              <span className="w-3 text-right text-xs text-muted-foreground">{stars}</span>
              <Progress className="flex-1" value={percent} aria-label={
                stars + (stars === 1 ? " estrela" : " estrelas") + ": " + count + " avaliações"
              }/>
              <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">{count}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
