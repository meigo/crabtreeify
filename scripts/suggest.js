#!/usr/bin/env node
/**
 * Start from vulgar punchlines and print innocent words the curated layers do not already own.
 *
 *   npm run suggest          dictionary words one letter away (offline)
 *   npm run suggest:sounds   common words that sound alike, via the Datamuse API (online)
 */
import { readFileSync } from "node:fs";
import { crabtreeify } from "../src/lib/crabtreeify.js";
import {
  companyPunchlines,
  rankSoundAlikes,
  suggestFromTargets,
} from "../src/lib/rules/candidates.js";
import { layers } from "../src/lib/rules/index.js";
import { targets } from "../src/lib/rules/targets.js";
import { core, extra } from "../src/lib/rules/malaprop.js";
import canonical from "../src/lib/rules/canonical.js";

function loadWordList() {
  try {
    return new Set(
      readFileSync("/usr/share/dict/words", "utf8")
        .toLowerCase()
        .split("\n")
        .filter((w) => /^[a-z]+$/.test(w)),
    );
  } catch {
    console.error("no system word list at /usr/share/dict/words");
    process.exit(1);
  }
}

const skipFrom = new Set([
  ...Object.keys(core.wholeWords),
  ...Object.keys(extra.wholeWords),
  ...Object.keys(canonical.wholeWords),
]);

function printOneLetterAway() {
  const hits = suggestFromTargets(companyPunchlines, loadWordList(), { skipFrom }).filter(
    (hit) => hit.from.length >= 4 && hit.score >= 10,
  );
  for (const hit of hits) {
    console.log(`${hit.from} -> ${hit.to}  (${hit.score})`);
  }
}

async function printSoundAlikes() {
  // Punchlines and jackpots are not innocent, and the curated layers may already reach a word
  // through inflection ("boots" via boot -> boob).
  const known = new Set([...skipFrom, ...companyPunchlines, ...targets]);
  const untouched = (word) =>
    crabtreeify(word, layers, { intensity: 1, enabledLayers: ["canonical", "silly"] }) === word;

  for (const punchline of companyPunchlines) {
    const url = `https://api.datamuse.com/words?sl=${encodeURIComponent(punchline)}&md=f&max=40`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Datamuse returned ${response.status} for "${punchline}"`);
    const hits = rankSoundAlikes(punchline, await response.json(), { skipFrom: known });
    for (const hit of hits.filter((h) => untouched(h.from))) {
      console.log(`${hit.from} -> ${hit.to}  (${hit.frequency.toFixed(1)} per million)`);
    }
  }
}

if (process.argv.includes("--sounds-like")) await printSoundAlikes();
else printOneLetterAway();
