#!/usr/bin/env node
/**
 * Coverage report for the Crabtree rules.
 *
 * Tells you three things:
 *   1. how much of a text gets mangled at each chaos level
 *   2. which swaps land on a rude jackpot word (the good ones)
 *   3. which content words nothing touched, so you know what to curate next
 */
import { crabtreeifyDetailed } from "../src/lib/crabtreeify.js";
import { layers } from "../src/lib/rules/index.js";
import { targets } from "../src/lib/rules/targets.js";
import { findWeakPairs } from "../src/lib/rules/quality.js";

const CORPUS = {
  show:
    "Good morning. I was passing by the door, when I heard two shots. You are holding in your hand a smoking gun; you are clearly the guilty party.",
  science:
    "The numbers are staggering: The DOE's light and neutron source facilities now produce tens of petabytes of data annually, roughly equivalent to streaming 2 million hours of HD video. Upgraded detectors, which have gone from capturing a single image every six seconds to 100,000 images per second, mean these facilities now generate orders of magnitude more data than they did a decade ago, and traditional manual analysis simply cannot keep pace.",
  news:
    "Days after two former Anthropic safety researchers publicly aired concerns that the existential threats AI might pose to humanity were receiving too little attention, Dario Amodei outlined a plan for companies and governments around the world to ensure that increasingly capable AI models remain aligned with the commands and values of responsible people.",
  office:
    "Please reset your password before the meeting and check the pie chart in the context menu. I have attached the quarterly report and the budget spreadsheet for your review.",
  plain:
    "She walked into the kitchen, put the kettle on, and looked out of the window at the rain falling on the garden.",
};

const LEVELS = [0, 0.35, 0.7, 1];
const ALL = layers.map((l) => l.meta.name);

function analyse(text, intensity) {
  const { parts } = crabtreeifyDetailed(text, layers, {
    intensity,
    enabledLayers: ALL,
  });
  const words = parts.filter((p) => /\w/.test(p.text));
  const changed = words.filter((p) => p.changed);
  const jackpots = changed.filter((p) =>
    p.text
      .toLowerCase()
      .split(/[^a-z]+/)
      .some((w) => targets.has(w)),
  );
  return { words, changed, jackpots };
}

function pct(a, b) {
  return b === 0 ? "0%" : `${Math.round((a / b) * 100)}%`;
}

console.log("COVERAGE  (share of words mangled)\n");
const header = ["text".padEnd(9), ...LEVELS.map((l) => `chaos ${l}`.padStart(10))].join("");
console.log(header);
console.log("-".repeat(header.length));

for (const [name, text] of Object.entries(CORPUS)) {
  const cells = LEVELS.map((level) => {
    const { words, changed } = analyse(text, level);
    return pct(changed.length, words.length).padStart(10);
  });
  console.log(name.padEnd(9) + cells.join(""));
}

console.log("\n\nJACKPOTS AT FULL CHAOS  (swaps that land on a rude word)\n");
for (const [name, text] of Object.entries(CORPUS)) {
  const { jackpots, changed } = analyse(text, 1);
  const sample = jackpots.map((p) => `${p.from.trim()}→${p.text.trim()}`);
  console.log(`${name.padEnd(9)} ${jackpots.length}/${changed.length} swaps`);
  if (sample.length) console.log(`          ${sample.join(", ")}`);
}

console.log("\n\nUNTOUCHED CONTENT WORDS AT FULL CHAOS  (curate these next)\n");
const misses = new Map();
for (const text of Object.values(CORPUS)) {
  for (const part of analyse(text, 1).words) {
    if (part.changed) continue;
    const word = part.text.toLowerCase().replace(/[^a-z']/g, "");
    if (word.length < 4) continue;
    misses.set(word, (misses.get(word) ?? 0) + 1);
  }
}
const ranked = [...misses.entries()].sort((a, b) => b[1] - a[1]);
console.log(ranked.length ? ranked.map(([w, n]) => `${w}(${n})`).join(" ") : "none");

console.log("\n\nSANITY CHECKS\n");
const problems = findWeakPairs(layers).map(
  (w) => `${w.layer}: "${w.from}" -> "${w.to}" is only a hyphen, no joke`,
);
for (const [name, text] of Object.entries(CORPUS)) {
  for (const part of analyse(text, 1).changed) {
    const word = part.text.trim();
    if (/(.)\1\1/.test(word)) problems.push(`${name}: triple letter in "${word}"`);
    if (/[aeiou]{3}/i.test(word)) problems.push(`${name}: vowel pileup in "${word}"`);
    if (word.length > part.from.trim().length + 6) {
      problems.push(`${name}: "${part.from.trim()}" ballooned into "${word}"`);
    }
  }
}
console.log(
  problems.length ? problems.join("\n") : "no weak, unpronounceable or bloated swaps",
);
