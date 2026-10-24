/** Vite discovers specs and metadata at build time. No component code can be inserted in a screen. */
const specs = import.meta.glob('../ui-screens/*.json', { eager: true, import: 'default' });
const descriptors = import.meta.glob('../ui-screen-meta/*.json', { eager: true, import: 'default' });
export type ScreenEntry = { slug: string; spec: unknown; title: string; subtitle: string; section: string; order: number; icon: string };
const extractSlug = (path: string) => path.split('/').at(-1)!.replace(/\.json$/, '');
const validSlug = (slug: string) => /^[a-z][a-z0-9-]{0,63}$/.test(slug);
export const screens: Record<string, ScreenEntry> = {};
for (const [path, spec] of Object.entries(specs)) {
  const slug = extractSlug(path);
  if (!validSlug(slug)) throw new Error(`Nome de tela não autorizado: ${slug}`);
  const description = descriptors[`../ui-screen-meta/${slug}.json`] as Partial<ScreenEntry> | undefined;
  screens[slug] = {
    slug, spec, title: typeof description?.title === 'string' ? description.title : slug,
    subtitle: typeof description?.subtitle === 'string' ? description.subtitle : 'Interface construída com catálogo aprovado.',
    section: typeof description?.section === 'string' ? description.section : slug,
    order: typeof description?.order === 'number' ? description.order : 999,
    icon: typeof description?.icon === 'string' ? description.icon : 'layers',
  };
}
export const navigation = Object.values(screens).sort((a,b) => a.order - b.order || a.slug.localeCompare(b.slug));
