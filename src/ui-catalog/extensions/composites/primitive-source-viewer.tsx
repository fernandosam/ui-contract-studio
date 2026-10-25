import { useEffect, useState } from "react"
import { CodeXmlIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"
import {
  Sheet, SheetClose, SheetContent, SheetDescription,
  SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"

/**
 * A mesma gaveta de código da galeria ReUI para contratos shadcn/Pi.
 * Carrega o TSX do componente local apenas após a abertura; não avalia fonte.
 * O JSON mostrado é a especificação autorizada do exemplo Pi, não JSX gerado.
 */
const officialSources = import.meta.glob<string>("../../../components/ui/*.tsx", {
  query: "?raw",
  import: "default",
})
const adapterSources = import.meta.glob<string>("../components/*.tsx", {
  query: "?raw",
  import: "default",
})

const componentPath = (name: string) => {
  const slug = name === "Radio" ? "radio-group" : name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
  const official = "../../../components/ui/" + slug + ".tsx"
  const adapter = "../components/" + slug + ".tsx"
  return officialSources[official] ? official : adapterSources[adapter] ? adapter : null
}

type PrimitiveSourceViewerProps = {
  type: string
  example?: unknown
}

export function PrimitiveSourceViewer({ type, example }: PrimitiveSourceViewerProps) {
  const path = componentPath(type)
  const loader = path ? officialSources[path] ?? adapterSources[path] : null
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"tsx" | "json">(loader ? "tsx" : "json")
  const [source, setSource] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const json = example === undefined ? null : JSON.stringify(example, null, 2)
  const filename = path?.split("/").at(-1) ?? type + ".json"

  useEffect(() => {
    if (!open || tab !== "tsx" || !loader || source !== null || failed) return
    let active = true
    loader().then(code => {
      if (active) { setSource(code); setFailed(false) }
    }).catch(() => {
      if (active) setFailed(true)
    })
    return () => { active = false }
  }, [open, tab, loader, source, failed, retry])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button type="button" variant="outline" size="xs"
          aria-label={"Ver código da primitiva " + type}
          data-testid={"primitive-code-toggle-" + type} />}
      >
        <CodeXmlIcon className="size-3" aria-hidden="true" />
        Ver código
      </SheetTrigger>
      <SheetContent side="right" showCloseButton={false}
        data-testid={"primitive-source-panel-" + type}
        className="gap-0 p-0"
        style={{ width: "min(100vw, 1200px)", maxWidth: "none" }}>
        <SheetHeader className="relative shrink-0 border-b pr-14">
          <SheetTitle>Código-fonte · {type}</SheetTitle>
          <SheetDescription>Componente TSX local e especificação JSON autorizada</SheetDescription>
          <SheetClose
            render={<Button type="button" variant="ghost" size="icon-sm"
              className="absolute right-4 top-4" aria-label="Fechar código" />}
          >
            <XIcon aria-hidden="true" />
          </SheetClose>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden gap-3 p-4">
          <div role="group" aria-label="Formato do código" className="flex shrink-0 flex-wrap gap-2">
            {loader && <Button type="button" size="sm" variant={tab === "tsx" ? "secondary" : "outline"}
              aria-pressed={tab === "tsx"} onClick={() => setTab("tsx")}>Componente TSX</Button>}
            {json !== null && <Button type="button" size="sm" variant={tab === "json" ? "secondary" : "outline"}
              aria-pressed={tab === "json"} onClick={() => setTab("json")}>Exemplo JSON</Button>}
          </div>
          {tab === "tsx" && loader ? (
            failed && source === null ?
              <div role="alert" className="space-y-3 rounded-md border p-4 text-sm">
                <p>Não foi possível carregar o código-fonte local.</p>
                <Button type="button" variant="outline" size="sm"
                  onClick={() => { setFailed(false); setRetry(v => v + 1) }}>Tentar novamente</Button>
              </div>
            : source === null ?
              <p role="status" className="p-4 text-sm text-muted-foreground">Carregando código…</p>
            : <CodeBlock code={source} filename={filename} language="tsx" className="min-h-0 flex-1" />
          ) : json !== null ?
            <CodeBlock code={json} filename={type + ".json"} language="json" className="min-h-0 flex-1" />
          : <p role="status" className="text-sm text-muted-foreground">Exemplo não disponível para este contrato.</p>}
        </div>
      </SheetContent>
    </Sheet>
  )
}
