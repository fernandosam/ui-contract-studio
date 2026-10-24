import type { ReactElement } from 'react';
import { ApprovedCardComposition } from './approved-card-composition';
import { AuthBlock } from './auth-block';
import type { CompositeOverrides, CompositeTemplate } from './compile-composition.mjs';

/** Single audited React adapter for all static compositions. No dynamic imports or JSX input. */
export function createComposite<Props extends CompositeOverrides>(template:CompositeTemplate, typeName:string, blockSlug?:string) {
  return function Composite({props}:{props:Props}):ReactElement {
    const inner = blockSlug && /^(login|signup)-0[1-5]$/.test(blockSlug)
      ? <AuthBlock template={template} props={props} slug={blockSlug} />
      : <ApprovedCardComposition spec={template} props={props}/>;
    return <div data-composite={typeName} data-shadcn-block={blockSlug} className="min-w-0 w-full">{inner}</div>;
  };
}
