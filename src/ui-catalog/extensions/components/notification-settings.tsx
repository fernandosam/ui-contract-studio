import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldLabel, FieldDescription, FieldGroup } from '@/components/ui/field';

/**
 * Hand-reviewed shadcn/create NotificationSettings adaptation. The old static
 * template is retained as the audited source for AI configuration and migration.
 * Overrides remain restricted by the Zod contract defined in extensions/catalog.ts.
 * No external calls or persistent account preferences are made.
 */
export type NotificationSettingsProps = {
  title?: string;
  description?: string;
  content?: Record<string, string | undefined>;
  nodeProps?: Record<string, Record<string, unknown> | undefined>;
};
const defaults = [
  { key: 'transactions', node: 'notification_settings_1', label:'Transaction alerts', help:'Deposits, withdrawals, and transfers.', initial:true },
  { key: 'security', node: 'notification_settings_2', label:'Security alerts', help:'Login attempts and account changes.', initial:true },
  { key: 'goals', node: 'notification_settings_3', label:'Goal milestones', help:'Updates at 25%, 50%, 75%, and 100%.', initial:false },
  { key: 'market', node: 'notification_settings_4', label:'Market updates', help:'Daily portfolio summary and price alerts.', initial:false },
] as const;
type Choice = (typeof defaults)[number]['key'];

export function NotificationSettings({ props }: {props:NotificationSettingsProps}) {
  const items = useMemo(() => defaults.map(item => {
    const node = props.nodeProps?.[item.node];
    const help = props.content?.[`${item.node}_help.text`] ??
      (typeof props.nodeProps?.[`${item.node}_help`]?.text === 'string' ? props.nodeProps[`${item.node}_help`]!.text as string : item.help);
    return {
      ...item,
      label: props.content?.[`${item.node}.label`] ?? (typeof node?.label === 'string' ? node.label : item.label),
      help,
      initial: typeof node?.checked === 'boolean' ? node.checked :
        typeof node?.defaultChecked === 'boolean' ? node.defaultChecked : item.initial,
    };
  }), [props.content,props.nodeProps]);
  const [checked,setChecked] = useState<Record<Choice,boolean>>(() =>
    Object.fromEntries(items.map(n => [n.key,n.initial])) as Record<Choice,boolean>
  );
  const [saved,setSaved] = useState(false);
  const allChecked = items.every(n=>checked[n.key]);
  const someChecked = items.some(n=>checked[n.key]) && !allChecked;
  const toggleAll = (value:boolean) => {setChecked(Object.fromEntries(items.map(n=>[n.key,value])) as Record<Choice,boolean>);setSaved(false);};
  const toggle = (key:Choice,value:boolean) => {setChecked(prev=>({...prev,[key]:value}));setSaved(false);};
  const title = props.title ?? props.content?.['n0076.title'] ?? 'Notifications';
  const description = props.description ?? props.content?.['n0076.description'] ?? 'Choose what you want to be notified about.';
  return <div data-composite="NotificationSettings" className="min-w-0 w-full">
    <Card className="h-full min-w-0">
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
      <CardContent><FieldGroup>
        <Field orientation="horizontal">
          <Checkbox id="preview-notify-all" checked={allChecked} indeterminate={someChecked} onCheckedChange={v=>toggleAll(v===true)}/>
          <FieldContent><FieldLabel htmlFor="preview-notify-all">{props.content?.['notification_settings_0.label'] ?? 'Select all'}</FieldLabel></FieldContent>
        </Field>
        {items.map(n=><Field key={n.key} orientation="horizontal">
          <Checkbox id={`preview-notify-${n.key}`} checked={checked[n.key]} onCheckedChange={v=>toggle(n.key,v===true)}/>
          <FieldContent><FieldLabel htmlFor={`preview-notify-${n.key}`}>{n.label}</FieldLabel><FieldDescription>{n.help}</FieldDescription></FieldContent>
        </Field>)}
      </FieldGroup></CardContent>
      <CardFooter className="flex-col gap-2">
        <Button className="w-full" type="button" onClick={()=>setSaved(true)}>{props.content?.['notification_submit.label'] ?? 'Save Preferences'}</Button>
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{saved?'Preferences saved locally (demo only).':''}</p>
      </CardFooter>
    </Card>
  </div>;
}
