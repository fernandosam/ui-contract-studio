import { useState, type CSSProperties } from 'react';
import {
  SidebarProvider, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export type BlockSidebarProps = {
  heading: string;
  sections: Array<{ label: string; items: string[] }>;
  active?: string;
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
  footer?: string;
  rightPanel?: boolean;
};

/**
 * Embeddable preview built from the official shadcn Sidebar subcomponents.
 * A normal <Sidebar> is viewport-fixed: embedding it inside a card would overlay
 * the host app. Instead, this adapter renders the menu pieces in a bounded aside
 * while preserving the same colors and composition, with local selection/collapse.
 */
export function BlockSidebar({ props }: { props: BlockSidebarProps }) {
  const [selected, setSelected] = useState(props.active ?? props.sections[0]?.items[0] ?? 'Overview');
  const [collapsed, setCollapsed] = useState(false);
  const sections = props.sections;
  const compact = collapsed && props.collapsible !== 'none';
  const isFloating = props.variant === 'floating';
  return (
    <div className="w-full overflow-hidden rounded-lg border bg-background">
      <SidebarProvider defaultOpen style={{ '--sidebar-width': '15rem', minHeight: '370px' } as CSSProperties}>
        <div className="flex w-full min-w-0" data-block-sidebar-preview>
          <aside className={`flex shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] ${compact ? 'w-14' : 'w-52'} ${isFloating ? 'm-2 rounded-lg border shadow-sm' : ''}`} aria-label={props.heading}>
            <SidebarHeader>
              <div className="flex items-center gap-2 px-2 py-2">
                <Avatar className="size-7 shrink-0"><AvatarFallback>{props.heading.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                {!compact && <span className="truncate text-sm font-semibold">{props.heading}</span>}
              </div>
            </SidebarHeader>
            <SidebarContent>
              {sections.map(section => (
                <SidebarGroup key={section.label}>
                  {!compact && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map(item => (
                        <SidebarMenuItem key={item}>
                          <SidebarMenuButton isActive={item === selected} tooltip={item} onClick={() => setSelected(item)}>
                            <span className="size-2 shrink-0 rounded-full bg-current opacity-35" aria-hidden />
                            {!compact && <span className="truncate">{item}</span>}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
            {props.footer && !compact && <SidebarFooter><p className="truncate px-2 text-xs text-muted-foreground">{props.footer}</p></SidebarFooter>}
          </aside>
          <section className="flex min-w-0 flex-1 flex-col">
            <header className="flex min-h-12 items-center gap-2 border-b px-3 text-sm">
              {props.collapsible !== 'none' && <Button type="button" size="icon-sm" variant="ghost" aria-label={compact ? 'Expandir menu de demonstração' : 'Recolher menu de demonstração'} onClick={() => setCollapsed(c => !c)}>☰</Button>}
              <span className="truncate font-medium">{selected}</span>
            </header>
            <main className="flex min-h-72 flex-1 flex-col gap-3 p-3">
              <div className="grid grid-cols-3 gap-2"><div className="h-16 rounded-lg bg-muted"/><div className="h-16 rounded-lg bg-muted"/><div className="h-16 rounded-lg bg-muted"/></div>
              <div className="min-h-24 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">{selected} · conteúdo demonstrativo, sem navegação externa</div>
            </main>
          </section>
        </div>
      </SidebarProvider>
    </div>
  );
}
