import data from "./stress-data.js";

let lookup;

/**
 * The 0-based syllable carrying a word's main stress, from the CMU Pronouncing Dictionary: 1 for
 * "remember", 2 for "introduce". 0 when the first syllable is stressed or the word is unknown.
 * @param {string} word lowercase
 */
export function stressedSyllable(word) {
  if (!lookup) {
    lookup = new Map();
    for (const [syllable, words] of Object.entries(data)) {
      for (const entry of words.split(" ")) lookup.set(entry, Number(syllable));
    }
  }
  return lookup.get(word) ?? 0;
}
