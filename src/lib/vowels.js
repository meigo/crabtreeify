import { targets } from "./rules/targets.js";

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

/** Grammatical glue he leaves intact. */
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "so", "as", "of", "to", "in",
  "on", "at", "by", "for", "from", "with", "that", "this", "these", "those",
  "is", "are", "was", "were", "be", "been", "being", "am",
  "has", "have", "had", "do", "does", "did", "will", "would", "shall",
  "should", "can", "could", "may", "might", "must",
  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us",
  "them", "my", "your", "his", "its", "our", "their", "who", "whom",
  "no", "not", "yes", "than", "then", "there", "here", "what", "which",
  "all", "any", "some", "more", "most", "such", "each", "both", "too",
]);

const VOWEL_GROUPS = /[aeiouy]+/g;
const HAS_VOWEL = /[aeiouy]/;

function isPronounceable(word) {
  if (/(.)\1\1/.test(word)) return false;
  if (/[aeiou]{3}/.test(word)) return false;
  return true;
}

function candidatesFor(word) {
  const out = [];

  // Swap one vowel group at a time; earlier groups carry the stress.
  const groups = [...word.matchAll(VOWEL_GROUPS)];
  groups.forEach((group, groupIndex) => {
    PALETTE.forEach((vowel, paletteIndex) => {
      if (vowel === group[0]) return;
      const candidate =
        word.slice(0, group.index) + vowel + word.slice(group.index + group[0].length);
      out.push({
        candidate,
        // Earlier groups carry the stress; shrinking a word reads as a typo.
        score:
          PALETTE.length -
          paletteIndex -
          groupIndex -
          3 * Math.max(0, word.length - candidate.length),
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
