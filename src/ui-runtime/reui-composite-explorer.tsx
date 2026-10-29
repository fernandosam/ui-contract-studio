import { useMemo, useState } from "react"
import { PreviewThemeSelector } from "../ui-theme/preview-theme"
import {
  ReuiComposite,
  reuiCompositeCatalog,
  reuiCompositeById,
  type ReuiCompositeProps,
} from "@/ui-catalog/extensions/composites/reui-composite-catalog"
import { ReuiSourceViewer } from "@/ui-catalog/extensions/composites/reui-source-viewer"
import {
  isConfigurableReuiId,
  reuiSemanticDefaults,
  reuiSemanticSchemas,
  type ReuiSemanticData,
} from "@/ui-catalog/extensions/composites/reui-semantic-config"
import semanticAdmissions from "@/ui-catalog/reui-semantic-admissions.json"
import { normalizeReuiSearch } from "./reui-search"

const families = [...new Set(reuiCompositeCatalog.map(entry => entry.kind))].sort(
  (a, b) => a.localeCompare(b),
)

const admissions = new Map(semanticAdmissions.entries.map(entry => [entry.exampleId, entry]))
const classificationLabels: Record<string,string> = {
  "existing-primitive-variant":"Variação de contrato existente",
  "review-required":"Revisão semântica pendente",
  "approved-semantic":"Contrato semântico aprovado",
  "existing-composition":"Composição com contratos existentes",
  "existing-contract-gap":"Lacuna no contrato existente",
  "deferred-semantic":"Contrato semântico não admitido",
}
const cleanCriterion = (value: string) => value.replace(
  /\s*\(get_(?:example|component)\("[^"]+"\)\)/g, "",
)

/** Inspeção de componentes React não admitidos automaticamente no catálogo Pi. */
export function ReuiCompositeExplorer() {
  const requestedId = new URLSearchParams(window.location.search).get("reui")
  const [selectedId, setSelectedId] = useState(() =>
    requestedId && reuiCompositeById[requestedId] ? requestedId : reuiCompositeCatalog[0].id,
  )
  const [family, setFamily] = useState(() =>
    requestedId && reuiCompositeById[requestedId] ? reuiCompositeById[requestedId].kind : "all",
  )
  const [classification,setClassification] = useState("all")
  const [search, setSearch] = useState("")
  const [limit, setLimit] = useState(12)
  const [width, setWidth] = useState<NonNullable<ReuiCompositeProps["width"]>>("full")
  const [align, setAlign] = useState<NonNullable<ReuiCompositeProps["align"]>>("center")
  const [semanticEditor, setSemanticEditor] = useState<{ id: string; json: string } | null>(null)

  const filtered = useMemo(() => {
    const terms = normalizeReuiSearch(search).split(" ").filter(Boolean)
    return reuiCompositeCatalog.filter(entry => {
      if (family !== "all" && entry.kind !== family) return false
      const admission = admissions.get(entry.id)
      if (classification !== "all" && admission?.classification !== classification) return false
      const searchable = [
        entry.id, entry.name, entry.title, entry.kind,
        entry.bestFor, admission?.contractName ?? "", admission?.reason ?? "", ...entry.whenNotUse, ...entry.whenUse, ...entry.familyWhenNotUse,
        ...entry.agentNotes,
      ].map(normalizeReuiSearch)
      return terms.every(term => searchable.some(field => field.includes(term)))
    })
  }, [family, search, classification])
  const visible = filtered.slice(0, limit)
  const selected = filtered.find(entry => entry.id === selectedId) ?? filtered[0]
  const configurableId = selected && isConfigurableReuiId(selected.id) ? selected.id : null
  const semanticDraft = configurableId
    ? semanticEditor?.id === configurableId
      ? semanticEditor.json
      : JSON.stringify(reuiSemanticDefaults[configurableId], null, 2)
    : ""
  const semanticValidation: { data?: ReuiSemanticData; error?: string } | null = configurableId
    ? (() => {
        try {
          const parsed = reuiSemanticSchemas[configurableId].safeParse(JSON.parse(semanticDraft))
          if (parsed.success) return { data: parsed.data as ReuiSemanticData }
          return { error: parsed.error.issues.slice(0, 3)
            .map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; ") }
        } catch {
          return { error: "JSON inválido. Informe um objeto JSON válido." }
        }
      })()
    : null

  return (
    <section aria-label="Compostos ReUI" className="min-w-0 space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-semibold">Composições ReUI</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {reuiCompositeCatalog.length} componentes React identificados e reutilizáveis,
          derivados das prévias reais da ReUI. Cada um preserva a origem,
          a orientação para agentes e o exemplo original.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Biblioteca de composições React. A revisão semântica dos 176 pendentes identifica reuso, lacunas e dois novos contratos; não confundir exemplos com contratos JSON/Pi aprovados,
          que exigem admissão individual conforme as regras do projeto.
        </p>
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-3 rounded-lg border bg-card p-3">
          <label className="grid gap-1 text-xs font-medium">
            Componente base
            <select aria-label="Filtrar família de compostos ReUI"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={family} onChange={event => { setFamily(event.target.value); setLimit(12) }}>
              <option value="all">Todos ({reuiCompositeCatalog.length})</option>
              {families.map(name => (
                <option key={name} value={name}>
                  {name} ({reuiCompositeCatalog.filter(item => item.kind === name).length})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium">
            Classificação semântica
            <select aria-label="Filtrar classificação semântica"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={classification} onChange={event => {setClassification(event.target.value); setLimit(12)}}>
              <option value="all">Todas as classificações</option>
              {Object.entries(classificationLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium">
            Pesquisar composição
            <input aria-label="Pesquisar composições ReUI" type="search"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Nome, melhor para, quando não usar"
              value={search} onChange={event => { setSearch(event.target.value); setLimit(12) }}/>
          </label>
          <p aria-live="polite" className="text-xs text-muted-foreground">
            Exibindo {visible.length} de {filtered.length} composições correspondentes.
          </p>
          <div role="group" aria-label="Composições disponíveis"
            className="max-h-[580px] space-y-1 overflow-y-auto">
            {visible.map(entry => (
              <button key={entry.id} type="button" aria-current={selected?.id === entry.id ? "true" : undefined}
                data-testid={"reui-composite-option-" + entry.id}
                className={"block w-full min-w-0 rounded-md px-3 py-2 text-left text-sm hover:bg-muted " +
                  (selected?.id === entry.id ? "bg-secondary font-semibold" : "")}
                onClick={() => { setSelectedId(entry.id); setWidth("full"); setAlign("center") }}>
                <span className="block truncate">{entry.name}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">{entry.title}</span>
              </button>
            ))}
          </div>
          {limit < filtered.length && (
            <button type="button" className="w-full rounded-md border px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setLimit(value => value + 12)}>
              Carregar mais 12 composições
            </button>
          )}
          {!filtered.length && <p className="text-sm text-muted-foreground">Nenhuma composição encontrada.</p>}
        </aside>

        <div className="min-w-0 space-y-4">
          {selected ? (
            <>
              <section className="space-y-3 rounded-lg border bg-card p-4" data-testid="reui-composite-details">
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-semibold">{selected.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selected.kind} · {selected.title}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{selected.sourcePath}</p>
                  {admissions.get(selected.id) && <div className="mt-3 rounded-md border p-3 text-sm" data-testid="reui-semantic-admission">
                    <p className="font-semibold">{classificationLabels[admissions.get(selected.id)!.classification]}</p>
                    <p className="mt-1 text-muted-foreground">{admissions.get(selected.id)!.reason}</p>
                    {admissions.get(selected.id)!.contractName && <p className="mt-2">Contrato relacionado: <code>{admissions.get(selected.id)!.contractName}</code></p>}
                    {admissions.get(selected.id)!.reviewStatus === "approved" && <p className="mt-1 text-xs text-muted-foreground">Contrato disponível no catálogo Pi. Use o explorador de contratos aprovados para editar o exemplo JSON.</p>}
                  </div>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs font-medium">
                    Largura autorizada
                    <select aria-label="Largura da composição ReUI"
                      value={width} onChange={event => setWidth(event.target.value as typeof width)}
                      className="rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="sm">Pequena</option>
                      <option value="md">Média</option>
                      <option value="lg">Grande</option>
                      <option value="full">Total</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs font-medium">
                    Alinhamento autorizado
                    <select aria-label="Alinhamento da composição ReUI"
                      value={align} onChange={event => setAlign(event.target.value as typeof align)}
                      className="rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="start">Início</option>
                      <option value="center">Centro</option>
                      <option value="end">Fim</option>
                    </select>
                  </label>
                </div>
                {configurableId && <div className="space-y-2 rounded-lg border p-3">
                  <label htmlFor="reui-semantic-data" className="block text-sm font-medium">
                    Dados semânticos da composição (JSON)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    API segura deste exemplo; não concede admissão automática ao catálogo Pi.
                  </p>
                  <textarea id="reui-semantic-data" aria-label="Dados semânticos da composição ReUI"
                    spellCheck={false} rows={9} value={semanticDraft}
                    onChange={event => setSemanticEditor({ id: configurableId, json: event.target.value })}
                    className="w-full rounded-md border bg-background p-2 font-mono text-xs" />
                  <button type="button" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                    onClick={() => setSemanticEditor({ id: configurableId, json: JSON.stringify(reuiSemanticDefaults[configurableId], null, 2) })}>
                    Restaurar dados de exemplo
                  </button>
                  {semanticValidation?.error && <p role="alert" className="text-sm text-destructive">{semanticValidation.error}</p>}
                </div>}
                <div className="flex flex-wrap items-center justify-between gap-2"><PreviewThemeSelector/><span className="text-xs text-muted-foreground">A alteração também atualiza o tema do aplicativo.</span></div>
                <div data-testid={"reui-composite-preview-" + selected.id}
                  className="flex min-h-48 min-w-0 items-center overflow-hidden rounded-lg border bg-muted/20 p-4">
                  {semanticValidation?.error
                    ? <p className="text-sm text-muted-foreground">Corrija os dados para visualizar esta composição.</p>
                    : <div key={selected.id + semanticDraft} className="w-full">
                        <ReuiComposite key={selected.id} id={selected.id} width={width} align={align}
                          {...(semanticValidation?.data === undefined ? {} : { data: semanticValidation.data })}/>
                      </div>}
                </div>
                <ReuiSourceViewer id={selected.id}/>
              </section>
              <section className="space-y-3 rounded-lg border bg-card p-4">
                <h3 className="font-semibold">Exemplo do componente</h3>
                <div className="space-y-1 text-sm">
                  <h4 className="font-medium">Melhor para</h4>
                  <p lang="pt-BR" data-testid="reui-composite-best-for" className="text-muted-foreground">{selected.bestFor}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <h4 className="font-medium">Quando não usar</h4>
                  <ul lang="pt-BR" data-testid="reui-composite-when-not-use"
                    className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {selected.whenNotUse.map((reason, index) => <li key={index}>{cleanCriterion(reason)}</li>)}
                  </ul>
                </div>
                <a className="inline-flex text-sm underline underline-offset-2" href={selected.sourceUrl}
                  target="_blank" rel="noopener noreferrer">Documentação original do exemplo ↗</a>
              </section>
              <section className="space-y-3 rounded-lg border bg-card p-4 text-sm">
                <h3 className="font-semibold">Orientações para o agente · {selected.kind}</h3>
                <h4 className="font-medium">Quando usar</h4>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {selected.whenUse.map((rule, index) => <li key={index}>{rule}</li>)}
                </ul>
                <h4 className="font-medium">Quando não usar</h4>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {selected.familyWhenNotUse.map((rule, index) => <li key={index}>{rule}</li>)}
                </ul>
                <h4 className="font-medium">Notas do agente</h4>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {selected.agentNotes.map((rule, index) => <li key={index}>{rule}</li>)}
                </ul>
              </section>
            </>
          ) : <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            Selecione outra família ou altere a busca para encontrar composições.
          </div>}
        </div>
      </div>
    </section>
  )
}
