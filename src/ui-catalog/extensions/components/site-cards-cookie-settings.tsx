import { useId, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
export type SiteCardsCookieSettingsProps = {
 title?:string;description?:string;content?:Record<string,string>;
 necessaryLabel?:string;analyticsLabel?:string;marketingLabel?:string;
 defaultAnalytics?:boolean;defaultMarketing?:boolean;showOptionalCookies?:boolean;
};
/** Cookies are NOT written by this demo; necessary option is always enabled. */
export function SiteCardsCookieSettings({props,onEvent}:{props:SiteCardsCookieSettingsProps;onEvent?:(event:string)=>void}) {
 const prefix=useId();
 const [analytics,setAnalytics]=useState(props.defaultAnalytics??false);
 const [marketing,setMarketing]=useState(props.defaultMarketing??false);
 const [saved,setSaved]=useState(false);
 const option=(id:string,label:string,checked:boolean,onChange?:(x:boolean)=>void)=><div className="flex items-center justify-between gap-3 rounded-md border p-3" key={id}>
   <Label htmlFor={prefix+id}>{label}</Label><Switch id={prefix+id} checked={checked} disabled={!onChange} onCheckedChange={v=>{onChange?.(v);setSaved(false);onEvent?.("change");}}/>
 </div>;
 return <Card data-composite="SiteCardsCookieSettings"><CardHeader><CardTitle>{props.title??props.content?.["c001.title"]??"Cookie Settings"}</CardTitle><CardDescription>{props.description??props.content?.["c001.description"]??"Manage your cookie settings here."}</CardDescription></CardHeader>
 <CardContent className="space-y-2">{option('cookies-required',props.necessaryLabel??props.content?.["c003.label"]??props.content?.["c002.label"]??"Strictly Necessary",true)}
 <p className="text-xs text-muted-foreground">{props.content?.["c003.description"]??"These cookies are essential in order to use the website and use its features."}</p>{props.showOptionalCookies&&<>{option('cookies-analytics',props.analyticsLabel??"Analytics",analytics,setAnalytics)}{option('cookies-marketing',props.marketingLabel??"Marketing",marketing,setMarketing)}</>}</CardContent>
 <CardFooter><Button type="button" onClick={()=>{setSaved(true);onEvent?.("save");}}>{props.content?.["c004.label"]??"Save preferences"}</Button></CardFooter>
 {saved&&<p className="px-6 pb-4 text-xs text-muted-foreground" role="status">Preferências alteradas apenas nesta prévia. Nenhum cookie foi gravado.</p>}
 </Card>;
}
