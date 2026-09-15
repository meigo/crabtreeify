#!/usr/bin/env node
/**
 * Start from vulgar punchlines, find innocent dictionary words one nudge
 * away, and print the ones the silly layer does not already own.
 */
import { readFileSync } from "node:fs";
import { companyPunchlines, suggestFromTargets } from "../src/lib/rules/candidates.js";
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

const hits = suggestFromTargets(companyPunchlines, loadWordList(), { skipFrom }).filter(
  (hit) => hit.from.length >= 4 && hit.score >= 10,
);

for (const hit of hits) {
  console.log(`${hit.from} -> ${hit.to}  (${hit.score})`);
}
