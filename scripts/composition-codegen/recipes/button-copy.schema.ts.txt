import {z} from "zod";
/** REVIEW-ONLY: text data, not arbitrary HTML/JSX/URLs. */
export const copyFeedbackButtonSchema=z.object({
  label:z.string().trim().min(1).max(90),
  text:z.string().min(1).max(2000),
}).strict();
export type CopyFeedbackButtonProps=z.infer<typeof copyFeedbackButtonSchema>;
