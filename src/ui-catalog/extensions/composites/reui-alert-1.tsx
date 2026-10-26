/** ReUI c-alert-1 (Base UI), composição estática e auditável. */
import { Alert, AlertDescription, AlertTitle } from "./reui-alert-adapter"
import { reuiSemanticDefaults, type ReuiSemanticDataFor } from "./reui-semantic-config"

export default function Pattern({ data = reuiSemanticDefaults["c-alert-1"] }: {
  data?: ReuiSemanticDataFor<"c-alert-1">
}) {
  return (
    <Alert>
      <AlertTitle>{data.title}</AlertTitle>
      <AlertDescription>{data.description}</AlertDescription>
    </Alert>
  )
}
