import { actionDefinitions } from "./catalog";

/** Only demo feedback handlers cross this boundary; never a fetch or service adapter. */
export type LocalFeedbackAction = "buttonClick" | "formSubmit" | "linkClick";

export function parseLocalFeedbackAction(action: "buttonClick", params: unknown):
  { message: string | null } | null;
export function parseLocalFeedbackAction(action: "formSubmit", params: unknown):
  { formName: string | null } | null;
export function parseLocalFeedbackAction(action: "linkClick", params: unknown):
  { href: string } | null;
export function parseLocalFeedbackAction(action: LocalFeedbackAction, params: unknown) {
  const result = actionDefinitions[action].params.safeParse(params);
  return result.success ? result.data : null;
}
