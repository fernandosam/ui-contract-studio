import { useMemo, useState, type ReactNode } from "react"
import { CheckIcon, CodeXmlIcon, CopyIcon } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"

/**
 * Code Block reutilizável: TSX com destaque de sintaxe, linhas numeradas e cópia.
 * Interpreta fonte somente como texto (sem injetar HTML nem executar código).
 */
type CodeBlockProps = {
  code: string
  filename: string
  language?: string
  className?: string
}

const tokenPattern = /(\/\/.*$|\/\*.*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?:\x60)(?:\\.|[^\x60\\])*\x60|<\/?[A-Za-z][\w.]*(?=[\s/>])|\b(?:import|export|default|from|as|const|let|var|function|return|type|interface|extends|new|if|else|async|await|throw|class|typeof|void)\b|\b(?:true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*(?=\s*=))/g

function tokenColor(token: string): string {
  if (token.startsWith("//") || token.startsWith("/*")) return "text-muted-foreground/75"
  if (token.startsWith('"') || token.startsWith("'") || token.charCodeAt(0) === 96) return "text-emerald-700 dark:text-emerald-400"
  if (token.startsWith("<")) return "text-rose-700 dark:text-rose-400"
  if (/^(true|false|null|undefined|\d)/.test(token)) return "text-amber-700 dark:text-amber-400"
  if (/^(import|export|default|from|as|const|let|var|function|return|type|interface|extends|new|if|else|async|await|throw|class|typeof|void)$/.test(token)) return "text-violet-700 dark:text-violet-400"
  return "text-sky-700 dark:text-sky-400"
}

function highlightLine(line: string): ReactNode[] {
  const result: ReactNode[] = []
  const matcher = new RegExp(tokenPattern.source, "g")
  let start = 0
  let token = matcher.exec(line)
  while (token) {
    const index = token.index
    if (index > start) result.push(line.slice(start, index))
    result.push(<span key={index} className={tokenColor(token[0])}>{token[0]}</span>)
    start = index + token[0].length
    token = matcher.exec(line)
  }
  if (start < line.length) result.push(line.slice(start))
  return result
}

export function CodeBlock({ code, filename, language = "tsx", className }: CodeBlockProps) {
  const lines = useMemo(() => code.replace(/\r\n/g, "\n").split("\n"), [code])
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle")

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopyState("copied")
    } catch {
      setCopyState("error")
    }
  }

  return (
    <section data-slot="code-block" className={cn("flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border bg-background", className)}>
      <div data-slot="code-block-header" className="flex shrink-0 items-center justify-between gap-3 border-b bg-muted/40 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <CodeXmlIcon className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate font-mono" title={filename}>{filename}</span>
          <span className="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase">{language}</span>
        </div>
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={copyCode}
          data-testid="reui-copy-source" aria-label="Copiar código">
          {copyState === "copied" ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
          {copyState === "copied" ? "Copiado!" : "Copiar"}
        </Button>
      </div>
      <pre data-slot="code-block-content" data-testid="reui-code-block" tabIndex={0}
        aria-label={"Código-fonte em " + language + " de " + filename}
        className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain bg-muted/15 px-3 py-3 text-xs leading-6">
        <code className="block w-max min-w-full font-mono tabular-nums">
          {lines.map((line, index) => (
            <span data-slot="code-block-line" className="block whitespace-pre" key={index}>
              <span aria-hidden="true" className="mr-5 inline-block w-8 select-none text-right text-muted-foreground/60">{index + 1}</span>
              <span>{highlightLine(line)}</span>
            </span>
          ))}
        </code>
      </pre>
      <span role="status" aria-live="polite" className="sr-only">
        {copyState === "copied" ? "Código copiado para a área de transferência." : copyState === "error" ? "Não foi possível copiar o código." : ""}
      </span>
    </section>
  )
}
