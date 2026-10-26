import {z} from "zod";
/** REVIEW-ONLY proposal. Must be reviewed before any registration in Pi. */
export const acknowledgedActionDialogSchema=z.object({
  trigger:z.string().trim().min(1).max(100),
  title:z.string().trim().min(1).max(140),
  description:z.string().trim().min(1).max(600),
  acknowledgmentLabel:z.string().trim().min(1).max(180),
  confirmLabel:z.string().trim().min(1).max(40),
}).strict();
export type AcknowledgedActionDialogProps=z.infer<typeof acknowledgedActionDialogSchema>;
