import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadTypeScript } from "../../../../tests/load-typescript.mjs";

const { parseEditableOptions } = loadTypeScript(
  fileURLToPath(new URL("./options-list.ts", import.meta.url)),
);

test("clearing an option label keeps its row available for continued editing", () => {
  assert.deepEqual(
    Array.from(parseEditableOptions("日视图,,月度统计")),
    ["日视图", "", "月度统计"],
  );
  assert.deepEqual(Array.from(parseEditableOptions("")), [""]);
});
