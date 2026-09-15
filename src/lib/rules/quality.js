import { normalizeLayer } from "../crabtreeify.js";
import { stemsOf } from "../morphology.js";
import { targets } from "./targets.js";

/**
 * Weak-pair detector.
 *
 * A swap earns its place by changing how the word *sounds*. Sticking a hyphen
 * into a word doesn't — "research" -> "re-search" reads the same out loud, so
 * it is noise. The exception is when a hyphen exposes a funny word that was
 * hiding in there all along ("analysis" -> "anal-ysis").
 */

/**
 * Crude spelling-to-sound key, enough to spot swaps that are homophones of the
 * original: "a-tension" and "attention" both come out as "atenshun".
 */
function phoneticKey(word) {
  return (
    word
      .toLowerCase()
      .replace(/[ts]ion/g, "shun")
      // Doubled consonants are silent; doubled vowels are not ("poo" vs "po").
      .replace(/([^aeiou])\1+/g, "$1")
  );
}

function editDistanceAtMost1(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let slack = 1;
  while (i < short.length && j < long.length) {
    if (short[i] === long[j]) {
      i += 1;
      j += 1;
      continue;
    }
    if (slack === 0) return false;
    slack -= 1;
    if (short.length === long.length) i += 1;
    j += 1;
  }
  return true;
}

/** Does a hyphen segment expose a word worth exposing? */
function revealsSomething(to) {
  return to
    .split("-")
    .filter((part) => part.length > 2)
    .some((part) => targets.has(part.toLowerCase()));
}

export function isWeakPair(from, to) {
  if (!to.includes("-")) return false;
  if (revealsSomething(to)) return false;
  const flattened = to.replace(/-/g, "");
  return editDistanceAtMost1(phoneticKey(flattened), phoneticKey(from));
}

function curatedDict(layers) {
  const dict = {};
  const graded = new Set();
  for (const layer of layers) {
    if (layer.generative) continue;
    for (const [from, entry] of Object.entries(normalizeLayer(layer).wholeWords)) {
      dict[from] = entry.to;
      // Verbatim show lines have no base form to be consistent with.
      if (!layer.meta?.documented) graded.add(from);
    }
  }
  return { dict, graded };
}

/**
 * Finds rules written for an inflected word whose base form is left behind,
 * so "days" becomes "daze" while "day" stays "day". Needs a word list to know
 * that "day" is a word but "analysi" is not.
 */
export function findLonelyInflections(layers, isWord) {
  const { dict, graded } = curatedDict(layers);
  const lonely = [];

  for (const from of graded) {
    const to = dict[from];
    for (const { stem: base, suffix } of stemsOf(from)) {
      if (base.length < 3 || !isWord(base)) continue;
      if (from !== base + suffix && !from.endsWith(suffix)) continue;

      const baseTo = dict[base];
      if (baseTo === undefined) {
        lonely.push({ from, to, base, reason: "base form has no rule" });
      } else if (to !== baseTo + suffix) {
        lonely.push({ from, to, base, reason: `base maps to "${baseTo}"` });
      }
    }
  }
  return lonely;
}

export function findWeakPairs(layers) {
  const weak = [];
  for (const layer of layers) {
    // Verbatim show dialogue is the source material, not something to grade.
    if (layer.generative || layer.meta?.documented) continue;
    const normalized = normalizeLayer(layer);
    const name = layer.meta?.name ?? "unnamed";

    for (const [from, entry] of Object.entries(normalized.wholeWords)) {
      if (isWeakPair(from, entry.to)) weak.push({ layer: name, from, to: entry.to });
    }
    for (const list of [normalized.phrases, normalized.substrings]) {
      for (const rule of list) {
        if (isWeakPair(rule.from, rule.to)) {
          weak.push({ layer: name, from: rule.from, to: rule.to });
        }
      }
    }
  }
  return weak;
}
