# Engine Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing transformation engine preserve curated phrases, support Unicode words, respect phrase and substring boundaries, and normalize intensity safely.

**Architecture:** Keep the public `crabtreeify` and `crabtreeifyDetailed` APIs and the current layer order. Add small private parsing and validation helpers inside `src/lib/crabtreeify.js`, then protect each verified behavior with Node regression tests.

**Tech Stack:** JavaScript ES modules, Node built-in test runner, Node strict assertions.

## Global Constraints

- Preserve the current layered pipeline and public API.
- Add no runtime dependency.
- Keep punctuation and casing in the user's output.
- Treat current substring rules as full-token matches.
- Normalize intensity to a finite value in `0..1`; invalid values use `0.7`.
- The project is not a Git repository, so execution uses test checkpoints instead of commit steps.

---

## File Structure

- Modify `src/lib/crabtreeify.js`: Unicode parsing, phrase matching/locking, substring scope, and intensity normalization.
- Modify `src/lib/crabtreeify.test.js`: all new engine regressions and public behavior assertions.

### Task 1: Normalize Public Intensity

**Files:**
- Modify: `src/lib/crabtreeify.js:3,24-37,299-312`
- Test: `src/lib/crabtreeify.test.js`

**Interfaces:**
- Consumes: `options.intensity` accepted by `crabtreeifyDetailed`.
- Produces: private `normalizeIntensity(value): number`, always in `0..1`.

- [ ] **Step 1: Write failing public-API tests**

Append:

```js
test("normalizes invalid and out-of-range intensity", () => {
  const gradedLayer = {
    meta: { name: "graded", label: "Graded" },
    wholeWords: {
      test: { to: "changed", minChaos: 0.8 },
    },
  };

  const run = (intensity) =>
    crabtreeify("test", [gradedLayer], {
      intensity,
      enabledLayers: ["graded"],
    });

  assert.equal(run("not-a-number"), "test");
  assert.equal(run(Number.NaN), "test");
  assert.equal(run(Number.POSITIVE_INFINITY), "test");
  assert.equal(run(-1), "test");
  assert.equal(run(2), "changed");
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run:

```bash
node --test --test-name-pattern="normalizes invalid" src/lib/crabtreeify.test.js
```

Expected: FAIL because `2` happens to pass but invalid values are not explicitly normalized and the intended boundary contract is absent.

- [ ] **Step 3: Add the normalizer and use it once at the API boundary**

Add near `DEFAULT_INTENSITY`:

```js
function normalizeIntensity(value) {
  const numeric = Number(value ?? DEFAULT_INTENSITY);
  if (!Number.isFinite(numeric)) return DEFAULT_INTENSITY;
  return Math.min(1, Math.max(0, numeric));
}
```

Replace:

```js
const intensity = Number(options.intensity ?? DEFAULT_INTENSITY);
```

with:

```js
const intensity = normalizeIntensity(options.intensity);
```

- [ ] **Step 4: Run focused and complete engine tests**

Run:

```bash
node --test --test-name-pattern="normalizes invalid" src/lib/crabtreeify.test.js
npm test
```

Expected: focused test passes; all existing tests pass.

### Task 2: Tokenize Unicode Words

**Files:**
- Modify: `src/lib/crabtreeify.js:20-22,130-146`
- Test: `src/lib/crabtreeify.test.js`

**Interfaces:**
- Consumes: arbitrary JavaScript strings.
- Produces: the existing internal word/separator token shape; `wordsOf()` and `tokenize()` agree on Unicode word syntax.

- [ ] **Step 1: Add Unicode regression tests**

Append:

```js
test("matches canonical rules containing accented letters", () => {
  assert.equal(convert("René", 0, ["canonical"]), "Ronnie");
});

test("preserves unrelated accented words and punctuation", () => {
  assert.equal(convert("café résumé naïve", 0, ["canonical"]), "café résumé naïve");
});
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run:

```bash
node --test --test-name-pattern="accented" src/lib/crabtreeify.test.js
```

Expected: the `René` test fails with actual output `René`.

- [ ] **Step 3: Replace ASCII splitting with one Unicode word grammar**

Add:

```js
const WORD_SOURCE = String.raw`[\p{L}\p{N}_]+(?:['’\-][\p{L}\p{N}_]+)*`;

function wordRegex() {
  return new RegExp(WORD_SOURCE, "gu");
}
```

Replace `wordsOf` with:

```js
function wordsOf(phrase) {
  return [...phrase.toLowerCase().matchAll(wordRegex())].map((match) => match[0]);
}
```

Replace `tokenize` with:

```js
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
```

- [ ] **Step 4: Run focused and complete engine tests**

Run:

```bash
node --test --test-name-pattern="accented" src/lib/crabtreeify.test.js
npm test
```

Expected: both Unicode tests and all existing tests pass.

### Task 3: Preserve Phrase Integrity and Punctuation Boundaries

**Files:**
- Modify: `src/lib/crabtreeify.js:46-55,152-198`
- Test: `src/lib/crabtreeify.test.js`

**Interfaces:**
- Consumes: normalized phrase objects with `from` and `to`.
- Produces: phrase matches whose word sequence and intervening punctuation are compatible; all words in a matched span are locked.

- [ ] **Step 1: Add phrase-locking and boundary regressions**

Append:

```js
test("matched canonical phrases survive later generative layers", () => {
  assert.equal(
    crabtreeify("Good morning.", layers, {
      intensity: 1,
      enabledLayers: ["canonical", "silly", "vowels"],
    }),
    "Good moaning.",
  );
});

test("phrases do not cross sentence or arbitrary punctuation boundaries", () => {
  assert.equal(convert("mother. in law", 0, ["canonical"]), "mither. in law");
  assert.equal(convert("mother — in law", 0, ["canonical"]), "mither — in law");
});

test("phrase punctuation must match rule punctuation", () => {
  const punctuatedLayer = {
    meta: { name: "punctuated", label: "Punctuated" },
    phrases: [{ from: "alpha, beta", to: "one two" }],
  };
  const run = (text) =>
    crabtreeify(text, [punctuatedLayer], {
      intensity: 1,
      enabledLayers: ["punctuated"],
    });

  assert.equal(run("Alpha, beta"), "One, two");
  assert.equal(run("Alpha beta"), "Alpha beta");
});
```

- [ ] **Step 2: Run focused tests and confirm failures**

Run:

```bash
node --test --test-name-pattern="phrases|generative layers|phrase punctuation" src/lib/crabtreeify.test.js
```

Expected: `Good morning.` becomes `God moaning.`, `mother. in law` changes `law` to `loo`, and the punctuation-free custom phrase matches when it should not.

- [ ] **Step 3: Parse expected separators from each phrase**

Add:

```js
function phraseShape(text) {
  const tokens = tokenize(text);
  const wordIdxs = tokens.map((token, index) => (token.kind === "word" ? index : -1))
    .filter((index) => index >= 0);

  return {
    words: wordIdxs.map((index) => tokens[index].core.toLowerCase()),
    separators: wordIdxs.slice(0, -1).map((index, position) => {
      const next = wordIdxs[position + 1];
      return tokens.slice(index + 1, next).map(tokenText).join("");
    }),
  };
}

function punctuationOf(separator) {
  return separator.replace(/\s/gu, "");
}

function separatorsMatch(expected, actual) {
  return punctuationOf(expected) === punctuationOf(actual);
}
```

In `normalizeLayer`, enrich each phrase once:

```js
const phrases = sortPhrases(
  (layer.phrases ?? []).map((phrase) => ({
    ...phrase,
    shape: phraseShape(phrase.from),
    minChaos: phrase.minChaos ?? fallback,
  })),
);
```

- [ ] **Step 4: Require matching separators**

Add:

```js
function separatorBetween(tokens, leftIndex, rightIndex) {
  return tokens.slice(leftIndex + 1, rightIndex).map(tokenText).join("");
}
```

Inside `applyPhrases`, use the compiled shape:

```js
const fromWords = phrase.shape.words;
const toWords = wordsOf(phrase.to);
```

After the existing word comparison and before `applyPhraseAt`, add:

```js
const separatorsMatched = span.slice(0, -1).every((tokenIndex, position) => {
  const actual = separatorBetween(tokens, tokenIndex, span[position + 1]);
  return separatorsMatch(phrase.shape.separators[position], actual);
});
if (!separatorsMatched) continue;
```

- [ ] **Step 5: Lock every word in the accepted phrase**

In `applyPhraseAt`, set the token lock unconditionally:

```js
for (let i = 0; i < n; i += 1) {
  const next = preserveCase(fromCores[i], toWords[i]);
  const token = tokens[wordIdxs[i]];
  token.core = next;
  token.locked = true;
}
```

Keep the existing extra-word and removed-word locking behavior.

- [ ] **Step 6: Run focused and complete engine tests**

Run:

```bash
node --test --test-name-pattern="phrases|generative layers|phrase punctuation" src/lib/crabtreeify.test.js
npm test
```

Expected: all phrase regressions and the complete suite pass.

### Task 4: Bound Substring Rules to Whole Tokens

**Files:**
- Modify: `src/lib/crabtreeify.js:212-224`
- Test: `src/lib/crabtreeify.test.js`

**Interfaces:**
- Consumes: normalized substring entries.
- Produces: a substring replacement only when `token.core` equals `rule.from`, case-insensitively.

- [ ] **Step 1: Add false-positive regressions**

Append:

```js
test("substring rules do not rewrite unrelated containing words", () => {
  assert.equal(convert("chartreuse", 1, ["silly"]), "chartreuse");
  assert.equal(convert("contextual", 1, ["silly"]), "contextual");
});

test("intended whole words still transform after substring hardening", () => {
  assert.equal(convert("chart context", 1, ["silly"]), "fart cocktext");
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run:

```bash
node --test --test-name-pattern="substring" src/lib/crabtreeify.test.js
```

Expected: `chartreuse` and `contextual` are rewritten.

- [ ] **Step 3: Replace the unanchored regular expression**

Replace the matching body in `applySubstrings` with:

```js
const matchesWholeToken = token.core.toLowerCase() === rule.from.toLowerCase();
if (!matchesWholeToken) continue;
token.core = preserveCase(token.core, rule.to);
token.locked = true;
break;
```

Remove `escapeRegex` if no remaining caller uses it.

- [ ] **Step 4: Run all engine verification**

Run:

```bash
node --test --test-name-pattern="substring" src/lib/crabtreeify.test.js
npm test
node --test --experimental-test-coverage 'src/**/*.test.js'
npm run eval
npm run build
```

Expected:

- all tests pass;
- engine line and branch coverage do not materially regress;
- eval ends with `no weak, unpronounceable or bloated swaps`;
- Vite production build succeeds;
- targeted probes produce `Good moaning.`, `Ronnie`, `chartreuse`, and `contextual`.
