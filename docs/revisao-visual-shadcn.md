[English](revisao-visual-shadcn.md) | [Português](revisao-visual-shadcn.pt-BR.md)

# Visual Fidelity of shadcn/ui Compositions

Visual review applies to the project's **active blocks and compositions**. shadcn/create Galleries 1 and 2 were removed, and their specific inventories and tests are not part of current verification.

To change a composition, consult official sources in `src/ui-catalog/block-source-inventory.json` and `src/ui-catalog/site-compositions-audit.json`. Compare rendered behavior with the original JSX, including dimensions, hierarchy, responsiveness, themes, and interactive states. Record real screenshots of the reference and local implementation rather than assuming visual equivalence.

Run `npm run composites:check`, `npm run blocks:check`, `npm run validate`, and `npm run build`. Composition auditing can be updated with `npm run composites:fidelity` and compared using `npm run composites:compare`. Visual certification is not automatic.

The `Dashboard01` composite remains available for reuse and individual review even without a Dashboard page in the menu.
