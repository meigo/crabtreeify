import { test } from "node:test";
import assert from "node:assert/strict";
import { crabtreeify, crabtreeifyDetailed } from "./crabtreeify.js";
import { layers } from "./rules/index.js";

function convert(text, intensity = 1, enabled = ["canonical", "silly"]) {
  return crabtreeify(text, layers, { intensity, enabledLayers: enabled });
}

test("preserves later capitals inside a phrase", () => {
  const out = convert(
    "I was passing by the door and I thought I would drop in.",
    0,
    ["canonical"],
  );
  assert.match(out, /I thought I would drip in/);
  assert.doesNotMatch(out, /i thought i would drip in/);
});

test("does not slap on a fake French accent", () => {
  const out = convert("Please look at this. The good news is that I am very happy.", 1);
  assert.doesNotMatch(out, /\bpleez\b/i);
  assert.doesNotMatch(out, /\bze\b/i);
  assert.doesNotMatch(out, /\bdis\b/i);
  assert.doesNotMatch(out, /\bgoot\b/i);
  assert.doesNotMatch(out, /\bvat\b/i);
  assert.doesNotMatch(out, /\bverry\b/i);
  assert.doesNotMatch(out, /\ballo\b/i);
});

test("good morning stays good moaning, not goot moaning", () => {
  assert.equal(convert("Good morning.", 1), "Good moaning.");
});

test("does not rewrite set/bit inside longer words", () => {
  const out = convert("The asset and butterfly are setting.", 1);
  assert.doesNotMatch(out, /asshit/i);
  assert.doesNotMatch(out, /butt-erfly/i);
  assert.doesNotMatch(out, /shitting/i);
});

test("whole-word set and bit still fire at high chaos", () => {
  const out = convert("set the bit", 1, ["silly"]);
  assert.match(out, /shit/i);
  assert.match(out, /tit/i);
});

test("plurals follow the stem", () => {
  assert.match(convert("pie charts and passwords", 1, ["silly"]), /farts/i);
  assert.match(convert("pie charts and passwords", 1, ["silly"]), /pisswards/i);
});

test("low chaos skips silly gags but keeps canonical", () => {
  const out = convert("Good morning. Reset your password and check the chart.", 0);
  assert.match(out, /moaning/i);
  assert.doesNotMatch(out, /pissward/i);
  assert.doesNotMatch(out, /fart/i);
});

test("mid chaos adds star gags", () => {
  const out = convert("Reset your password and check the pie chart.", 0.35);
  assert.match(out, /pissward/i);
  assert.match(out, /fart/i);
});

test("high chaos still does puns without rewriting the", () => {
  const out = convert("The password is in the chart.", 1);
  assert.match(out, /\bThe\b/);
  assert.match(out, /pissward/i);
  assert.match(out, /fart/i);
});

test("classic door quote keeps structure", () => {
  const out = convert(
    "I was passing by the door, when I heard two shots. You are holding in your hand a smoking gun; you are clearly the guilty party.",
    0,
    ["canonical"],
  );
  assert.match(out, /pissing by the door/i);
  assert.match(out, /two shats/i);
  assert.match(out, /smoking goon/i);
  assert.match(out, /guilty potty/i);
});

test("science prose gets multiple malapropisms at full chaos", () => {
  const text =
    "The numbers are staggering: The DOE's light and neutron source facilities now produce tens of petabytes of data annually — that's millions of gigabytes, roughly equivalent to streaming 2 million hours of HD video. This backlog didn't always exist. Upgraded detectors, which have gone from capturing a single image every six seconds to 100,000 images per second, mean these facilities now generate orders of magnitude more data than they did a decade ago, and traditional manual analysis simply can't keep pace.";
  const { text: out, changeCount } = crabtreeifyDetailed(text, layers, {
    intensity: 1,
    enabledLayers: ["canonical", "silly"],
  });
  assert.match(out, /anally/i);
  assert.match(out, /newton/i);
  assert.match(out, /sauce/i);
  assert.match(out, /steaming/i);
  assert.match(out, /homage/i);
  assert.match(out, /sexond/i);
  assert.match(out, /manure/i);
  assert.match(out, /anal-ysis/i);
  assert.ok(changeCount >= 10, `expected many swaps, got ${changeCount}: ${out}`);
});

test("ly-forms follow the stem: publicly becomes pubicly", () => {
  assert.match(convert("They spoke publicly.", 1), /pubicly/i);
});

test("threat becomes tit", () => {
  assert.match(convert("The threat to humanity", 1), /tit/i);
  assert.match(convert("existential threats", 1), /tits/i);
});

test("news prose gets Crabtree swaps", () => {
  const text =
    "Days after two former Anthropic safety researchers publicly aired concerns that the existential threats AI might poste to humanity were receiving too little attention, Dario Amodei outlined a plan for companies like his and governments around the world to ensure that increasingly capable AI models remain aligned with the commands and values of responsible people.";
  const { text: out, changeCount } = crabtreeifyDetailed(text, layers, {
    intensity: 1,
    enabledLayers: ["canonical", "silly"],
  });
  assert.match(out, /pubicly/i);
  assert.match(out, /tits/i);
  assert.match(out, /commodes/i);
  assert.ok(changeCount >= 8, `expected many swaps, got ${changeCount}: ${out}`);
});

test("suffixes are spelled correctly on the replacement", () => {
  // safety -> sassiety, so the plural must be sassieties, not sassietyies.
  assert.equal(convert("safeties", 1), "sassieties");
  // receive -> recede, so the -ing form must drop the e.
  assert.equal(convert("receiving", 1), "receding");
});

test("singular and plural stay in step", () => {
  assert.equal(convert("day", 1), "die");
  assert.equal(convert("days", 1), "dies");
  assert.equal(convert("egg", 1), "ogg");
  assert.equal(convert("eggs", 1), "oggs");
});

test("detailed output marks changed words", () => {
  const { text, parts, changeCount } = crabtreeifyDetailed("Good morning", layers, {
    intensity: 0,
    enabledLayers: ["canonical"],
  });
  assert.equal(text, "Good moaning");
  assert.ok(changeCount >= 1);
  const moaning = parts.find((p) => p.text.toLowerCase() === "moaning");
  assert.equal(moaning?.changed, true);
  assert.equal(moaning?.from.toLowerCase(), "morning");
});

test("matches canonical rules containing accented letters", () => {
  assert.equal(convert("René", 0, ["canonical"]), "Ronnie");
});

test("preserves unrelated accented words and punctuation", () => {
  assert.equal(convert("café résumé naïve", 0, ["canonical"]), "café résumé naïve");
});

test("normalizes invalid and out-of-range intensity", () => {
  const gradedLayer = {
    meta: { name: "graded", label: "Graded" },
    wholeWords: {
      test: { to: "changed", minChaos: 0.8 },
    },
  };

  const run = (intensity) =>
    crabtreeify("test", [gradedLayer], {
      intensity,
      enabledLayers: ["graded"],
    });

  assert.equal(run("not-a-number"), "test");
  assert.equal(run(Number.NaN), "test");
  assert.equal(run(Number.POSITIVE_INFINITY), "test");
  assert.equal(run(-1), "test");
  assert.equal(run(2), "changed");
});
