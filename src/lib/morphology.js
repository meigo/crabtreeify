/**
 * The engine's rough English morphology, shared with the rule-quality checks so both agree on
 * which base word an inflected form reaches.
 */

export function stemsOf(word) {
  const out = [];
  if (word.length > 6 && word.endsWith("ing")) {
    out.push({ stem: word.slice(0, -3), suffix: "ing" });
    out.push({ stem: `${word.slice(0, -3)}e`, suffix: "ing" });
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
  }
  return out;
}

/**
 * Glue a suffix onto a replacement the way English would, so "safety" ->
 * "sassiety" gives "sassieties" rather than "sassietyies".
 */
export function inflect(to, suffix, stem) {
  if (suffix === "ies") {
    return to.endsWith("y") ? `${to.slice(0, -1)}ies` : `${to}s`;
  }
  if ((suffix === "ing" || suffix === "ed") && stem.endsWith("e") && to.endsWith("e")) {
    return to.slice(0, -1) + suffix;
  }
  const hisses = /(s|x|z|ch|sh)$/.test(to);
  if (suffix === "s" && hisses) return `${to}es`;
  if (suffix === "es" && !hisses) return `${to}s`;
  return to + suffix;
}
