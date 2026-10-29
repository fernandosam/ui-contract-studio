import { useState } from "react";
import { SpecScreen } from "./spec-screen";
import { createPiTreeEditSession } from "./tree-edit-session";
import type { TreeDiff, TreeEditPreview } from "../../scripts/lib/spec-tree-history.mjs";

type ExampleTree = {
  root: string;
  elements: Record<string, { type: string; props: Record<string, unknown> }>;
};

function suggestedPatch(spec: unknown, selectedId?: string): string {
  const tree = spec as ExampleTree;
  const candidates = [selectedId, ...Object.keys(tree.elements)].filter((id): id is string => Boolean(id));
  for (const nodeId of candidates) {
    const props = tree.elements[nodeId]?.props ?? {};
    const entry = Object.entries(props).find(([key, value]) =>
      ["text", "title", "label", "description", "placeholder"].includes(key) && typeof value === "string");
    if (entry) {
      return JSON.stringify({ schemaVersion: 1, operations: [{
        op: "update", nodeId, setProps: { [entry[0]]: String(entry[1]) + " (editado)" },
      }] }, null, 2);
    }
  }
  return JSON.stringify({ schemaVersion: 1, operations: [{
    op: "add", nodeId: "newText", parentId: tree.root,
    node: { type: "Text", props: { text: "Novo texto" }, children: [] },
  }] }, null, 2);
}

function DiffSummary({ diff }: { diff: TreeDiff }) {
  const count = diff.added.length + diff.removed.length + diff.moved.length + diff.properties.length;
  return <div data-testid="tree-diff-summary" className="space-y-2 text-xs">
    <p className="font-medium">{count} diferença(s) efetiva(s) · sem valores de propriedades no resumo</p>
    <ul className="space-y-1 font-mono break-all">
      {diff.added.map(id => <li key={`add:${id}`} className="text-emerald-700 dark:text-emerald-300">+ nó {id}</li>)}
      {diff.removed.map(id => <li key={`remove:${id}`} className="text-destructive">− nó {id}</li>)}
      {diff.moved.map(item => <li key={`move:${item.nodeId}`}>↔ {item.nodeId}: {item.from.parentId}/{item.from.slot ?? "children"}[{item.from.index}] → {item.to.parentId}/{item.to.slot ?? "children"}[{item.to.index}]</li>)}
      {diff.properties.map(item => <li key={`props:${item.nodeId}`}>~ {item.nodeId}: {[
        ...item.addedKeys.map(key => `+${key}`),
        ...item.removedKeys.map(key => `−${key}`),
        ...item.changedKeys.map(key => `~${key}`),
      ].join(", ")}</li>)}
    </ul>
  </div>;
}

/** Local-only workbench. It cannot select an experimental Pi channel or execute actions. */
export function TreePatchWorkbench({ spec, selectedId }: { spec: unknown; selectedId?: string }) {
  const [session] = useState(() => createPiTreeEditSession(spec));
  const [view, setView] = useState(() => session.read());
  const [draft, setDraft] = useState(() => suggestedPatch(spec, selectedId));
  const [preview, setPreview] = useState<TreeEditPreview | null>(null);
  const [message, setMessage] = useState("");

  function showPreview() {
    setPreview(null);
    try {
      const result = session.preview(JSON.parse(draft) as unknown);
      setPreview(result);
      setMessage(result.ok ? "Prévia validada; nenhuma alteração aplicada ainda." : result.error.message);
    } catch {
      setMessage("O patch precisa ser um JSON válido.");
    }
  }
  function navigate(action: "commit" | "undo" | "redo") {
    const result = session[action]();
    if (result.ok) {
      setView(session.read());
      setPreview(null);
      setMessage(action === "commit" ? "Patch aplicado localmente." :
        action === "undo" ? "Alteração desfeita." : "Alteração refeita.");
    } else {
      setMessage(result.error.message);
      setPreview(null);
    }
  }

  return <section className="min-w-0 space-y-4 rounded-xl border bg-card p-4" aria-label="Edição estruturada da árvore" data-testid="tree-patch-workbench">
    <header className="space-y-1">
      <h3 className="font-semibold">Alterações estruturadas · E08</h3>
      <p className="text-xs text-muted-foreground">Edite operações JSON de adicionar, remover, mover ou atualizar. A prévia passa pelo catálogo estável e pelo validador estrutural antes de permitir a aplicação. Histórico apenas nesta sessão, sem salvar arquivos.</p>
    </header>
    <div className="space-y-2">
      <label htmlFor="tree-patch-json" className="block text-sm font-medium">Patch estruturado (v1)</label>
      <textarea id="tree-patch-json" data-testid="tree-patch-json" spellCheck={false} rows={9}
        value={draft} onChange={event => { setDraft(event.target.value); setPreview(null); setMessage(""); }}
        className="w-full min-w-0 rounded-md border border-input bg-background p-3 font-mono text-xs focus-visible:outline-2 focus-visible:outline-ring" />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={showPreview} className="rounded-md border bg-background px-3 py-2 text-xs font-medium hover:bg-muted">Pré-visualizar diferenças</button>
        <button type="button" onClick={() => navigate("commit")} disabled={!preview?.ok}
          className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">Aplicar prévia</button>
        <button type="button" onClick={() => navigate("undo")} disabled={!view.canUndo}
          className="rounded-md border px-3 py-2 text-xs disabled:opacity-40">Desfazer</button>
        <button type="button" onClick={() => navigate("redo")} disabled={!view.canRedo}
          className="rounded-md border px-3 py-2 text-xs disabled:opacity-40">Refazer</button>
      </div>
      {message && <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{message}</p>}
    </div>
    {preview?.ok && <div className="space-y-3 rounded-lg border bg-muted/20 p-3" data-testid="tree-patch-preview">
      <h4 className="text-sm font-semibold">Diferenças propostas — ainda não aplicadas</h4>
      <DiffSummary diff={preview.diff} />
      <details>
        <summary className="cursor-pointer text-xs font-medium">Comparação visual (antes/depois)</summary>
        <div className="mt-3 grid min-w-0 gap-3 lg:grid-cols-2">
          <div className="min-w-0 overflow-auto rounded-md border bg-background p-3"><p className="mb-2 text-xs font-medium">Antes</p><SpecScreen key={`before-${view.revision}`} spec={view.spec} /></div>
          <div className="min-w-0 overflow-auto rounded-md border bg-background p-3"><p className="mb-2 text-xs font-medium">Depois</p><SpecScreen key={`after-${view.revision}`} spec={preview.spec} /></div>
        </div>
      </details>
    </div>}
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Histórico local ({view.history.length})</h4>
      <p className="text-xs text-muted-foreground">Revisão {view.revision} · posição {view.cursor} de {view.history.length}. Um novo commit após desfazer descarta a sequência de refazer. Valores de props não aparecem no histórico.</p>
      {view.history.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma alteração aplicada nesta sessão.</p> :
        <ol className="max-h-52 space-y-2 overflow-auto" data-testid="tree-patch-history">
          {view.history.map(entry => <li key={entry.id} className="rounded-md border p-2 text-xs">
            <p className="mb-1 font-medium">#{entry.id} · {entry.applied ? "aplicada" : "desfeita"} · {entry.changes.map(change => change.op).join(", ")}</p>
            <DiffSummary diff={entry.diff} />
          </li>)}
        </ol>}
    </div>
    <details className="rounded-md border p-3">
      <summary className="cursor-pointer text-xs font-medium">JSON atual da sessão (somente leitura)</summary>
      <pre className="mt-2 max-h-72 overflow-auto rounded bg-muted p-3 text-xs"><code>{JSON.stringify(view.spec, null, 2)}</code></pre>
    </details>
  </section>;
}
