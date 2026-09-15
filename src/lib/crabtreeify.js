import { inflect, stemsOf } from "./morphology.js";
import { hashWord, vowelSwap } from "./vowels.js";

export const DEFAULT_INTENSITY = 0.7;

export function normalizeIntensity(value, fallback = DEFAULT_INTENSITY) {
  const numeric = Number(value ?? fallback);
  if (!Number.isFinite(numeric)) return fallback;
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

function wordIndexes(tokens) {
  return tokens
    .map((token, index) => (token.kind === "word" ? index : -1))
    .filter((index) => index >= 0);
}

function phraseShape(text) {
  const tokens = tokenize(text);
  const wordIdxs = wordIndexes(tokens);

  return {
    words: wordIdxs.map((index) => tokens[index].core.toLowerCase()),
    separators: wordIdxs
      .slice(0, -1)
      .map((index, position) => separatorBetween(tokens, index, wordIdxs[position + 1])),
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
  if (intensity >= 1) return true;
  if (intensity <= 0) return false;
  return (hashWord(seed) % 100) / 100 < intensity;
}

function ruleApplies(intensity, minChaos) {
  return intensity + 1e-9 >= minChaos;
}

function asEntry(value) {
  if (value && typeof value === "object" && "to" in value) {
    return { to: value.to, minChaos: value.minChaos ?? 0 };
  }
  return { to: value, minChaos: 0 };
}

function sortPhrases(phrases) {
  return [...phrases].sort((a, b) => {
    const wa = a.shape.words.length;
    const wb = b.shape.words.length;
    if (wb !== wa) return wb - wa;
    const pa = a.priority ?? 0;
    const pb = b.priority ?? 0;
    if (pb !== pa) return pb - pa;
    return b.from.length - a.from.length;
  });
}

function lookupWholeWord(core, dict) {
  const lower = core.toLowerCase();
  if (dict[lower]) return { ...dict[lower], text: dict[lower].to };

  for (const { stem, suffix } of stemsOf(lower)) {
    if (dict[stem]) {
      return { ...dict[stem], text: inflect(dict[stem].to, suffix) };
    }
    for (const inner of stemsOf(stem)) {
      if (dict[inner.stem]) {
        const base = inflect(dict[inner.stem].to, inner.suffix);
        return { ...dict[inner.stem], text: inflect(base, suffix) };
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
    tokens.push({ kind: "word", core: match[0], originalCore: match[0], locked: false });
    cursor = index + match[0].length;
  }

  if (cursor < text.length) {
    tokens.push({ kind: "sep", raw: text.slice(cursor) });
  }
  return tokens;
}

function tokenText(token) {
  return token.kind === "sep" ? token.raw : token.core;
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
      // Drop the separator in front of each dropped word too, or its space is left behind.
      if (i > 0) {
        for (let j = wordIdxs[i - 1] + 1; j < wordIdxs[i]; j += 1) tokens[j].raw = "";
      }
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

function applyPhrases(tokens, phrases, intensity) {
  const wordIdxs = wordIndexes(tokens);

  for (const phrase of phrases) {
    if (!ruleApplies(intensity, phrase.minChaos)) continue;
    const fromWords = phrase.shape.words;
    if (!fromWords.length) continue;

    for (let start = 0; start <= wordIdxs.length - fromWords.length; start += 1) {
      const span = wordIdxs.slice(start, start + fromWords.length);
      // A matched phrase locks its whole span, so this also stops phrases overlapping.
      if (span.some((i) => tokens[i].locked)) continue;
      const matched = span.every((i, n) => tokens[i].core.toLowerCase() === fromWords[n]);
      if (!matched) continue;
      const separatorsMatched = span.slice(0, -1).every((tokenIndex, position) => {
        const actual = separatorBetween(tokens, tokenIndex, span[position + 1]);
        return separatorsMatch(phrase.shape.separators[position], actual);
      });
      if (!separatorsMatched) continue;
      applyPhraseAt(tokens, span, fromWords, phrase.toWords);
    }
  }
}

function applyWholeWords(tokens, dict, intensity) {
  for (const token of tokens) {
    if (token.kind !== "word" || token.locked) continue;
    const hit = lookupWholeWord(token.core, dict);
    if (!hit) continue;
    if (!ruleApplies(intensity, hit.minChaos)) continue;
    token.core = preserveCase(token.core, hit.text);
    token.locked = true;
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
    if (isName && intensity < 1) return;
    if (!passesDensity(intensity, `${token.core}:${index}`)) return;
    const swapped = vowelSwap(token.core);
    if (!swapped) return;
    token.core = preserveCase(token.core, swapped);
    token.locked = true;
  });
}

export function normalizeLayer(layer) {
  // No prototype, so input words like "constructor" can't find Object.prototype members.
  const wholeWords = Object.create(null);
  for (const [from, value] of Object.entries(layer.wholeWords ?? {})) {
    wholeWords[from.toLowerCase()] = asEntry(value);
  }

  const phrases = sortPhrases(
    (layer.phrases ?? []).map((phrase) => ({
      ...phrase,
      shape: phraseShape(phrase.from),
      toWords: wordsOf(phrase.to),
      minChaos: phrase.minChaos ?? 0,
    })),
  );

  return {
    meta: layer.meta ?? { name: "layer", label: "Layer" },
    wholeWords,
    phrases,
    generative: layer.generative ?? false,
  };
}

function applyLayer(tokens, layer, intensity) {
  if (layer.generative) {
    applyGenerative(tokens, intensity);
    return;
  }
  applyPhrases(tokens, layer.phrases, intensity);
  applyWholeWords(tokens, layer.wholeWords, intensity);
}

function toParts(tokens) {
  return tokens.map((token) => {
    const text = tokenText(token);
    if (token.kind === "sep") return { text, changed: false, from: text };
    const changed = token.core.toLowerCase() !== token.originalCore.toLowerCase();
    return { text, changed, from: token.originalCore };
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
