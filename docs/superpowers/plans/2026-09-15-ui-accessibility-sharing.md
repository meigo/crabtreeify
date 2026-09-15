# UI Accessibility and Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Svelte UI accessible during typing and keyboard use, report clipboard outcomes reliably, and move bounded share state from query parameters to URL fragments.

**Architecture:** Keep `App.svelte` as the single UI component. Extract pure URL serialization/parsing into `src/lib/share-state.js`, use a dedicated status state for announcements, and add a Vitest/jsdom component suite alongside the existing Node engine suite.

**Tech Stack:** Svelte 5, Vite 6, Tailwind CSS 4, Vitest 4.1.6, jsdom 27.4.0, Svelte Testing Library 5.4.2, Testing Library User Event 14.6.7.

## Global Constraints

- Complete `2026-09-15-engine-hardening.md` first.
- Preserve the existing layout and dark visual identity.
- Add no runtime dependency.
- New share URLs use fragments; existing query URLs remain readable.
- Reject serialized share URLs longer than 1,800 characters.
- Do not mutate browser history after clipboard or length failure.
- The project is not a Git repository, so execution uses test checkpoints instead of commit steps.

---

## File Structure

- Create `src/lib/share-state.js`: pure share parameter parsing and URL generation.
- Create `src/lib/share-state.test.js`: Node tests for fragments, legacy queries, and length checks.
- Create `vitest.config.js`: jsdom Svelte component-test configuration.
- Create `src/test/setup.js`: DOM matchers and cleanup.
- Create `src/App.test.svelte.js`: user-facing component regressions.
- Modify `src/App.svelte`: status handling, fragment sharing, accessibility semantics.
- Modify `src/app.css`: focus-visible and coarse-pointer styles.
- Modify `package.json` and `package-lock.json`: test-only packages and split test scripts.

### Task 1: Extract Fragment Share-State Helpers

**Files:**
- Create: `src/lib/share-state.js`
- Test: `src/lib/share-state.test.js`

**Interfaces:**
- Produces: `MAX_SHARE_URL_LENGTH`, `readShareParams(locationLike)`, `createSharePath(state)`, `createShareUrl(locationLike, state)`, `isShareUrlWithinLimit(url)`.
- Consumes later: `App.svelte` uses every export except direct callers may not need `createSharePath`.

- [ ] **Step 1: Write the failing helper tests**

Create `src/lib/share-state.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_SHARE_URL_LENGTH,
  createSharePath,
  createShareUrl,
  isShareUrlWithinLimit,
  readShareParams,
} from "./share-state.js";

test("reads fragment state before legacy query state", () => {
  const params = readShareParams({
    hash: "#text=Fragment&chaos=1&layers=canonical",
    search: "?text=Legacy&chaos=0",
  });
  assert.equal(params.get("text"), "Fragment");
  assert.equal(params.get("chaos"), "1");
});

test("falls back to legacy query state when the fragment has no share keys", () => {
  const params = readShareParams({
    hash: "#about",
    search: "?text=Legacy&chaos=0.35&layers=canonical%2Csilly",
  });
  assert.equal(params.get("text"), "Legacy");
  assert.equal(params.get("layers"), "canonical,silly");
});

test("creates fragment paths and absolute URLs", () => {
  const state = {
    pathname: "/crabtreeify/",
    text: "Good morning",
    intensity: 0.5,
    enabledLayers: ["canonical", "silly"],
  };
  assert.equal(
    createSharePath(state),
    "/crabtreeify/#text=Good+morning&chaos=0.5&layers=canonical%2Csilly",
  );
  assert.equal(
    createShareUrl({ origin: "https://example.test" }, state),
    "https://example.test/crabtreeify/#text=Good+morning&chaos=0.5&layers=canonical%2Csilly",
  );
});

test("enforces the complete serialized URL length", () => {
  assert.equal(MAX_SHARE_URL_LENGTH, 1800);
  assert.equal(isShareUrlWithinLimit("x".repeat(1800)), true);
  assert.equal(isShareUrlWithinLimit("x".repeat(1801)), false);
});
```

- [ ] **Step 2: Run the helper test and confirm failure**

Run:

```bash
node --test src/lib/share-state.test.js
```

Expected: FAIL because `share-state.js` does not exist.

- [ ] **Step 3: Implement the pure helper module**

Create `src/lib/share-state.js`:

```js
export const MAX_SHARE_URL_LENGTH = 1800;

const SHARE_KEYS = ["text", "chaos", "layers"];

export function readShareParams(locationLike) {
  const hash = locationLike.hash?.startsWith("#") ? locationLike.hash.slice(1) : "";
  const fragmentParams = new URLSearchParams(hash);
  if (SHARE_KEYS.some((key) => fragmentParams.has(key))) {
    return fragmentParams;
  }
  return new URLSearchParams(locationLike.search ?? "");
}

export function createSharePath({ pathname, text, intensity, enabledLayers }) {
  const params = new URLSearchParams();
  params.set("text", text);
  params.set("chaos", String(intensity));
  params.set("layers", enabledLayers.join(","));
  return `${pathname}#${params.toString()}`;
}

export function createShareUrl(locationLike, state) {
  return new URL(createSharePath(state), locationLike.origin).toString();
}

export function isShareUrlWithinLimit(url) {
  return url.length <= MAX_SHARE_URL_LENGTH;
}
```

- [ ] **Step 4: Run focused and existing Node tests**

Run:

```bash
node --test src/lib/share-state.test.js
npm test
```

Expected: share-state tests and the existing engine suite pass.

### Task 2: Add the Svelte Component-Test Harness and Correct Announcements

**Files:**
- Create: `vitest.config.js`
- Create: `src/test/setup.js`
- Create: `src/App.test.svelte.js`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/App.svelte:18-22,60-76,155-170`

**Interfaces:**
- Produces: `npm run test:ui`; status copy strings asserted by later tasks.
- Status messages: `Output copied.`, `Share link copied.`, `Copy failed. Select the output and copy it manually.`, `Share failed. Copy the URL manually.`

- [ ] **Step 1: Install exact test-only dependencies**

Run:

```bash
npm install --save-dev vitest@^4.1.6 jsdom@^27.4.0 @testing-library/svelte@^5.4.2 @testing-library/user-event@^14.6.7 @testing-library/jest-dom@^7.0.1
```

Expected: `package.json` and `package-lock.json` update; npm reports no vulnerabilities.

- [ ] **Step 2: Add component-test configuration**

Create `vitest.config.js`:

```js
import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";

export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: { url: "https://example.test/" },
    },
    include: ["src/**/*.test.svelte.js"],
    setupFiles: ["./src/test/setup.js"],
    restoreMocks: true,
  },
});
```

Create `src/test/setup.js`:

```js
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/svelte";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  history.replaceState(null, "", "/");
});
```

- [ ] **Step 3: Split the package test scripts**

Change scripts in `package.json` to:

```json
"test": "npm run test:engine && npm run test:ui",
"test:engine": "node --test 'src/**/*.test.js'",
"test:ui": "vitest run --config vitest.config.js"
```

Keep all existing non-test scripts unchanged.

- [ ] **Step 4: Write failing announcement and clipboard tests**

Create `src/App.test.svelte.js`:

```js
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import App from "./App.svelte";

let writeText;

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

test("does not announce the complete output while typing", () => {
  const { container } = render(App);
  expect(container.querySelector(".output")).not.toHaveAttribute("aria-live");
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

test("announces successful output copying", async () => {
  const user = userEvent.setup();
  render(App);
  await user.click(screen.getByRole("button", { name: "Copy" }));
  expect(writeText).toHaveBeenCalledOnce();
  expect(screen.getByRole("status")).toHaveTextContent("Output copied.");
});

test("announces clipboard failure without claiming success", async () => {
  writeText.mockRejectedValueOnce(new Error("denied"));
  const user = userEvent.setup();
  render(App);
  await user.click(screen.getByRole("button", { name: "Copy" }));
  expect(screen.getByRole("status")).toHaveTextContent(
    "Copy failed. Select the output and copy it manually.",
  );
  expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
});
```

- [ ] **Step 5: Run the UI tests and confirm failure**

Run:

```bash
npm run test:ui
```

Expected: FAIL because `.output` still has `aria-live` and no dedicated status element exists.

- [ ] **Step 6: Implement dedicated status and guarded clipboard writes**

In `App.svelte`, add:

```js
let status = $state("");

async function writeClipboard(text, successMessage, failureMessage) {
  status = "";
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(text);
    status = successMessage;
    return true;
  } catch {
    status = failureMessage;
    return false;
  }
}
```

Replace `copyOutput` with:

```js
async function copyOutput() {
  copied = await writeClipboard(
    result.text,
    "Output copied.",
    "Copy failed. Select the output and copy it manually.",
  );
  if (copied) {
    setTimeout(() => {
      copied = false;
    }, 1200);
  }
}
```

Remove `aria-live="polite"` from `.output`. After the output section, add:

```svelte
<p class="sr-only" role="status" aria-live="polite">{status}</p>
```

- [ ] **Step 7: Run UI and complete tests**

Run:

```bash
npm run test:ui
npm test
```

Expected: all new UI tests and all Node tests pass.

### Task 3: Integrate Fragment Sharing and Length Failure

**Files:**
- Modify: `src/App.svelte:2-5,48-54,68-76`
- Test: `src/App.test.svelte.js`

**Interfaces:**
- Consumes: share-state helpers from Task 1 and `writeClipboard` from Task 2.
- Produces: fragment-based copied links and history updates only after successful copy.

- [ ] **Step 1: Add failing share integration tests**

Add `fireEvent` to the Svelte Testing Library import:

```js
import { fireEvent, render, screen } from "@testing-library/svelte";
```

Append:

```js
test("loads fragment state and retains legacy query support", () => {
  history.replaceState(null, "", "/#text=Fragment+text&chaos=1&layers=canonical");
  const first = render(App);
  expect(screen.getByLabelText("Original")).toHaveValue("Fragment text");
  first.unmount();

  history.replaceState(null, "", "/?text=Legacy+text&chaos=0&layers=canonical");
  render(App);
  expect(screen.getByLabelText("Original")).toHaveValue("Legacy text");
});

test("copies fragment share URLs and updates history after success", async () => {
  const user = userEvent.setup();
  render(App);
  await user.click(screen.getByRole("button", { name: "Share" }));
  const copiedUrl = writeText.mock.calls[0][0];
  expect(copiedUrl).toContain("#text=");
  expect(copiedUrl).not.toContain("?text=");
  expect(location.hash).toContain("text=");
  expect(screen.getByRole("status")).toHaveTextContent("Share link copied.");
});

test("reports share clipboard failure without changing history", async () => {
  writeText.mockRejectedValueOnce(new Error("denied"));
  const user = userEvent.setup();
  render(App);
  const originalUrl = location.href;
  await user.click(screen.getByRole("button", { name: "Share" }));
  expect(location.href).toBe(originalUrl);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Share failed. Copy the URL manually.",
  );
});

test("rejects oversized share URLs without copying or changing history", async () => {
  const user = userEvent.setup();
  render(App);
  const originalUrl = location.href;
  await fireEvent.input(screen.getByLabelText("Original"), {
    target: { value: "x".repeat(1800) },
  });
  await user.click(screen.getByRole("button", { name: "Share" }));
  expect(writeText).not.toHaveBeenCalled();
  expect(location.href).toBe(originalUrl);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Share link is too long. Shorten the original text and try again.",
  );
});
```

- [ ] **Step 2: Run the new share tests and confirm failure**

Run:

```bash
npm run test:ui -- --testNamePattern="fragment|oversized"
```

Expected: FAIL because App reads query parameters and always copies query-string links.

- [ ] **Step 3: Import and use the pure share helpers**

At the top of `App.svelte`, add:

```js
import {
  createSharePath,
  createShareUrl,
  isShareUrlWithinLimit,
  readShareParams,
} from "./lib/share-state.js";
```

Replace parameter initialization with:

```js
const params = readShareParams(window.location);
```

Replace `shareUrl()` with:

```js
function shareState() {
  return {
    pathname: window.location.pathname,
    text: input,
    intensity,
    enabledLayers: enabledNames(),
  };
}
```

Replace `copyShareLink` with:

```js
async function copyShareLink() {
  const state = shareState();
  const url = createShareUrl(window.location, state);
  if (!isShareUrlWithinLimit(url)) {
    status = "Share link is too long. Shorten the original text and try again.";
    return;
  }

  shared = await writeClipboard(
    url,
    "Share link copied.",
    "Share failed. Copy the URL manually.",
  );
  if (!shared) return;

  history.replaceState(null, "", createSharePath(state));
  setTimeout(() => {
    shared = false;
  }, 1200);
}
```

- [ ] **Step 4: Run share, UI, and Node tests**

Run:

```bash
npm run test:ui -- --testNamePattern="fragment|oversized"
npm run test:ui
npm test
```

Expected: fragment, backward-compatibility, length, and complete suites pass.

### Task 4: Add Keyboard and Control Semantics

**Files:**
- Modify: `src/App.svelte:103-144,159-174`
- Modify: `src/app.css:16-57`
- Test: `src/App.test.svelte.js`

**Interfaces:**
- Produces: accessible chaos value, grouped layers, focusable change details, all-layers guidance, and visible focus styles.

- [ ] **Step 1: Add failing semantic tests**

Append:

```js
test("exposes chaos and layer controls with group semantics", () => {
  render(App);
  expect(screen.getByLabelText("Chaos")).toHaveAttribute(
    "aria-valuetext",
    expect.stringMatching(/Officer.*0\.35/),
  );
  expect(screen.getByRole("group", { name: "Layers" })).toBeInTheDocument();
});

test("makes changed words keyboard accessible", () => {
  const { container } = render(App);
  const changed = container.querySelector(".output mark");
  expect(changed).toHaveAttribute("tabindex", "0");
  expect(changed).toHaveAccessibleName(/changed from .+ to .+/i);
});

test("explains when every layer is disabled", async () => {
  const user = userEvent.setup();
  render(App);
  for (const checkbox of screen.getAllByRole("checkbox")) {
    await user.click(checkbox);
  }
  expect(screen.getByText("Enable at least one layer to transform the text.")).toBeVisible();
});
```

- [ ] **Step 2: Run semantic tests and confirm failure**

Run:

```bash
npm run test:ui -- --testNamePattern="chaos|keyboard|every layer"
```

Expected: FAIL because the slider lacks `aria-valuetext`, layers are not a fieldset, and marks are not focusable.

- [ ] **Step 3: Add Svelte semantics**

Add to the range input:

```svelte
aria-valuetext={`${chaosName} · ${intensity.toFixed(2)}`}
```

Replace the Layers section body with:

```svelte
<fieldset class="m-0 border-0 p-0">
  <legend class="mb-2 text-xs uppercase tracking-wider text-muted">Layers</legend>
  <div class="flex flex-col gap-2">
    {#each layerList as layer}
      <label class="flex cursor-pointer items-baseline gap-2.5 text-sm">
        <input type="checkbox" bind:checked={enabledLayers[layer.name]} />
        <span>
          {layer.label}
          <span class="text-muted"> — {layer.description}</span>
        </span>
      </label>
    {/each}
  </div>
</fieldset>
{#if enabledNames().length === 0}
  <p class="mt-2 text-sm text-muted">Enable at least one layer to transform the text.</p>
{/if}
```

Render changed marks as:

```svelte
<mark
  tabindex="0"
  aria-label={`Changed from ${part.from} to ${part.text}`}
  title={`${part.from} → ${part.text}`}
>{part.text}</mark>
```

Change the help text to:

```svelte
<p class="mt-2 text-xs text-muted">
  Focus or hover a highlighted word to see the original.
</p>
```

- [ ] **Step 4: Add visible focus and touch-target CSS**

Append to `src/app.css`:

```css
:where(button, textarea, input[type="range"], input[type="checkbox"], .output mark):focus-visible {
  outline: 2px solid var(--color-fg);
  outline-offset: 2px;
}

@media (pointer: coarse) {
  button {
    min-height: 44px;
  }

  input[type="checkbox"] {
    width: 24px;
    height: 24px;
  }
}
```

Keep `outline-none` on the textarea because the explicit `:focus-visible` rule now replaces it.

- [ ] **Step 5: Run semantic and complete UI tests**

Run:

```bash
npm run test:ui -- --testNamePattern="chaos|keyboard|every layer"
npm run test:ui
npm run build
```

Expected: semantic tests pass and Tailwind/Vite compile the new markup and CSS.

### Task 5: Complete Cross-Surface Verification

**Files:**
- Verify all files changed by both implementation plans.

**Interfaces:**
- Produces: a verified targeted-hardening batch ready for review.

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm test
node --test --experimental-test-coverage 'src/**/*.test.js'
npm run eval
npm run build
npm audit
```

Expected:

- Node and Vitest suites pass;
- engine coverage remains near the current 98.08% line / 88.61% branch baseline;
- eval reports no weak, unpronounceable, or bloated swaps;
- production build succeeds;
- npm audit reports zero vulnerabilities.

- [ ] **Step 2: Run deterministic acceptance probes**

Run:

```bash
node --input-type=module -e "import {crabtreeify} from './src/lib/crabtreeify.js'; import {layers} from './src/lib/rules/index.js'; const checks = [['Good morning.',['canonical','silly','vowels']],['René',['canonical']],['mother. in law',['canonical']],['chartreuse',['silly']],['contextual',['silly']]]; for (const [text,enabledLayers] of checks) console.log(text, '=>', crabtreeify(text,layers,{intensity:1,enabledLayers}));"
```

Expected:

```text
Good morning. => Good moaning.
René => Ronnie
mother. in law => mither. in law
chartreuse => chartreuse
contextual => contextual
```

- [ ] **Step 3: Review the final diff**

Run:

```bash
git diff --check
```

Expected in a Git repository: no whitespace errors. In the current non-Git directory, record that this check is unavailable and inspect the changed files through the editor diff instead.
