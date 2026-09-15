# TODO

Possible ideas, not commitments.

## Subtitle mode (Google Translate)

Run the Crabtree output through machine translation (e.g. English → Estonian) for that bad auto-subtitle feel. The translator translates the swapped words faithfully, so the result reads as fluent nonsense: "The impotent manure … fell into the anal with his anal penis" → "impotentne sõnnik oma anaalse peenisega pärakusse sattus".

What a 20-sentence test through Google's classic endpoint showed (2026-09-15):

- Swaps that land on standard dictionary words translate best: manure, orgasm, erection, penis, anal, stool.
- British slang (wanked, crapper, manky, bonk, snog) and invented words (pissward) stay in English, get sanitised or vanish.
- Vowel mangling does not survive: misspellings are either left in English or silently corrected.
- Weird words stay in English or get odd guesses (poppycock → "moonikakk").
- Even the classic model drops chunks it cannot parse.

Open questions before building:

- **Privacy.** The app promises text never leaves the page, so translation has to be an explicit opt-in with a clear warning.
- **API.** The keyless `translate.googleapis.com` endpoint is unofficial and can rate-limit or change. A real feature needs the Cloud Translation API (key, billing), which a static GitHub Pages site cannot hide, so it needs a small proxy or bring-your-own-key.
- **Model.** Cloud Translation offers NMT (closer to literal, keeps nonsense) and Translation LLM (rewrites to sound natural, may repair or sanitise). Possibly expose both as "Literal" and "Fluent".
- **Preset.** Suggest canonical + silly on, vowels off, and maybe prefer swaps to dictionary words over slang.
- **Alternative.** Translate the original, sensible sentence, then let an LLM put the rude equivalents of the known swaps back in with correct Estonian case endings. Needs an LLM API instead of Google Translate.
