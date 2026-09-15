import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isWeakPair, findWeakPairs, findLonelyInflections } from "./quality.js";
import { layers } from "./index.js";

/** Dev-only: the system word list tells us "day" is a word and "analysi" isn't. */
function loadWordList() {
  try {
    return new Set(readFileSync("/usr/share/dict/words", "utf8").toLowerCase().split("\n"));
  } catch {
    return null;
  }
}

test("a hyphen that changes nothing is weak", () => {
  assert.ok(isWeakPair("research", "re-search"));
  assert.ok(isWeakPair("around", "a-round"));
  assert.ok(isWeakPair("outlined", "out-lined"));
  assert.ok(isWeakPair("increasingly", "in-creasingly"));
  assert.ok(isWeakPair("consultant", "con-sultant"));
});

test("a hyphen that drops or adds one letter is still weak", () => {
  assert.ok(isWeakPair("aligned", "a-lined"));
  assert.ok(isWeakPair("responsible", "response-ible"));
  assert.ok(isWeakPair("command", "com-man"));
});

test("a hyphen that leaves a homophone is weak", () => {
  assert.ok(isWeakPair("attention", "a-tension"));
  // A doubled vowel does change the sound, so this one survives.
  assert.ok(!isWeakPair("computer", "com-pooter"));
});

test("a hyphen that exposes a rude word earns its keep", () => {
  assert.ok(!isWeakPair("analysis", "anal-ysis"));
  assert.ok(!isWeakPair("humanity", "human-titty"));
  assert.ok(!isWeakPair("compute", "com-poop"));
});

test("a hyphen that genuinely changes the sound is fine", () => {
  assert.ok(!isWeakPair("particle", "part-tickle"));
  assert.ok(!isWeakPair("nuclear", "new-clear"));
  assert.ok(!isWeakPair("remain", "re-moan"));
});

test("swaps without hyphens are never weak", () => {
  assert.ok(!isWeakPair("morning", "moaning"));
  assert.ok(!isWeakPair("passing", "pissing"));
});

test("no rule is written for a plural while its singular is ignored", (t) => {
  const words = loadWordList();
  if (!words) return t.skip("no system word list available");

  // "physics" is not the plural of the archaic "physic", whatever the word list says.
  const notReallyInflections = new Set(["physic"]);

  const lonely = findLonelyInflections(
    layers,
    (word) => words.has(word) && !notReallyInflections.has(word),
  );
  const listed = lonely
    .map((l) => `${l.from} -> ${l.to}, but "${l.base}": ${l.reason}`)
    .join("\n");
  assert.equal(lonely.length, 0, `inflections without a base form:\n${listed}`);
});

test("the shipped rules contain no weak pairs", () => {
  const weak = findWeakPairs(layers);
  const listed = weak.map((w) => `${w.layer}: ${w.from} -> ${w.to}`).join("\n");
  assert.equal(weak.length, 0, `weak pairs still in the dataset:\n${listed}`);
});
