import { expect, type Locator } from '@playwright/test';

// Browser geometry checks shared by primitive examples, composite cards and shadcn blocks.
// The report intentionally distinguishes structural geometry from upstream pixel fidelity.
export async function auditVisualGeometry(root: Locator, label: string) {
  const result = await root.evaluate(element => {
    const measured = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    const outer = measured(element);
    const nodes = Array.from(element.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]),select,textarea,button,[role="button"],[data-slot="card"],[data-slot="carousel-previous"],[data-slot="carousel-next"]'
    )).filter(el => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      // Radix/Base UI can keep screen-reader-only 1px inputs in the DOM.
      // They are not visible layout controls and must not be treated as overflowing fields.
      const clipped = style.clipPath === 'inset(50%)' || style.clip === 'rect(0px, 0px, 0px, 0px)';
      return el.getClientRects().length > 0 && style.visibility !== 'hidden' && style.display !== 'none'
        && rect.width > 2 && rect.height > 2 && !clipped;
    });
    const elements = nodes.map((node, index) => ({
      name: node.getAttribute('aria-label') || node.getAttribute('data-slot') || node.getAttribute('name') || node.tagName.toLowerCase() + '-' + index,
      kind: node.matches('input,select,textarea') ? 'field' : node.matches('[data-slot="card"]') ? 'card' : 'action',
      ...measured(node)
    }));
    const outside = elements.filter(el => el.x < outer.x - 2 || el.right > outer.right + 2);
    const fields = elements.filter(el => el.kind === 'field');
    const overlap = fields.flatMap((a, i) => fields.slice(i + 1).filter(b =>
      Math.min(a.right,b.right)-Math.max(a.x,b.x)>4 &&
      Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>4
    ).map(b => [a.name,b.name]));
    const gaps = fields.flatMap((a,i) => fields.slice(i+1).filter(b =>
      Math.abs(a.x-b.x) <= 4 && Math.abs(a.width-b.width) <= 4 && b.y >= a.bottom
    ).map(b => ({from:a.name,to:b.name,px:Math.round(b.y-a.bottom)})));
    return { outer,elements,outside,overlap,gaps };
  });
  expect(result.outer.width, label + ': root collapsed').toBeGreaterThan(80);
  expect(result.outside, label + ': child protrudes beyond container').toEqual([]);
  expect(result.overlap, label + ': input fields overlap').toEqual([]);
  for (const el of result.elements.filter(el => el.kind === 'field')) {
    // Checkbox/radio/switch controls are intentionally compact; text-entry fields are not.
    if (el.width > 30) {
      expect(el.width, label + ': field too narrow (' + el.name + ')').toBeGreaterThanOrEqual(90);
      expect(el.height, label + ': field too short (' + el.name + ')').toBeGreaterThanOrEqual(24);
    }
  }
  return result;
}
