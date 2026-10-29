import type { ReactNode } from "react";
import { Moon, Sun, CheckCircle2, LayoutGrid, Layers, ShieldCheck, Workflow, CalendarDays, Settings2, LogIn, UserPlus, PanelLeft, type LucideIcon } from "lucide-react";
import type { ScreenEntry } from "./screen-registry";
import {PreviewThemeProvider, usePreviewTheme} from "../ui-theme/preview-theme";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarInset, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const ICONS: Record<string,LucideIcon> = {dashboard:LayoutGrid,layers:Layers,activity:Workflow,calendar:CalendarDays,shield:ShieldCheck,settings:Settings2};
const BLOCK_ICONS: Record<string, LucideIcon> = {"blocos-login":LogIn,"blocos-signup":UserPlus,"blocos-sidebar":PanelLeft};
const GROUPS = [
  {label:"Exemplos", accepts:(entry:ScreenEntry) => entry.section === "Exemplos"},
  {label:"Blocos shadcn", accepts:(entry:ScreenEntry) => entry.section === "Blocos shadcn"},
  {label:"Ferramentas", accepts:(entry:ScreenEntry) => entry.section === "Ferramentas"},
];

// The application owns theme selection. Preview JSON and React examples cannot change it.
type ShellProps = { title: string; subtitle: string; section: string; children?: ReactNode; navigation: ScreenEntry[]; current: string };
export function PageShell(props: ShellProps) {
  return <PreviewThemeProvider><PageShellContent {...props} /></PreviewThemeProvider>;
}
function PageShellContent({title, subtitle, section, children, navigation, current}: ShellProps) {
  const {selection, toggleMode, canToggleMode} = usePreviewTheme();
  const theme = selection.mode;
  return <SidebarProvider>
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader><div className="flex items-center gap-3 p-2"><Workflow className="size-5 shrink-0"/><strong className="truncate group-data-[collapsible=icon]:hidden">ui-contract-studio</strong></div></SidebarHeader>
      <SidebarContent>
        {GROUPS.map(group => {
          const entries = navigation.filter(group.accepts);
          if (!entries.length) return null;
          return <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent><SidebarMenu>
              {entries.map(({title:name,icon,slug}) => { const Icon=BLOCK_ICONS[slug] ?? ICONS[icon] ?? Layers; return <SidebarMenuItem key={slug}>
                <SidebarMenuButton render={<a href={`?screen=${slug}`} aria-current={current===slug?"page":undefined}/>} isActive={current===slug} tooltip={name}>
                  <Icon aria-hidden="true"/><span>{name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>; })}
            </SidebarMenu></SidebarGroupContent>
          </SidebarGroup>;
        })}
      </SidebarContent>
      <SidebarFooter><div className="flex items-center gap-2 text-xs text-muted-foreground p-2"><ShieldCheck className="size-4"/><span>Catálogo aprovado</span></div></SidebarFooter>
    </Sidebar>
    <SidebarInset className="min-w-0 overflow-x-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-3"><SidebarTrigger aria-label="Alternar navegação" />
          <Breadcrumb><BreadcrumbList><BreadcrumbItem>UI Contract Studio</BreadcrumbItem><BreadcrumbSeparator/><BreadcrumbItem><BreadcrumbPage>{section}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
        </div>
        <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-muted-foreground"/>
          <Button variant="ghost" size="icon" type="button" onClick={toggleMode} disabled={!canToggleMode} aria-label={theme === "dark"?"Ativar tema claro":"Ativar tema escuro"}>
            {theme === "dark" ? <Sun className="size-4"/> : <Moon className="size-4"/>}
          </Button>
        </div>
      </header>
      <main className="min-w-0 max-w-full flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8"><div className="mb-6"><p className="text-xs uppercase text-muted-foreground">Protótipo de interface · Dados de demonstração</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>{children}</main>
      <footer className="px-6 py-4 text-xs text-muted-foreground border-t border-border">Projeto demonstrativo independente · Dados fictícios · Interfaces json-render</footer>
    </SidebarInset>
    <Toaster position="bottom-right" richColors />
  </SidebarProvider>;
}
