# Crabtreeify Targeted Hardening Design

Date: 2026-09-15

## Goal

Fix the verified engine correctness defects and the highest-impact accessibility and sharing reliability defects without replacing Crabtreeify's existing layered architecture or changing its visual identity.

## Scope

This batch includes:

- preserving curated phrase output through later layers;
- Unicode-aware tokenization and word extraction;
- punctuation-aware phrase matching;
- bounded substring matching;
- consistent intensity validation;
- accessible output change details, focus treatment, control grouping, and status announcements;
- clipboard failure handling;
- fragment-based sharing with a length guard;
- engine and Svelte component regression tests.

This batch excludes repository initialization, CI, README/LICENSE work, package publishing, CLI expansion, a rule-engine rewrite, and general visual redesign.

## Engine Design

### Unicode tokenization

Tokenization and phrase word extraction will treat Unicode letters and numbers as word characters. Apostrophes and hyphens may remain inside a word when surrounded by word characters. Existing ASCII behavior, punctuation preservation, casing, and detailed-output parts remain compatible.

The shipped `rené` rule must become reachable. Accented input that has no matching curated rule must remain intact unless a later rule explicitly supports it.

### Phrase integrity

When a phrase matches, every word token in its span will be locked, including words whose replacement text is unchanged. This guarantees that a later whole-word, substring, or generative layer cannot alter a curated phrase.

At maximum chaos, `Good morning.` must therefore remain `Good moaning.`, not `God moaning.`.

### Phrase boundaries

Phrase matching will inspect separators between candidate words:

- whitespace is allowed;
- punctuation explicitly present between the corresponding words in the source rule is allowed;
- sentence terminators (`.`, `!`, `?`) are never ignored unless that terminator appears at that position in the source phrase;
- arbitrary punctuation cannot turn words from separate clauses or sentences into one phrase.

Existing rules containing commas, periods, or semicolons continue to match their documented forms. Punctuation remains exactly as supplied by the user's input.

### Substring boundaries

Substring rules will no longer match arbitrary interior text in unrelated words. A substring rule may match:

- the complete token; or
- a token boundary explicitly supported by the rule representation.

The initial implementation will treat current substring entries as full-token matches because existing whole-word and inflection behavior already covers intended common forms. Cases such as `chartreuse` and `contextual` must remain unchanged. Future interior-word transformations require an explicit boundary/mode field rather than relying on accidental containment.

### Intensity validation

The public engine boundary will normalize intensity to a finite number in the inclusive range `0..1`. Missing intensity uses the existing API default. Invalid numeric input uses that same default; values below or above the range are clamped.

UI and CLI defaults are not unified in this batch because changing their product semantics is outside the selected scope.

## UI Accessibility and Reliability

### Announcements

The transformed output will not be an `aria-live` region because it changes on each input event. A separate `role="status"` region will announce copy/share success and failure without causing the full output to be repeatedly read.

### Change details

Changed words will remain visually highlighted. Each changed mark will be keyboard-focusable and expose an accessible label containing both original and replacement text. Help text will say that users can focus or hover highlighted words.

### Focus and controls

Buttons, textarea, range input, checkboxes, and focusable marks will have clearly visible `:focus-visible` treatment. Coarse-pointer environments will receive larger interaction targets without materially enlarging desktop controls.

Layer checkboxes will be grouped in a `fieldset` with a `legend`. The range input will expose its named chaos level and numeric value through `aria-valuetext`.

When every layer is disabled, the UI will show a clear inline explanation that no transformations can occur. Copy remains available because copying unchanged text is harmless.

### Clipboard behavior

Copy actions will use feature detection and `try/catch`. Success and failure set the dedicated status message. A failed copy will not claim success or mutate browser history.

### Sharing

Shared state will move from the URL query string to the fragment so source text is not sent in normal HTTP requests, server logs, or referrer query data. The app will read the new fragment format and retain backward-compatible reading of existing query links.

Before copying a link, the UI will enforce a maximum total serialized URL length of 1,800 characters, leaving headroom below common 2,000-character compatibility limits. Inputs exceeding that budget will produce an accessible error directing the user to shorten the text; no truncated link will be copied.

## Components and Boundaries

The app remains small enough for one Svelte component. Pure share-state helpers may be extracted to a small module if doing so makes parsing and length behavior directly testable. Engine helpers remain private unless a testable shared boundary is needed.

No runtime dependency will be added. Svelte component tests may add test-only dependencies compatible with the existing Vite/Svelte setup.

## Error Handling

- Invalid engine intensity is normalized deterministically.
- Unknown layer names continue to select no matching layer; validation of public layer schemas is deferred.
- Clipboard rejection produces a visible and announced error.
- Oversized share state produces a visible and announced error.
- Legacy malformed query or fragment state falls back to existing defaults instead of throwing.

## Testing

Engine tests will cover:

- full phrase spans remain protected at maximum chaos;
- phrases do not cross sentence or arbitrary punctuation boundaries;
- documented phrase punctuation still matches;
- `René` reaches the canonical rule and unrelated accented text remains intact;
- substring rules do not rewrite `chartreuse` or `contextual`;
- missing, non-numeric, infinite, negative, and greater-than-one intensity values normalize correctly.

Component tests will cover:

- output is not a live region;
- copy/share status is announced;
- clipboard rejection reports failure;
- changed marks are keyboard-focusable and labelled;
- the range exposes `aria-valuetext`;
- layers use grouping semantics;
- disabling all layers shows guidance;
- fragment state loads correctly and legacy query state still loads;
- oversized share text is rejected without history mutation.

Completion verification will run the full test suite, test coverage, evaluation script, and production build. Existing curated corpus outputs will be checked for unintended changes.

## Success Criteria

- All new regression tests fail before their corresponding implementation and pass afterward.
- `Good morning.` produces `Good moaning.` at chaos `1` with every layer enabled.
- `René` transforms through the shipped canonical rule.
- Phrase matches do not span unrelated punctuation or sentences.
- `chartreuse` and `contextual` are not changed by the substring layer.
- Screen readers are not asked to announce the full output on every keystroke.
- Copy/share outcomes are accessible and clipboard errors are handled.
- New links use fragment state; old query links still load.
- Existing tests, evaluation checks, and production build pass.
