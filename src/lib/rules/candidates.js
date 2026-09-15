/**
 * Reverse the joke: start from a vulgar/stupid punchline and hunt for
 * innocent English words one nudge away. Those are the substitutions
 * you would never type in a respectable company memo.
 */

import { STOPWORDS } from "../stopwords.js";

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

/** Punchlines you would not put in a company memo. */
// prettier-ignore
export const companyPunchlines = [
  "anal", "arse", "balls", "bastard", "bitch", "bloody", "boob", "boobs",
  "bollocks", "bonk", "bottom", "bowel", "bugger", "bum", "cock", "colon",
  "crap", "crotch", "cunt", "dick", "dung", "enema", "erection", "fart",
  "groin", "impotent", "knicker", "knob", "loo", "manure", "moan", "nappy",
  "nipple", "orgasm", "penis", "piss", "pong", "poo", "poop", "potty",
  "pubic", "sewage", "shag", "shat", "shit", "snog", "snot", "suck", "tit",
  "tits", "turd", "wank", "wee", "whore", "willy",
];

function edits(word) {
  const out = new Set();
  for (let i = 0; i < word.length; i += 1) {
    out.add(word.slice(0, i) + word.slice(i + 1));
    for (const ch of LETTERS) {
      out.add(word.slice(0, i) + ch + word.slice(i + 1));
      out.add(word.slice(0, i) + ch + word.slice(i));
    }
    if (i + 1 < word.length) {
      out.add(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
    }
  }
  for (const ch of LETTERS) out.add(word + ch);
  out.delete(word);
  return out;
}

function scorePair(from, to) {
  let score = 0;
  if (from.length === to.length) score += 6;
  if (from[0] === to[0]) score += 4;
  if (from.at(-1) === to.at(-1)) score += 2;
  if (Math.abs(from.length - to.length) > 1) score -= 8;
  return score;
}

/**
 * @param {Iterable<string>} punchlines
 * @param {Set<string>} words
 * @param {{ skipFrom?: Set<string> }} [options]
 */
export function suggestFromTargets(punchlines, words, options = {}) {
  const skipFrom = options.skipFrom ?? new Set();
  const punchlineSet = new Set([...punchlines].map((w) => w.toLowerCase()));
  const hits = [];

  for (const punchline of punchlineSet) {
    if (!/^[a-z]{3,}$/.test(punchline)) continue;
    for (const from of edits(punchline)) {
      if (!words.has(from)) continue;
      if (STOPWORDS.has(from) || punchlineSet.has(from) || skipFrom.has(from)) continue;
      if (!/^[a-z]{3,}$/.test(from)) continue;
      hits.push({ from, to: punchline, score: scorePair(from, punchline) });
    }
  }

  hits.sort(
    (a, b) => b.score - a.score || a.from.localeCompare(b.from) || a.to.localeCompare(b.to),
  );
  const best = new Map();
  for (const hit of hits) {
    if (!best.has(hit.from)) best.set(hit.from, hit);
  }
  return [...best.values()];
}
