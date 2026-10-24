import { createContext, type ComponentProps } from 'react';
import type { Renderer } from '@json-render/react';

/** Only the public Renderer prop type is referenced: zero imports from our root registry. */
type RuntimeRegistry = ComponentProps<typeof Renderer>['registry'];
export const CompositeRegistryContext = createContext<RuntimeRegistry | null>(null);
