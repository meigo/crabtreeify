import { test } from "node:test";
import assert from "node:assert/strict";
import { suggestFromTargets } from "./candidates.js";

// prettier-ignore
const words = new Set([
  "pass", "piss", "sheet", "shit", "fact", "fart", "walk", "wank",
  "beach", "bitch", "mean", "moan", "small", "smell", "cork", "cock",
  "the", "and", "will", "shot", "shat",
]);

function byFrom(hits) {
  return Object.fromEntries(hits.map((hit) => [hit.from, hit.to]));
}

test("finds company-safe words one nudge from a vulgar punchline", () => {
  const found = byFrom(
    suggestFromTargets(
      ["piss", "shit", "fart", "wank", "bitch", "cock", "moan", "smell", "shat"],
      words,
    ),
  );
  assert.equal(found.pass, "piss");
  assert.equal(found.fact, "fart");
  assert.equal(found.walk, "wank");
  assert.equal(found.cork, "cock");
  assert.equal(found.mean, "moan");
  assert.equal(found.small, "smell");
});

test("does not suggest glue words or the punchline itself", () => {
  const found = byFrom(suggestFromTargets(["piss", "shat"], words));
  assert.equal(found.the, undefined);
  assert.equal(found.and, undefined);
  assert.equal(found.will, undefined);
  assert.equal(found.piss, undefined);
});
