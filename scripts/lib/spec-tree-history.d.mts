import type { TreeChange, TreePatchResult } from './spec-tree-operations.mjs';

export type TreeDiff = {
  added: string[];
  removed: string[];
  moved: { nodeId: string; from: TreePosition; to: TreePosition }[];
  properties: { nodeId: string; addedKeys: string[]; removedKeys: string[]; changedKeys: string[] }[];
};
export type TreePosition = { parentId: string; slot: string | null; index: number };
export type TreeEditView = {
  spec: unknown; revision: number; cursor: number; canUndo: boolean; canRedo: boolean;
  history: { id: number; applied: boolean; changes: TreeChange[]; diff: TreeDiff }[];
};
export type TreeEditError = { ok: false; error: { code: string; message: string; opIndex?: number | null } };
export type TreeEditPreview = { ok: true; revision: number; spec: unknown; changes: TreeChange[]; diff: TreeDiff } | TreeEditError;
export type TreeEditNavigation = ({ ok: true } & TreeEditView) | TreeEditError;
export type TreeEditSession = Readonly<{
  read(): TreeEditView;
  preview(patch: unknown): TreeEditPreview;
  commit(): TreeEditNavigation;
  undo(): TreeEditNavigation;
  redo(): TreeEditNavigation;
}>;
export declare function diffTreeSpecs(before: unknown, after: unknown, changes?: TreeChange[]): TreeDiff;
export declare function createTreeEditSession(
  original: unknown,
  applyPatch: (spec: unknown, patch: unknown) => TreePatchResult,
  options?: { maxEntries?: number },
): TreeEditSession;
