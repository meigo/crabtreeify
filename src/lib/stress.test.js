import { test } from "node:test";
import assert from "node:assert/strict";
import { loadStress, stressedSyllable } from "./stress.js";

test("knows no stress until the data has loaded", async () => {
  // In the browser the data is a separate chunk, fetched after the first render.
  assert.equal(stressedSyllable("remember"), 0);
  await loadStress();
  assert.equal(stressedSyllable("remember"), 1);
  assert.equal(stressedSyllable("introduce"), 2);
  assert.equal(stressedSyllable("president"), 0);
});

test("fetches the data only once", () => {
  assert.equal(loadStress(), loadStress());
});
