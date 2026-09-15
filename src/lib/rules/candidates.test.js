import { test } from "node:test";
import assert from "node:assert/strict";
import { rankRelated, rankSoundAlikes, suggestFromTargets } from "./candidates.js";

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

test("ranks common sound-alikes first and drops rare or unusable ones", () => {
  const results = [
    { word: "bosom", tags: ["f:3.3"] },
    { word: "boson", tags: ["f:0.3"] },
    { word: "blossom", tags: ["f:6.1"] },
    { word: "besom", tags: ["f:0.05"] },
    { word: "bo som", tags: ["f:2"] },
    { word: "Bosham", tags: ["f:1"] },
    { word: "boso" },
  ];
  assert.deepEqual(rankSoundAlikes("bosom", results), [
    { from: "blossom", to: "bosom", frequency: 6.1 },
    { from: "boson", to: "bosom", frequency: 0.3 },
  ]);
});

test("does not suggest glue words or words the rules already own", () => {
  const results = [
    { word: "this", tags: ["f:900"] },
    { word: "sheet", tags: ["f:40"] },
    { word: "shoot", tags: ["f:60"] },
  ];
  const hits = rankSoundAlikes("shit", results, { skipFrom: new Set(["sheet"]) });
  assert.deepEqual(
    hits.map((hit) => hit.from),
    ["shoot"],
  );
});

test("ranks related words by how many punchlines they came back for", () => {
  const results = new Map([
    ["bum", [{ word: "Butt" }, { word: "backside" }, { word: "hobo" }, { word: "the" }]],
    ["arse", [{ word: "butt" }, { word: "backside" }, { word: "arse" }]],
    ["bottom", [{ word: "butt" }, { word: "backside" }, { word: "ice cream" }]],
    ["boob", [{ word: "butt" }, { word: "bosom" }]],
  ]);
  assert.deepEqual(rankRelated(results, { skipFrom: new Set(["bosom"]) }), [
    { word: "butt", seeds: ["bum", "arse", "bottom", "boob"] },
    { word: "backside", seeds: ["bum", "arse", "bottom"] },
  ]);
  assert.deepEqual(
    rankRelated(results, { minSeeds: 1 }).map((hit) => hit.word),
    ["butt", "backside", "bosom", "hobo"],
  );
});
