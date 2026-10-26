import {z} from "zod";
/** REVIEW-ONLY: no remote images, handlers or unsafe arbitrary JSX. */
export const teamMemberAccordionSchema=z.object({
  members:z.array(z.object({
    id:z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/),
    name:z.string().trim().min(1).max(120),
    role:z.string().trim().min(1).max(90),
    status:z.string().trim().min(1).max(40).optional(),
    description:z.string().max(600),
    disabled:z.boolean().optional(),
  }).strict()).min(1).max(20).superRefine((members,ctx)=>{
    const unique=new Set(members.map(member=>member.id));
    if(unique.size!==members.length)
      ctx.addIssue({code:"custom",message:"Member IDs must be unique."});
  }),
}).strict();
export type TeamMemberAccordionProps=z.infer<typeof teamMemberAccordionSchema>;
