export declare function graphErrors(
  spec: unknown,
  allowedTypes: Iterable<string>,
  options?: {
    maxElements?: number;
    maxDepth?: number;
    allowedActions?: string[];
    allowedEvents?: Record<string, { slots?: string[]; events?: string[] }>;
  },
): string[];
