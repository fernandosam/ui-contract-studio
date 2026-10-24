import { useContext, useMemo } from "react";
import { Renderer } from "@json-render/react";
import type { Spec } from "@json-render/core";
import { catalog } from "../../catalog";
import { CompositeRegistryContext } from "../../composite-registry-context";
import { compileComposition, type CompositeOverrides, type CompositeTemplate } from "./compile-composition.mjs";

/** Only reviewed, static templates can be embedded. The caller may override a
 * bounded subset of text props; it cannot inject JSX, actions or component names.
 * Rendered beneath the root State/Action/Validation providers to preserve actions.
 */
export function ApprovedCardComposition({ spec: template, props }: {
  spec: CompositeTemplate;
  props: CompositeOverrides;
}) {
  const propsKey = JSON.stringify(props);
  const registry = useContext(CompositeRegistryContext);
  const result = useMemo(() => catalog.validate(compileComposition(template, props)), [template, propsKey]);

  // Validate each spec against the same closed catalog as regular screens.
  if (!result.success) {
    console.error("Composição aprovada inválida", result.error);
    return <p role="alert" className="text-destructive text-sm">Componente indisponível: contrato inválido.</p>;
  }
  if (!registry) return <p role="alert" className="text-destructive text-sm">Prévia indisponível: registry não fornecido.</p>;
  return <Renderer spec={result.data as unknown as Spec} registry={registry} />;
}
