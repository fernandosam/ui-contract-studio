import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GalleryVerticalEnd } from "lucide-react";
import type { CompositeOverrides, CompositeTemplate } from "./compile-composition.mjs";

type Node = { type: string; props: Record<string, unknown>; children: string[] };
type AuthNode = { id: string; label: string; type: string; placeholder: string; name: string };
function readText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Auth blocks are full-page compositions in upstream shadcn. A generic Card
 * renderer loses the distinct center/split/social layouts. This adapter keeps
 * the existing vetted contract/overrides but renders the composition explicitly.
 * Demo buttons do not send credentials anywhere.
 */
export function AuthBlock({
  template, props, slug,
}: { template: CompositeTemplate; props: CompositeOverrides; slug: string }) {
  const source = template.elements as Record<string, Node>;
  const overrides = (props as { content?: Record<string, string>; title?: string; description?: string }).content ?? {};
  const content = (id: string, key: string, fallback: string) =>
    readText(overrides[`${id}.${key}`], fallback);
  const entries = Object.entries(source);
  const root = source[template.root];
  const title = readText((props as { title?: string }).title, content(template.root, "title", readText(root.props.title)));
  const description = readText((props as { description?: string }).description,
    content(template.root, "description", readText(root.props.description)));
  const inputs: AuthNode[] = entries.filter(([,n]) => n.type === "Input").map(([id,n]) => ({
    id, label: content(id, "label", readText(n.props.label)),
    type: readText(n.props.type, "text"), placeholder: content(id, "placeholder", readText(n.props.placeholder)),
    name: readText(n.props.name, id),
  }));
  const buttons = entries.filter(([,n]) => n.type === "Button").map(([id,n]) => ({
    id, label: content(id, "label", readText(n.props.label)),
    variant: readText(n.props.variant, "default"),
  }));
  const primary = buttons.find(b => /^(login|create account|sign up|continue)$/i.test(b.label)) ??
    buttons.find(b => b.variant === "default" && !/with |apple|google|github/i.test(b.label)) ?? buttons[0];
  const socials = buttons.filter(b => b.id !== primary?.id);
  const signup = slug.startsWith("signup");
  const variant = Number(slug.split("-")[1]);
  const split = variant === 2 || variant === 4 || variant === 5;
  const framedCard = variant === 1 || variant === 3;
  const socialFirst = variant === 3;
  const sideOnLeft = variant === 4;
  const copyright = entries.find(([,n]) => n.type === "Text" && /terms of service|privacy policy/i.test(readText(n.props.text)));
  const footer = signup ? "Already have an account? Log in" : "Don't have an account? Sign up";
  const fieldNodes: ReactNode = inputs.map(field => (
    <div key={field.id} className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={field.name}>{field.label}</Label>
        {field.type === "password" && !signup && field === inputs.find(x => x.type === "password") &&
          <a href="#auth-demo" onClick={e => e.preventDefault()} className="text-xs underline-offset-4 hover:underline">Forgot your password?</a>}
      </div>
      <Input id={field.name} name={field.name} type={field.type}
        placeholder={field.placeholder} autoComplete={field.type === "password" ? (signup ? "new-password" : "current-password") : field.type === "email" ? "email" : "name"} />
    </div>
  ));
  const socialButtons = socials.map(button => (
    <Button key={button.id} variant="outline" type="button" className="w-full" onClick={e => e.preventDefault()}>
      {button.label}
    </Button>
  ));
  const actions = <div className="grid gap-3">
    <Button type="button" className="w-full">{primary?.label ?? (signup ? "Create Account" : "Login")}</Button>
  </div>;
  const socialSection = socialButtons.length ? <div className="grid gap-4">
    <div className="relative flex items-center gap-3">
      <Separator className="flex-1" />
      <span className="shrink-0 text-xs text-muted-foreground">Or continue with</span>
      <Separator className="flex-1" />
    </div>
    <div className="grid gap-3">{socialButtons}</div>
  </div> : null;
  const form = <div className="mx-auto flex w-full max-w-sm flex-col gap-6 py-6 sm:py-8">
    <div className="grid gap-2 text-center">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    {socialFirst && socialSection}
    <form className="grid gap-5" onSubmit={e => e.preventDefault()}>
      <div className="grid gap-4">{fieldNodes}</div>
      {actions}
      {!socialFirst && framedCard && socialButtons.length > 0 && <div className="grid gap-3">{socialButtons}</div>}
    </form>
    {!socialFirst && !framedCard && socialSection}
    <p className="text-center text-sm">{footer}</p>
    {copyright && <p className="text-center text-xs leading-relaxed text-muted-foreground">
      {content(copyright[0], "text", readText(copyright[1].props.text))}
    </p>}
  </div>;
  const illustration = <div aria-hidden="true" className="hidden min-h-[480px] bg-muted lg:flex lg:items-center lg:justify-center">
    <div className="flex size-24 items-center justify-center rounded-3xl border bg-background text-3xl font-semibold tracking-tight shadow-sm">A</div>
  </div>;
  const brand = <div className="flex items-center justify-center gap-2 text-sm font-semibold"><span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground"><GalleryVerticalEnd className="size-4" aria-hidden="true"/></span>Acme Inc.</div>;
  return (
    <div data-auth-layout={slug} className="w-full min-w-0 overflow-hidden rounded-xl">
      {split ? (
        <div className="grid w-full min-w-0 overflow-hidden rounded-xl border bg-background lg:grid-cols-2">
          {sideOnLeft && illustration}
          <div className="flex min-w-0 flex-col justify-center gap-4 px-5 py-6 sm:px-8">{brand}{form}</div>
          {!sideOnLeft && illustration}
        </div>
      ) : variant === 3 ? (
        <div className="flex min-h-[480px] w-full flex-col items-center justify-center gap-6 bg-muted px-4 py-8">
          {brand}
          <Card className="w-full max-w-sm"><CardContent>{form}</CardContent></Card>
        </div>
      ) : (
        <div className="flex w-full items-center justify-center bg-background px-3 py-6">
          <Card className="w-full max-w-md">
            <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
            <CardContent className="px-6">{<div className="grid gap-5"><form className="grid gap-4" onSubmit={e => e.preventDefault()}><div className="grid gap-4">{fieldNodes}</div>{actions}{socialButtons}</form><p className="text-center text-sm">{footer}</p></div>}</CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
