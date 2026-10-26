import {z} from "zod";
/** REVIEW-ONLY proposal. Type-to-confirm requires exact match, no backend action. */
export const typedConfirmationDialogSchema=z.object({
  trigger:z.string().trim().min(1).max(100),
  title:z.string().trim().min(1).max(140),
  description:z.string().trim().min(1).max(600),
  expectedText:z.string().min(1).max(80),
  confirmLabel:z.string().trim().min(1).max(40),
}).strict();
export type TypedConfirmationDialogProps=z.infer<typeof typedConfirmationDialogSchema>;
