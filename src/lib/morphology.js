/**
 * The engine's rough English morphology, shared with the rule-quality checks so both agree on
 * which base word an inflected form reaches.
 */

/**
 * "dropp" (from "dropped") -> "drop", for -ing and -ed only: a "shutter" is not someone who
 * shuts. Stems must be long enough that "sett" (from "setting") does not reach "set", so short
 * vulgar rules stay out of longer words.
 */
function undoubled(stem) {
  return stem.length > 4 && /([^aeiou])\1$/.test(stem) ? stem.slice(0, -1) : null;
}

export function stemsOf(word) {
  const out = [];
  const withUndoubled = (stem, suffix) => {
    const shorter = undoubled(stem);
    if (shorter) out.push({ stem: shorter, suffix });
  };
  if (word.length > 6 && word.endsWith("ing")) {
    out.push({ stem: word.slice(0, -3), suffix: "ing" });
    out.push({ stem: `${word.slice(0, -3)}e`, suffix: "ing" });
    withUndoubled(word.slice(0, -3), "ing");
  }
  if (word.length > 6 && word.endsWith("ly")) {
    out.push({ stem: word.slice(0, -2), suffix: "ly" });
  }
  if (word.length > 6 && word.endsWith("ers")) {
    out.push({ stem: word.slice(0, -3), suffix: "ers" });
  }
  if (word.length > 6 && word.endsWith("er")) {
    out.push({ stem: word.slice(0, -2), suffix: "er" });
  }
  if (word.length > 5 && word.endsWith("ies")) {
    out.push({ stem: `${word.slice(0, -3)}y`, suffix: "ies" });
  }
  // Only after a hissing sound: "batches" is batch + es, but "planes" is plane + s.
  if (word.length > 4 && /(s|x|z|ch|sh)es$/.test(word)) {
    out.push({ stem: word.slice(0, -2), suffix: "es" });
  }
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
    out.push({ stem: word.slice(0, -1), suffix: "s" });
  }
  if (word.length > 5 && word.endsWith("ed")) {
    out.push({ stem: word.slice(0, -2), suffix: "ed" });
    out.push({ stem: `${word.slice(0, -2)}e`, suffix: "ed" });
    withUndoubled(word.slice(0, -2), "ed");
  }
  return out;
}

/** Suffixes starting with a vowel, which can change the replacement's last letters. */
const VOWEL_SUFFIXES = new Set(["ing", "ed", "er", "ers"]);

/**
 * Glue a suffix onto a replacement the way English would: "sassiety" + ies is "sassieties",
 * "knob" + ing is "knobbing", "manure" + ed is "manured" and "willy" + s is "willies".
 */
export function inflect(to, suffix) {
  if (suffix === "ies") {
    return to.endsWith("y") ? `${to.slice(0, -1)}ies` : `${to}s`;
  }
  if (VOWEL_SUFFIXES.has(suffix)) {
    if (to.endsWith("ee")) return suffix === "ing" ? `${to}ing` : to + suffix.slice(1);
    if (to.endsWith("e")) return to.slice(0, -1) + suffix;
    // A one-syllable ending of consonant, vowel, consonant doubles: "re-shit" -> "re-shitting".
    const lastPart = to.split(/[- ]/).at(-1);
    if (/^[^aeiouy]*[aeiou][^aeiouwxy]$/.test(lastPart)) return to + to.at(-1) + suffix;
    return to + suffix;
  }
  if (suffix === "s" && /[^aeiou]y$/.test(to)) return `${to.slice(0, -1)}ies`;
  const hisses = /(s|x|z|ch|sh)$/.test(to);
  if (suffix === "s" && hisses) return `${to}es`;
  if (suffix === "es" && !hisses) return `${to}s`;
  return to + suffix;
}
