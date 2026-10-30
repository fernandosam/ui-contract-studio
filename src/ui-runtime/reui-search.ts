/** Índice textual da Galeria 3: título, ID, família e orientações pt-BR. */
export type ReuiExampleSearchGuide = {
  bestFor: string
  whenNotUse: readonly string[]
}
export type ReuiExampleEntry = readonly [title: string, id: string]
export type IndexedReuiExample = Readonly<{entry: ReuiExampleEntry;fields:readonly string[]}>

/** Ignora diferenças de maiúsculas, acentos e espaçamento. */
export function normalizeReuiSearch(value: string): string {
  return value.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim()
}

/** O índice é consultivo e não carrega código-fonte, prévias ou contratos. */
export function buildReuiExampleIndex(
  items: readonly ReuiExampleEntry[],
  component: string,
  guidance: Readonly<Record<string, ReuiExampleSearchGuide>>,
): readonly IndexedReuiExample[] {
  const family = normalizeReuiSearch(component)
  return items.map(([title, id]) => {
    const guide = guidance[id]
    return {
      entry: [title, id] as const,
      fields: [
        family, normalizeReuiSearch(title), normalizeReuiSearch(id),
        normalizeReuiSearch(guide?.bestFor ?? ""),
        ...(guide?.whenNotUse ?? []).map(normalizeReuiSearch),
      ],
    }
  })
}

/** Aplica todos os termos aos campos pré-normalizados, preservando a ordem do catálogo. */
export function filterIndexedReuiExamples(
  index: readonly IndexedReuiExample[],
  rawQuery: string,
): ReuiExampleEntry[] {
  const query = normalizeReuiSearch(rawQuery)
  if (!query) return index.map(item => item.entry)
  const terms = query.split(" ")
  return index.filter(({fields}) => terms.every(term => fields.some(field => field.includes(term))))
    .map(item => item.entry)
}

/** API de compatibilidade para buscas pontuais fora da galeria interativa. */
export function filterReuiExamples(
  items: readonly ReuiExampleEntry[],
  component: string,
  rawQuery: string,
  guidance: Readonly<Record<string, ReuiExampleSearchGuide>>,
): ReuiExampleEntry[] {
  return filterIndexedReuiExamples(buildReuiExampleIndex(items, component, guidance), rawQuery)
}
