import {useEffect,useId,useState} from 'react';
import {Card,CardContent,CardDescription,CardHeader,CardTitle} from '@/components/ui/card';
import {Avatar,AvatarFallback} from '@/components/ui/avatar';
import {Label} from '@/components/ui/label';

export type MemberInfo={id:string;name:string;role:string;description?:string};
export type SiteCardsTeamMembersProps={
 content?:Record<string,string>;title?:string;description?:string;
 members?:MemberInfo[];roles?:string[];allowRoleChanges?:boolean;
};
const DEFAULT_MEMBERS:MemberInfo[]=[
 {id:'sofia',name:'Sofia Davis',role:'Owner'},
 {id:'jackson',name:'Jackson Lee',role:'Developer'},
 {id:'isabella',name:'Isabella Nguyen',role:'Billing'},
];
const DEFAULT_ROLES=['Viewer','Developer','Billing','Owner'];
/** Local roles only; no account API, invitation, persistence or authorization changes. */
export function SiteCardsTeamMembers({props,onEvent}:{props:SiteCardsTeamMembersProps;onEvent?:(event:string)=>void}){
 const members=props.members??DEFAULT_MEMBERS;
 const roles=props.roles?.length?props.roles:DEFAULT_ROLES;
 const [choices,setChoices]=useState<Record<string,string>>({});
 const id=useId();
 useEffect(()=>setChoices({}),[props.members]);
 return <Card data-composite="SiteCardsTeamMembers">
  <CardHeader><CardTitle>{props.title??props.content?.['c001.title']??'Team Members'}</CardTitle>
   <CardDescription>{props.description??props.content?.['c001.description']??'Invite your team members to collaborate (demo).'}</CardDescription></CardHeader>
  <CardContent><ul className="space-y-3">
   {members.map(member=><li className="flex min-w-0 items-center gap-3 rounded-lg border border-border p-3" key={member.id}>
    <Avatar className="size-9"><AvatarFallback>{member.name.trim().slice(0,1).toUpperCase()}</AvatarFallback></Avatar>
    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{member.name}</p>{member.description&&<p className="text-xs text-muted-foreground">{member.description}</p>}</div>
    <Label htmlFor={`${id}-${member.id}`} className="sr-only">Papel de {member.name}</Label>
    <select id={`${id}-${member.id}`} className="max-w-32 rounded-md border border-input bg-background px-2 py-1 text-sm" disabled={props.allowRoleChanges===false}
      value={choices[member.id]??member.role} onChange={e=>{setChoices(old=>({...old,[member.id]:e.target.value}));onEvent?.('roleChange');}}>
      {[...new Set([...roles,member.role])].map(role=><option key={role} value={role}>{role}</option>)}
    </select>
   </li>)}
  </ul><p className="mt-3 text-xs text-muted-foreground">Papéis alterados apenas nesta prévia; nenhuma permissão real é modificada.</p></CardContent>
 </Card>;
}
