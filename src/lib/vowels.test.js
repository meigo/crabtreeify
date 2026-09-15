import { test } from "node:test";
import assert from "node:assert/strict";
import { vowelSwap } from "./vowels.js";

test("swaps a vowel to Crabtree's favourite o", () => {
  assert.equal(vowelSwap("fish"), "fosh");
  assert.equal(vowelSwap("chips"), "chops");
  assert.equal(vowelSwap("eggs"), "oggs");
});

test("prefers a rude jackpot over the vowel palette", () => {
  assert.equal(vowelSwap("pass"), "piss");
  assert.equal(vowelSwap("passing"), "pissing");
});

test("drops r after a vowel like the show does", () => {
  assert.equal(vowelSwap("morning"), "moaning");
});

test("leaves grammatical glue alone", () => {
  assert.equal(vowelSwap("the"), null);
  assert.equal(vowelSwap("of"), null);
  assert.equal(vowelSwap("and"), null);
});

test("leaves acronyms, numbers and tiny words alone", () => {
  assert.equal(vowelSwap("AI"), null);
  assert.equal(vowelSwap("DOE"), null);
  assert.equal(vowelSwap("100"), null);
  assert.equal(vowelSwap("2x"), null);
});

test("never returns the input unchanged", () => {
  for (const word of ["fish", "passing", "morning", "bottle", "drunk"]) {
    assert.notEqual(vowelSwap(word), word);
  }
});

test("is deterministic", () => {
  assert.equal(vowelSwap("researchers"), vowelSwap("researchers"));
});

test("leaves short words alone so swaps don't read as typos", () => {
  assert.equal(vowelSwap("out"), null);
  assert.equal(vowelSwap("two"), null);
  assert.equal(vowelSwap("rat"), null);
});

test("mangles a short word only when it hits a jackpot", () => {
  assert.equal(vowelSwap("pie"), "poo");
});

test("prefers not to shrink the word", () => {
  assert.equal(vowelSwap("rain"), "roon");
});

test("keeps the word pronounceable", () => {
  for (const word of ["researchers", "attention", "capable", "government"]) {
    const out = vowelSwap(word);
    assert.doesNotMatch(out, /(.)\1\1/, `${word} -> ${out}`);
    assert.doesNotMatch(out, /[aeiou]{3}/, `${word} -> ${out}`);
  }
});

function firstVowelGroup(word) {
  return word.toLowerCase().match(/[aeiouy]+/)?.[0] ?? "";
}

test("does not stretch an existing o into oo", () => {
  assert.notEqual(vowelSwap("other"), "oother");
  assert.notEqual(vowelSwap("control"), "coontrol");
  assert.notEqual(vowelSwap("position"), "poosition");
  assert.notEqual(vowelSwap("powerful"), "poowerful");
});

test("mixes Crabtree vowels instead of turning every word to o", () => {
  const words = [
    "human", "brain", "capabilities", "animals", "lack", "distinctive",
    "species", "owes", "dominant", "position", "machine", "surpassed",
    "general", "intelligence", "superintelligence", "become", "extremely",
    "powerful", "possibly", "beyond", "control", "fate", "gorillas",
    "depends", "humans", "itself", "humankind", "depend", "actions",
  ];
  const swapped = words.map((word) => vowelSwap(word)).filter(Boolean);
  const oFirst = swapped.filter((word) => /^o+$/.test(firstVowelGroup(word))).length;
  const ratio = oFirst / swapped.length;
  assert.ok(ratio < 0.65, `too much o: ${oFirst}/${swapped.length} (${Math.round(ratio * 100)}%) ${swapped.join(", ")}`);
  assert.ok(ratio > 0.15, `lost the o bias: ${oFirst}/${swapped.length}`);
});

test("does not jump a back vowel all the way to ee", () => {
  assert.notEqual(vowelSwap("control"), "ceentrol");
  for (const word of ["control", "position", "dominant", "powerful", "gorillas"]) {
    const out = vowelSwap(word);
    assert.doesNotMatch(
      firstVowelGroup(out),
      /^ee$/,
      `${word} -> ${out} jumped to a far-front vowel`,
    );
  }
});
