import { test } from "node:test";
import assert from "node:assert/strict";
import { crabtreeifyDetailed } from "./crabtreeify.js";
import { layers } from "./rules/index.js";

const NEWS =
  "Days after two former Anthropic safety researchers publicly aired concerns that the existential threats AI might poste to humanity were receiving too little attention, Dario Amodei outlined a plan for companies like his and governments around the world to ensure that increasingly capable AI models remain aligned with the commands and values of responsible people.";

function run(text, intensity, enabled = ["canonical", "silly", "vowels"]) {
  return crabtreeifyDetailed(text, layers, { intensity, enabledLayers: enabled });
}

test("vowel layer mangles most content words at full chaos", () => {
  const { parts } = run(NEWS, 1);
  const words = parts.filter((p) => /\w/.test(p.text));
  const changed = words.filter((p) => p.changed);
  const ratio = changed.length / words.length;
  assert.ok(ratio > 0.6, `expected >60% of words mangled, got ${Math.round(ratio * 100)}%`);
});

test("chaos scales how many words the vowel layer touches", () => {
  const low = run(NEWS, 0.3).changeCount;
  const high = run(NEWS, 1).changeCount;
  assert.ok(high > low, `expected more changes at high chaos: ${low} vs ${high}`);
});

test("vowel layer never touches acronyms or numbers", () => {
  const { text } = run("The AI model scanned 100 images for DOE.", 1);
  assert.match(text, /\bAI\b/);
  assert.match(text, /\bDOE\b/);
  assert.match(text, /\b100\b/);
});

test("curated swaps still win over generative mangling", () => {
  const { text } = run("Good morning. I was passing by the door.", 1);
  assert.match(text, /moaning/i);
  assert.match(text, /pissing/i);
});

test("canonical phrases stay intact at maximum chaos", () => {
  assert.equal(run("Good morning.", 1).text, "Good moaning.");
});

test("leaves mid-sentence proper nouns alone until maximum chaos", () => {
  const text = "The report from Anthropic was late.";
  assert.match(run(text, 0.7).text, /Anthropic/);
  assert.doesNotMatch(run(text, 1).text, /Anthropic/);
});

test("still mangles the first word of a sentence", () => {
  const { text } = run("Kettles are boiling.", 0.7);
  assert.doesNotMatch(text, /Kettles/);
});

test("a name after an abbreviation stays intact below full chaos", () => {
  // 0.995 is high enough that every density roll passes, and still below 1.
  const spared = [
    ["Mr. Smith said hello.", "Smith"],
    ["Mrs. Parker waited.", "Parker"],
    ["Ms. Jones called.", "Jones"],
    ["Dr. Watson arrived.", "Watson"],
    ["St. Paul is quiet.", "Paul"],
    ["e.g. Paris today.", "Paris"],
    ["i.e. Paris today.", "Paris"],
    ["Meet U.S. Grant tomorrow.", "Grant"],
    ["Hello, Smith went home.", "Smith"],
  ];
  for (const [text, name] of spared) {
    assert.match(run(text, 0.995, ["vowels"]).text, new RegExp(`\\b${name}\\b`), text);
  }

  assert.doesNotMatch(run("Kettles are boiling.", 0.995, ["vowels"]).text, /Kettles/);
  assert.doesNotMatch(run("Hello. Smith went home.", 0.995, ["vowels"]).text, /\bSmith\b/);
  assert.doesNotMatch(run("OK. Smith waited.", 0.995, ["vowels"]).text, /\bSmith\b/);
  assert.doesNotMatch(run("Mr. Smith said hello.", 1, ["vowels"]).text, /\bSmith\b/);
});

test("vowel layer can be switched off", () => {
  const withOut = run(NEWS, 1, ["canonical", "silly"]).changeCount;
  const withIn = run(NEWS, 1, ["canonical", "silly", "vowels"]).changeCount;
  assert.ok(withIn > withOut, `expected vowel layer to add swaps: ${withOut} vs ${withIn}`);
});
