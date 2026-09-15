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
