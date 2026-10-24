import { useEffect, useState } from "react"
import { CodeXmlIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

/**
 * Carregamento sob demanda dos arquivos TSX homologados.
 * Cada fonte original permanece num chunk independente do código da Galeria 3.
 */
const sourceLoaders = import.meta.glob<string>("./reui-*.tsx", {
  query: "?raw",
  import: "default",
})

function loadSource(id: string): Promise<string> {
  const match = /^c-([a-z0-9-]+)-([1-9][0-9]*)$/.exec(id)
  if (!match) return Promise.reject(new Error("Identificador de exemplo inválido."))
  const path = "./reui-" + match[1] + "-" + match[2] + ".tsx"
  const loader = sourceLoaders[path]
  if (!loader) return Promise.reject(new Error("Código-fonte local indisponível."))
  return loader()
}

/**
 * Visualizador de código em gaveta lateral direita: modal, acessível e com
 * realce de sintaxe. Nenhum JSX do código-fonte é avaliado ou executado.
 */
export function ReuiSourceViewer({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const filename = "reui-" + id.slice(2) + ".tsx"

  useEffect(() => {
    if (!open || source !== null || failed) return
    let active = true
    loadSource(id).then(text => {
      if (active) { setSource(text); setFailed(false) }
    }).catch(() => {
      if (active) setFailed(true)
    })
    return () => { active = false }
  }, [open, id, source, failed, retry])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <code className="text-xs text-muted-foreground">@reui/{id}</code>
        <SheetTrigger
          render={<Button type="button" variant="outline" size="xs"
            aria-label={"Ver código do exemplo " + id}
            data-testid={"reui-code-toggle-" + id} />}
        >
          <CodeXmlIcon className="size-3" aria-hidden="true" />
          Ver código
        </SheetTrigger>
      </div>
      <SheetContent side="right" showCloseButton={false}
        data-testid={"reui-source-panel-" + id}
        className="gap-0 p-0"
        style={{ width: "min(100vw, 1200px)", maxWidth: "none" }}>
        <SheetHeader className="relative shrink-0 border-b pr-14">
          <SheetTitle>Código-fonte</SheetTitle>
          <SheetDescription>
            Exemplo @reui/{id} · arquivo TSX local
          </SheetDescription>
          <SheetClose
            render={<Button type="button" variant="ghost" size="icon-sm"
              className="absolute right-4 top-4" aria-label="Fechar código" />}
          >
            <XIcon aria-hidden="true" />
          </SheetClose>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          {failed && source === null ?
            <div role="alert" className="space-y-3 rounded-md border p-4 text-sm">
              <p>Não foi possível carregar o código-fonte local.</p>
              <Button type="button" variant="outline" size="sm"
                onClick={() => { setFailed(false); setRetry(value => value + 1) }}>
                Tentar novamente
              </Button>
            </div>
          : source === null ?
            <p role="status" className="p-4 text-sm text-muted-foreground">Carregando código…</p>
          : <CodeBlock code={source} filename={filename} language="tsx"
              className="min-h-0 flex-1" />}
        </div>
      </SheetContent>
    </Sheet>
  )
}
