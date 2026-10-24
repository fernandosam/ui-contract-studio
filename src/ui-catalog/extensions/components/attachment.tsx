import { FileTextIcon } from "lucide-react";
import { Attachment as Root, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription } from "@/components/ui/attachment";
export type AttachmentProps={fileName:string;details:string|null;state?:"idle"|"uploading"|"processing"|"error"|"done";size?:"default"|"sm"|"xs";orientation?:"horizontal"|"vertical"};
export function Attachment({props}:{props:AttachmentProps}) {
 return <Root state={props.state??"done"} size={props.size??"default"} orientation={props.orientation??"horizontal"} className="gap-3 rounded-lg px-3 py-2">
  <AttachmentMedia variant="icon" className="rounded-md bg-muted p-2"><FileTextIcon className="size-5" aria-hidden="true"/></AttachmentMedia>
  <AttachmentContent className="min-w-0 flex-1"><AttachmentTitle className="font-medium">{props.fileName}</AttachmentTitle>{props.details&&<AttachmentDescription>{props.details}</AttachmentDescription>}</AttachmentContent>
 </Root>;
}
