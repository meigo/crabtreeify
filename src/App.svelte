<script>
  import { onMount } from "svelte";
  import { crabtreeifyDetailed, normalizeIntensity } from "./lib/crabtreeify.js";
  import { loadStress } from "./lib/stress.js";
  import { layers, sampleText, canonicalQuotes } from "./lib/rules/index.js";
  import {
    SHARE_TEXT_LIMIT,
    parseShareParams,
    buildShareParams,
    buildSharePath,
  } from "./lib/share.js";

  const params = parseShareParams(window.location.search, window.location.hash);
  const layerList = layers.map((layer) => ({
    name: layer.meta.name,
    label: layer.meta.label,
    description: layer.meta.description,
  }));

  const chaosPresets = [
    { label: "Canonical", value: 0 },
    { label: "Officer", value: 0.5 },
    { label: "Bonkers", value: 1 },
  ];

  let input = $state(params.has("text") ? params.get("text") : sampleText);
  let intensity = $state(normalizeIntensity(params.get("chaos"), 0.35));
  const enabledLayers = $state(
    parseLayersParam(params.has("layers") ? params.get("layers") : null),
  );
  let copied = $state(false);
  let shared = $state(false);
  let status = $state("");
  let statusTimer;

  function enabledNames() {
    return layerList.map((l) => l.name).filter((name) => enabledLayers[name]);
  }

  // Stress data is fetched after the first render. Until it lands, or if it never does, vowel
  // mangling goes by spelling alone; reading stressLoaded redoes the conversion once it arrives.
  let stressLoaded = $state(false);
  onMount(() => {
    loadStress()
      .then(() => (stressLoaded = true))
      .catch(() => {});
  });

  let result = $derived.by(() => {
    void stressLoaded;
    return crabtreeifyDetailed(input, layers, { intensity, enabledLayers: enabledNames() });
  });

  let chaosName = $derived(intensity < 0.2 ? "Canonical" : intensity < 0.9 ? "Officer" : "Bonkers");

  let shareTooLong = $derived(input.length > SHARE_TEXT_LIMIT);

  function parseLayersParam(value) {
    // A missing key means "all layers". A present empty value means none:
    // `layers=` is what Share writes when every box is unchecked.
    if (value == null) return Object.fromEntries(layerList.map((l) => [l.name, true]));
    const set = new Set(value.split(",").filter(Boolean));
    return Object.fromEntries(layerList.map((l) => [l.name, set.has(l.name)]));
  }

  function shareUrl() {
    const next = buildShareParams({
      text: input,
      chaos: intensity,
      layers: enabledNames(),
    });
    return buildSharePath(window.location.pathname, next);
  }

  function loadSample() {
    input = sampleText;
  }

  function loadQuote(event) {
    const index = Number(event.currentTarget.value);
    if (Number.isNaN(index) || index < 0) return;
    input = canonicalQuotes[index].source;
    event.currentTarget.value = "";
  }

  function announce(message) {
    status = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      status = "";
      copied = false;
      shared = false;
    }, 1600);
  }

  async function copyValue(value, okMessage) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(value);
      announce(okMessage);
      return true;
    } catch {
      announce("Copy failed. Select the output and copy it manually.");
      return false;
    }
  }

  async function copyOutput() {
    copied = await copyValue(result.text, "Output copied.");
  }

  async function copyShareLink() {
    const path = shareUrl();
    const url = new URL(path, window.location.origin).toString();
    const ok = await copyValue(
      url,
      shareTooLong
        ? "Link copied without the text — it was too long to share."
        : "Share link copied.",
    );
    if (!ok) return;
    history.replaceState(null, "", path);
    shared = true;
  }
</script>

<main class="mx-auto max-w-2xl px-5 py-8 sm:py-14">
  <header class="mb-10">
    <h1 class="m-0 text-2xl font-medium tracking-tight">Crabtreeify</h1>
    <p class="mt-1 text-sm text-muted">
      Plain English into Officer Crabtree nonsense. Structure preserved, dignity optional.
    </p>
  </header>

  <p class="sr-only" role="status" aria-live="polite">
    {#if status}{status}{/if}
  </p>

  <section class="mb-8">
    <label for="input" class="mb-2 block text-xs tracking-wider text-muted uppercase">
      Original
    </label>
    <textarea
      id="input"
      rows="6"
      bind:value={input}
      placeholder="Type or paste something sensible..."></textarea>
    <div class="mt-2 flex flex-wrap gap-2">
      <button type="button" onclick={loadSample}>Load sample</button>
      <label class="sr-only" for="quote">Load a show quote</label>
      <select id="quote" onchange={loadQuote}>
        <option value="">Load a show quote…</option>
        {#each canonicalQuotes as quote, index (index)}
          <option value={index}>{quote.note}</option>
        {/each}
      </select>
    </div>
  </section>

  <section class="mb-8">
    <div class="mb-2 flex items-baseline justify-between gap-3">
      <label for="intensity" class="text-xs tracking-wider text-muted uppercase">Chaos</label>
      <span class="text-xs text-muted">{chaosName} · {intensity.toFixed(2)}</span>
    </div>
    <input
      id="intensity"
      type="range"
      min="0"
      max="1"
      step="0.05"
      value={intensity}
      aria-valuetext="{chaosName} ({intensity.toFixed(2)})"
      oninput={(e) => {
        intensity = Number(e.currentTarget.value);
      }}
    />
    <p class="mt-2 text-xs text-muted">
      Canonical keeps the original malapropisms. Officer adds common gags. Bonkers mangles the rest.
    </p>
    <div class="mt-3 flex flex-wrap gap-2">
      {#each chaosPresets as preset (preset.label)}
        <button
          type="button"
          aria-pressed={intensity === preset.value}
          onclick={() => (intensity = preset.value)}
        >
          {preset.label}
        </button>
      {/each}
    </div>
  </section>

  <section class="mb-8">
    <fieldset class="m-0 border-0 p-0">
      <legend class="mb-2 px-0 text-xs tracking-wider text-muted uppercase">Layers</legend>
      <div class="flex flex-col gap-2">
        {#each layerList as layer (layer.name)}
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
      <p class="mt-2 text-xs text-muted">Enable at least one layer to crabtreeify the text.</p>
    {/if}
  </section>

  <section>
    <div class="mb-2 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
      <p id="output-label" class="text-xs tracking-wider text-muted uppercase">
        Crabtree
        {#if result.changeCount}
          · {result.changeCount} changed
        {/if}
      </p>
      <div class="flex gap-2">
        <button type="button" onclick={copyShareLink}>{shared ? "Copied" : "Share"}</button>
        <button type="button" onclick={copyOutput}>{copied ? "Copied" : "Copy"}</button>
      </div>
    </div>
    <div class="output" aria-labelledby="output-label">
      {#if result.text}
        {#each result.parts as part, i (i)}
          {#if part.changed}
            <button
              type="button"
              class="change"
              title="{part.from} → {part.text}"
              aria-label="Changed from {part.from} to {part.text}">{part.text}</button
            >
          {:else}
            {part.text}
          {/if}
        {/each}
      {:else}
        <span class="text-muted">Good moaning...</span>
      {/if}
    </div>
    {#if result.changeCount}
      <p class="mt-2 text-xs text-muted">Focus or hover a highlighted word to see the original.</p>
    {/if}
  </section>
</main>
