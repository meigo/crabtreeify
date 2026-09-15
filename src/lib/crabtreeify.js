import { vowelSwap } from "./vowels.js";

export const DEFAULT_INTENSITY = 0.7;

function normalizeIntensity(value) {
  const numeric = Number(value ?? DEFAULT_INTENSITY);
  if (!Number.isFinite(numeric)) return DEFAULT_INTENSITY;
  return Math.min(1, Math.max(0, numeric));
}

function isCasedLetter(ch) {
  return /\p{L}/u.test(ch) && ch.toLowerCase() !== ch.toUpperCase();
}

function preserveCase(original, replacement) {
  if (!original || !replacement) return replacement;
  if (original === original.toUpperCase() && [...original].some(isCasedLetter)) {
    return replacement.toUpperCase();
  }
  const first = [...original][0];
  if (first === first.toUpperCase() && isCasedLetter(first)) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

const WORD_SOURCE = String.raw`[\p{L}\p{N}_]+(?:['’\-][\p{L}\p{N}_]+)*`;

function wordRegex() {
  return new RegExp(WORD_SOURCE, "gu");
}

function wordsOf(phrase) {
  return [...phrase.toLowerCase().matchAll(wordRegex())].map((match) => match[0]);
}

function phraseShape(text) {
  const tokens = tokenize(text);
  const wordIdxs = tokens
    .map((token, index) => (token.kind === "word" ? index : -1))
    .filter((index) => index >= 0);

  return {
    words: wordIdxs.map((index) => tokens[index].core.toLowerCase()),
    separators: wordIdxs.slice(0, -1).map((index, position) => {
      const next = wordIdxs[position + 1];
      return tokens
        .slice(index + 1, next)
        .map(tokenText)
        .join("");
    }),
  };
}

function punctuationOf(separator) {
  return separator.replace(/\s/gu, "");
}

function separatorsMatch(expected, actual) {
  return punctuationOf(expected) === punctuationOf(actual);
}

/** Spread a yes/no decision evenly across words so chaos reads as density. */
function passesDensity(intensity, seed) {
  const level = Number(intensity);
  if (level >= 1) return true;
  if (level <= 0) return false;
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return (hash % 100) / 100 < level;
}

function ruleApplies(intensity, minChaos, alwaysApply) {
  if (alwaysApply) return true;
  return Number(intensity) + 1e-9 >= (minChaos ?? 0);
}

function asEntry(value, fallbackChaos = 0) {
  if (value && typeof value === "object" && "to" in value) {
    return { to: value.to, minChaos: value.minChaos ?? fallbackChaos };
  }
  return { to: value, minChaos: fallbackChaos };
}

function sortPhrases(phrases) {
  return [...phrases].sort((a, b) => {
    const wa = wordsOf(a.from).length;
    const wb = wordsOf(b.from).length;
    if (wb !== wa) return wb - wa;
    const pa = a.priority ?? 0;
    const pb = b.priority ?? 0;
    if (pb !== pa) return pb - pa;
    return b.from.length - a.from.length;
  });
}

function sortSubstrings(rules) {
  return [...rules].sort((a, b) => {
    if (b.from.length !== a.from.length) return b.from.length - a.from.length;
    return (b.priority ?? 0) - (a.priority ?? 0);
  });
}

function stemsOf(word) {
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
  if (word.length > 4 && word.endsWith("es")) {
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
function inflect(to, suffix, stem) {
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

function lookupWholeWord(core, dict) {
  const lower = core.toLowerCase();
  if (dict[lower]) return { ...dict[lower], text: dict[lower].to };

  for (const { stem, suffix } of stemsOf(lower)) {
    if (dict[stem]) {
      return { ...dict[stem], text: inflect(dict[stem].to, suffix, stem) };
    }
    for (const inner of stemsOf(stem)) {
      if (dict[inner.stem]) {
        const base = inflect(dict[inner.stem].to, inner.suffix, inner.stem);
        return { ...dict[inner.stem], text: inflect(base, suffix, inner.stem) };
      }
    }
  }
  return null;
}

function tokenize(text) {
  const tokens = [];
  let cursor = 0;

  for (const match of text.matchAll(wordRegex())) {
    const index = match.index ?? 0;
    if (index > cursor) {
      tokens.push({ kind: "sep", raw: text.slice(cursor, index) });
    }
    tokens.push({
      kind: "word",
      lead: "",
      core: match[0],
      originalCore: match[0],
      trail: "",
      locked: false,
    });
    cursor = index + match[0].length;
  }

  if (cursor < text.length) {
    tokens.push({ kind: "sep", raw: text.slice(cursor) });
  }
  return tokens;
}

function tokenText(token) {
  return token.kind === "sep" ? token.raw : `${token.lead}${token.core}${token.trail}`;
}

function applyPhraseAt(tokens, wordIdxs, fromWords, toWords) {
  const fromCores = wordIdxs.map((i) => tokens[i].core);
  const n = Math.min(fromWords.length, toWords.length);

  for (let i = 0; i < n; i += 1) {
    const token = tokens[wordIdxs[i]];
    token.core = preserveCase(fromCores[i], toWords[i]);
    token.locked = true;
  }

  if (toWords.length > fromWords.length) {
    const extra = toWords.slice(fromWords.length).join(" ");
    const last = tokens[wordIdxs[n - 1]];
    last.core = `${last.core} ${extra}`;
    last.locked = true;
  }

  if (fromWords.length > toWords.length) {
    for (let i = n; i < fromWords.length; i += 1) {
      tokens[wordIdxs[i]].core = "";
      tokens[wordIdxs[i]].locked = true;
    }
  }
}

function separatorBetween(tokens, leftIndex, rightIndex) {
  return tokens
    .slice(leftIndex + 1, rightIndex)
    .map(tokenText)
    .join("");
}

function applyPhrases(tokens, phrases, intensity, alwaysApply) {
  const wordIdxs = tokens.map((t, i) => (t.kind === "word" ? i : -1)).filter((i) => i >= 0);
  const used = new Set();

  for (const phrase of phrases) {
    if (!ruleApplies(intensity, phrase.minChaos, alwaysApply)) continue;
    const fromWords = phrase.shape.words;
    const toWords = wordsOf(phrase.to);
    if (!fromWords.length) continue;

    for (let start = 0; start <= wordIdxs.length - fromWords.length; start += 1) {
      const span = wordIdxs.slice(start, start + fromWords.length);
      if (span.some((i) => used.has(i) || tokens[i].locked)) continue;
      const matched = span.every((i, n) => tokens[i].core.toLowerCase() === fromWords[n]);
      if (!matched) continue;
      const separatorsMatched = span.slice(0, -1).every((tokenIndex, position) => {
        const actual = separatorBetween(tokens, tokenIndex, span[position + 1]);
        return separatorsMatch(phrase.shape.separators[position], actual);
      });
      if (!separatorsMatched) continue;
      applyPhraseAt(tokens, span, fromWords, toWords);
      span.forEach((i) => used.add(i));
    }
  }
}

function applyWholeWords(tokens, dict, intensity, alwaysApply) {
  for (const token of tokens) {
    if (token.kind !== "word" || token.locked) continue;
    const hit = lookupWholeWord(token.core, dict);
    if (!hit) continue;
    if (!ruleApplies(intensity, hit.minChaos, alwaysApply)) continue;
    token.core = preserveCase(token.core, hit.text);
    token.locked = true;
  }
}

function applySubstrings(tokens, rules, intensity, alwaysApply) {
  for (const token of tokens) {
    if (token.kind !== "word" || token.locked) continue;
    for (const rule of rules) {
      if (rule.from.length < 4) continue;
      if (!ruleApplies(intensity, rule.minChaos, alwaysApply)) continue;
      if (token.core.toLowerCase() !== rule.from.toLowerCase()) continue;
      token.core = preserveCase(token.core, rule.to);
      token.locked = true;
      break;
    }
  }
}

function isSentenceStart(tokens, index) {
  for (let i = index - 1; i >= 0; i -= 1) {
    if (tokens[i].kind === "word") return false;
    if (/[.!?]/.test(tokens[i].raw)) return true;
  }
  return true;
}

function applyGenerative(tokens, intensity) {
  tokens.forEach((token, index) => {
    if (token.kind !== "word" || token.locked) return;
    // Names read as typos when mangled, so save them for maximum chaos.
    const isName = /^[A-Z]/.test(token.originalCore) && !isSentenceStart(tokens, index);
    if (isName && Number(intensity) < 1) return;
    if (!passesDensity(intensity, `${token.core}:${index}`)) return;
    const swapped = vowelSwap(token.core);
    if (!swapped) return;
    token.core = preserveCase(token.core, swapped);
    token.locked = true;
  });
}

export function normalizeLayer(layer) {
  const fallback = layer.meta?.alwaysApply || layer.alwaysApply ? 0 : (layer.minChaos ?? 0);
  const wholeWords = {};
  for (const [from, value] of Object.entries(layer.wholeWords ?? {})) {
    wholeWords[from.toLowerCase()] = asEntry(value, fallback);
  }

  const phrases = sortPhrases(
    (layer.phrases ?? []).map((phrase) => ({
      ...phrase,
      shape: phraseShape(phrase.from),
      minChaos: phrase.minChaos ?? fallback,
    })),
  );

  const substrings = sortSubstrings(
    (layer.substrings ?? []).map((s) => ({
      ...s,
      minChaos: s.minChaos ?? fallback,
    })),
  );

  return {
    meta: layer.meta ?? { name: "layer", label: "Layer" },
    wholeWords,
    phrases,
    substrings,
    alwaysApply: layer.alwaysApply ?? layer.meta?.alwaysApply ?? false,
    generative: layer.generative ?? false,
  };
}

function applyLayer(tokens, layer, intensity) {
  if (layer.generative) {
    applyGenerative(tokens, intensity);
    return;
  }
  applyPhrases(tokens, layer.phrases, intensity, layer.alwaysApply);
  applyWholeWords(tokens, layer.wholeWords, intensity, layer.alwaysApply);
  applySubstrings(tokens, layer.substrings, intensity, layer.alwaysApply);
}

function toParts(tokens) {
  return tokens.map((token) => {
    const text = tokenText(token);
    if (token.kind === "sep") return { text, changed: false, from: text };
    const changed = token.core.toLowerCase() !== token.originalCore.toLowerCase();
    return { text, changed, from: `${token.lead}${token.originalCore}${token.trail}` };
  });
}

const compiledLayers = new WeakMap();

function compiled(layers) {
  let normalized = compiledLayers.get(layers);
  if (!normalized) {
    normalized = layers.map(normalizeLayer);
    compiledLayers.set(layers, normalized);
  }
  return normalized;
}

export function crabtreeifyDetailed(text, layers, options = {}) {
  const intensity = normalizeIntensity(options.intensity);
  const enabledNames = options.enabledLayers;
  const source = text ?? "";
  const tokens = tokenize(source);

  const normalized = compiled(layers).filter((layer) => {
    if (!enabledNames) return true;
    return enabledNames.includes(layer.meta.name);
  });

  for (const layer of normalized) {
    applyLayer(tokens, layer, intensity);
  }

  const parts = toParts(tokens);
  const changeCount = parts.filter((p) => p.changed).length;
  return { text: parts.map((p) => p.text).join(""), parts, changeCount };
}

export function crabtreeify(text, layers, options = {}) {
  return crabtreeifyDetailed(text, layers, options).text;
}
