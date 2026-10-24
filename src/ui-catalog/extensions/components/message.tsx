import { Message as Root, MessageContent, MessageHeader } from "@/components/ui/message";
export type MessageProps={author:string;text:string;align?:"start"|"end"};
export function Message({props}:{props:MessageProps}) {
 return <Root align={props.align??"start"} className="gap-2 py-2"><MessageContent className="max-w-[85%] gap-1"><MessageHeader className="text-xs font-semibold text-muted-foreground">{props.author}</MessageHeader><p className="rounded-lg bg-muted p-3 text-sm text-foreground">{props.text}</p></MessageContent></Root>;
}
