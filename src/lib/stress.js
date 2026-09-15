let lookup = null;
let loading = null;

/**
 * Fetch the stress data. It is a dynamic import, so Vite puts it in its own chunk and the page can
 * render first. Every call returns the same promise.
 */
export function loadStress() {
  loading ??= import("./stress-data.js").then(({ default: data }) => {
    const map = new Map();
    for (const [syllable, words] of Object.entries(data)) {
      for (const entry of words.split(" ")) map.set(entry, Number(syllable));
    }
    lookup = map;
  });
  return loading;
}

/**
 * The 0-based syllable carrying a word's main stress, from the CMU Pronouncing Dictionary: 1 for
 * "remember", 2 for "introduce". 0 when the first syllable is stressed, the word is unknown, or
 * loadStress has not finished yet.
 * @param {string} word lowercase
 */
export function stressedSyllable(word) {
  return lookup?.get(word) ?? 0;
}
