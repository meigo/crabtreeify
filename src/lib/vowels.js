import { targets } from "./rules/targets.js";
import { STOPWORDS } from "./stopwords.js";

/**
 * Generative half of the joke. Officer Crabtree's actual device was vowel
 * mangling — "fosh and chops", "scrimbled oggs", "aboot", "droonk" — so any
 * word can be mangled without being in a dictionary. Landing on a rude word
 * is a bonus, not a requirement.
 */

/** Crabtree's preferred vowels, best first. */
const PALETTE = ["o", "oo", "i", "ee", "a", "u", "e"];

/** Vowel + r collapses, the way he says "wata" and "whispa". */
const RHOTIC = [
  ["or", "oa"],
  ["ar", "a"],
  ["er", "a"],
  ["ir", "i"],
  ["ur", "u"],
];

const VOWEL_GROUPS = /[aeiouy]+/g;
const HAS_VOWEL = /[aeiouy]/;

/**
 * Front-to-back line used for neighbour weighting. Adjacent steps are the
 * swaps that still sound like the same word with a bad accent; distant
 * jumps (o → ee) read as a different language.
 */
const VOWEL_LINE = ["ee", "i", "e", "a", "o", "oo", "u"];

function isPronounceable(word) {
  if (/(.)\1\1/.test(word)) return false;
  if (/[aeiou]{3}/.test(word)) return false;
  return true;
}

function canonicalVowel(group) {
  // Groups come from VOWEL_GROUPS, so they only ever hold a, e, i, o, u and y.
  const g = group.toLowerCase();
  if (VOWEL_LINE.includes(g)) return g;
  if (g === "y" || g.startsWith("i")) return "i";
  if (g === "ea" || g === "ei" || g.startsWith("ee")) return "ee";
  if (g.startsWith("a")) return "a";
  if (g.startsWith("oo") || g === "ou" || g === "ue") return "oo";
  if (g.startsWith("o")) return "o";
  if (g.startsWith("u")) return "u";
  if (g.startsWith("e")) return "e";
  return "o";
}

function nearness(fromGroup, toVowel) {
  const from = VOWEL_LINE.indexOf(canonicalVowel(fromGroup));
  const to = VOWEL_LINE.indexOf(toVowel);
  if (from < 0 || to < 0) return 0;
  const distance = Math.abs(from - to);
  if (distance === 1) return 4;
  if (distance === 2) return 2;
  if (distance === 3) return 1;
  return 0;
}

export function hashWord(word) {
  let hash = 0;
  for (const ch of word) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return hash;
}

function biasBag(sourceGroup) {
  const bag = [];
  for (const vowel of PALETTE) {
    let weight = 1 + nearness(sourceGroup, vowel);
    if (vowel === "o") weight += 2;
    if (vowel === "oo") weight += 1;
    for (let i = 0; i < weight; i += 1) bag.push(vowel);
  }
  return bag;
}

function paletteFor(word, groups) {
  // Short words keep the classic o-led punches ("fosh and chops"). Longer
  // words pick a preferred vowel from neighbours of the stressed group.
  if (groups.length <= 1) return PALETTE;
  const bag = biasBag(groups[0][0]);
  const preferred = bag[hashWord(word) % bag.length];
  return [preferred, ...PALETTE.filter((vowel) => vowel !== preferred)];
}

function candidatesFor(word) {
  const out = [];

  // Swap one vowel group at a time; earlier groups carry the stress.
  const groups = [...word.matchAll(VOWEL_GROUPS)];
  const palette = paletteFor(word, groups);
  groups.forEach((group, groupIndex) => {
    palette.forEach((vowel, paletteIndex) => {
      if (vowel === group[0]) return;
      const candidate =
        word.slice(0, group.index) + vowel + word.slice(group.index + group[0].length);
      const stretch = Math.abs(candidate.length - word.length);
      const near = stretch === 0 ? nearness(group[0], vowel) : 0;
      out.push({
        candidate,
        // Earlier groups carry the stress; changing length reads as a typo.
        score: palette.length - paletteIndex - groupIndex - 3 * stretch + near,
      });
    });
  });

  for (const [from, to] of RHOTIC) {
    const at = word.indexOf(from);
    if (at < 0) continue;
    out.push({
      candidate: word.slice(0, at) + to + word.slice(at + from.length),
      score: 4,
    });
  }

  return out;
}

/**
 * @returns {string|null} the mangled word, or null if it should be left alone
 */
export function vowelSwap(word) {
  if (typeof word !== "string") return null;
  if (!/^[a-z][a-z'-]*$/i.test(word)) return null;
  if (word.length < 3) return null;
  // Acronyms like AI, DOE, HD stay as they are.
  if (word.length <= 4 && word === word.toUpperCase()) return null;

  const lower = word.toLowerCase();
  if (STOPWORDS.has(lower)) return null;
  if (!HAS_VOWEL.test(lower)) return null;

  // Mangling a short word looks like a typo ("out" -> "ot") unless the
  // result is funny in its own right ("pie" -> "poo").
  const jackpotOnly = lower.length < 4;

  let best = null;
  for (const { candidate, score } of candidatesFor(lower)) {
    if (candidate === lower) continue;
    if (!isPronounceable(candidate)) continue;
    const jackpot = targets.has(candidate);
    if (jackpotOnly && !jackpot) continue;
    const total = jackpot ? score + 100 : score;
    if (!best || total > best.total) best = { candidate, total };
  }

  return best ? best.candidate : null;
}
