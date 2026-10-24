import test from "node:test";
import assert from "node:assert/strict";
import { checkDocumentation } from "../scripts/check-docs.mjs";

test("links locais e fontes de verdade da documentação estão consistentes", () => {
  assert.deepEqual(checkDocumentation(), []);
});
