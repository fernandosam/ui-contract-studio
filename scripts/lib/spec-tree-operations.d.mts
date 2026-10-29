export type TreeLocation = { parentId: string; slot?: string; index?: number };
export type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue };
export type TreeNode = {
  type: string;
  props: Record<string, JsonValue>;
  children: string[];
  slots?: Record<string, string[]>;
  on?: Record<string, JsonValue>;
  visible?: JsonValue;
  repeat?: JsonValue;
};
export type TreeOperation =
  | ({ op: 'add'; nodeId: string; node: TreeNode } & TreeLocation)
  | { op: 'remove'; nodeId: string }
  | ({ op: 'move'; nodeId: string } & TreeLocation)
  | { op: 'update'; nodeId: string; setProps?: Record<string, JsonValue>; unsetProps?: string[] };
export type TreePatch = { schemaVersion: 1; operations: TreeOperation[] };
export type TreeChange =
  | { op: 'add'; nodeId: string; parentId: string; slot: string | null; index: number }
  | { op: 'remove'; nodeId: string; removedIds: string[] }
  | { op: 'move'; nodeId: string; from: { parentId: string; slot: string | null; index: number }; to: { parentId: string; slot: string | null; index: number } }
  | { op: 'update'; nodeId: string; setKeys: string[]; unsetKeys: string[] };
export type TreePatchResult =
  | { ok: true; spec: unknown; changes: TreeChange[] }
  | { ok: false; spec: unknown; error: { opIndex: number | null; code: string; message: string } };
export declare function applyTreePatch(spec: unknown, patch: unknown, policy: {
  validateSpec(spec: unknown): { success: boolean };
  allowedTypes: string[];
  allowedActions: string[];
  allowedEvents: Record<string, { events?: string[]; slots?: string[] }>;
  validateLayout?(spec: unknown): { success: boolean };
}): TreePatchResult;
