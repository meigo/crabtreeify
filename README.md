# Crabtreeify

Turn plain English into Officer Crabtree nonsense from _'Allo 'Allo!_. Canonical show malapropisms stay in place; optional layers add later gags and vowel mangling.

## Run

```bash
npm install
npm run dev
```

| Command                          | What it does                                                |
| -------------------------------- | ----------------------------------------------------------- |
| `npm run dev`                    | Local web UI                                                |
| `npm test`                       | Engine tests, then UI tests                                 |
| `npm run eval`                   | Coverage / jackpot / untouched-word report                  |
| `npm run build`                  | Production static site in `dist/`                           |
| `npm run cli -- "Good morning."` | Print a transformation                                      |
| `npm run suggest`                | Dictionary words one letter from a punchline (offline)      |
| `npm run suggest:sounds`         | Common words that sound like a punchline (Datamuse, online) |
| `npm run lint`                   | ESLint (JS, Svelte, Tailwind class conflicts)               |
| `npm run format`                 | Prettier; `npm run format:check` only reports               |
| `npm run check`                  | Lint, format check, tests, then build                       |

A husky pre-commit hook runs `eslint --fix` and `prettier --write` on staged files.

Chaos is a 0–1 density. `0` keeps original Crabtree lines. Higher values add silly substitutions, then generative vowel swaps. The CLI uses the engine default (`0.7`) unless you set `CHAOS`.

```bash
CHAOS=1 npm run cli -- "Good morning."
```

## Layers

- **Original Crabtree** — documented show swaps (`good morning` → `good moaning`)
- **Silly substitutions** — extra malapropisms gated by chaos
- **Vowel mangling** — fills leftover words without overriding curated jokes

Some silly substitutions and jackpot words were found with the [Datamuse API](https://www.datamuse.com/api/).

Share links store settings in the URL hash so the text is not sent to a server. Very long input is omitted from the link.

## Limits

Phrase matches do not cross sentence-ending punctuation. Rules match whole words and their simple inflections, so `chartreuse` is left alone. Accented words such as `René` are tokenized as whole words.
