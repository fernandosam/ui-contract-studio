/** Índice textual da Galeria 3: título, ID, família e orientações pt-BR. */
export type ReuiExampleSearchGuide = {
  bestFor: string
  whenNotUse: readonly string[]
}
export type ReuiExampleEntry = readonly [title: string, id: string]

/** Ignora diferenças de maiúsculas, acentos e espaçamento. */
export function normalizeReuiSearch(value: string): string {
  return value.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim()
}

/** Busca em todos os campos relevantes sem carregar prévias nem código-fonte. */
export function filterReuiExamples(
  items: readonly ReuiExampleEntry[],
  component: string,
  rawQuery: string,
  guidance: Readonly<Record<string, ReuiExampleSearchGuide>>,
): ReuiExampleEntry[] {
  const query = normalizeReuiSearch(rawQuery)
  if (!query) return [...items]

  const terms = query.split(" ")
  return items.filter(([title, id]) => {
    const guide = guidance[id]
    const fields = [
      component, title, id,
      guide?.bestFor ?? "",
      ...(guide?.whenNotUse ?? []),
    ].map(normalizeReuiSearch)

    // Permite combinar, por exemplo, um termo de "Melhor para" e
    // outro de "Quando não usar", em qualquer ordem.
    return terms.every(term => fields.some(field => field.includes(term)))
  })
}
