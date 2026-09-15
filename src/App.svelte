<script>
  import { crabtreeifyDetailed } from "./lib/crabtreeify.js";
  import { layers, sampleText } from "./lib/rules/index.js";

  const params = new URLSearchParams(window.location.search);
  const layerList = layers.map((layer) => ({
    name: layer.meta.name,
    label: layer.meta.label,
    description: layer.meta.description,
  }));

  const chaosPresets = [
    { label: "Show only", value: 0 },
    { label: "Officer", value: 0.5 },
    { label: "Bonkers", value: 1 },
  ];

  let input = $state(params.get("text") || sampleText);
  let intensity = $state(clampChaos(params.get("chaos")));
  let enabledLayers = $state(parseLayersParam(params.get("layers")));
  let copied = $state(false);
  let shared = $state(false);

  function enabledNames() {
    return layerList.map((l) => l.name).filter((name) => enabledLayers[name]);
  }

  let result = $derived(
    crabtreeifyDetailed(input, layers, { intensity, enabledLayers: enabledNames() }),
  );

  let chaosName = $derived(
    intensity < 0.2 ? "Show only" : intensity < 0.9 ? "Officer" : "Bonkers",
  );

  function clampChaos(value) {
    const n = Number(value);
    if (Number.isNaN(n)) return 0.35;
    return Math.min(1, Math.max(0, n));
  }

  function parseLayersParam(value) {
    if (!value) return Object.fromEntries(layerList.map((l) => [l.name, true]));
    const set = new Set(value.split(",").filter(Boolean));
    return Object.fromEntries(layerList.map((l) => [l.name, set.has(l.name)]));
  }

  function shareUrl() {
    const next = new URLSearchParams();
    next.set("text", input);
    next.set("chaos", String(intensity));
    next.set("layers", enabledNames().join(","));
    return `${window.location.pathname}?${next.toString()}`;
  }

  function loadSample() {
    input = sampleText;
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(result.text);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 1200);
  }

  async function copyShareLink() {
    const url = new URL(shareUrl(), window.location.origin).toString();
    await navigator.clipboard.writeText(url);
    history.replaceState(null, "", shareUrl());
    shared = true;
    setTimeout(() => {
      shared = false;
    }, 1200);
  }
</script>

<main class="mx-auto max-w-2xl px-5 py-14">
  <header class="mb-10">
    <h1 class="m-0 text-2xl font-medium tracking-tight">Crabtreeify</h1>
    <p class="mt-1 text-sm text-muted">
      Plain English into Officer Crabtree nonsense. Structure preserved, dignity optional.
    </p>
  </header>

  <section class="mb-8">
    <label for="input" class="mb-2 block text-xs uppercase tracking-wider text-muted">
      Original
    </label>
    <textarea
      id="input"
      rows="6"
      bind:value={input}
      placeholder="Type or paste something sensible..."
    ></textarea>
    <div class="mt-2">
      <button type="button" onclick={loadSample}>Load sample</button>
    </div>
  </section>

  <section class="mb-8">
    <div class="mb-2 flex items-baseline justify-between gap-3">
      <label for="intensity" class="text-xs uppercase tracking-wider text-muted">Chaos</label>
      <span class="text-xs text-muted">{chaosName} · {intensity.toFixed(2)}</span>
    </div>
    <input
      id="intensity"
      type="range"
      min="0"
      max="1"
      step="0.05"
      value={intensity}
      oninput={(e) => {
        intensity = Number(e.currentTarget.value);
      }}
    />
    <div class="mt-3 flex flex-wrap gap-2">
      {#each chaosPresets as preset}
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
    <p class="mb-2 text-xs uppercase tracking-wider text-muted">Layers</p>
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
  </section>

  <section>
    <div class="mb-2 flex items-baseline justify-between gap-3">
      <p class="text-xs uppercase tracking-wider text-muted">
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
    <div class="output" aria-live="polite">
      {#if result.text}
        {#each result.parts as part}
          {#if part.changed}
            <mark title="{part.from} → {part.text}">{part.text}</mark>
          {:else}
            {part.text}
          {/if}
        {/each}
      {:else}
        <span class="text-muted">Good moaning...</span>
      {/if}
    </div>
    {#if result.changeCount}
      <p class="mt-2 text-xs text-muted">Hover a highlighted word to see the original.</p>
    {/if}
  </section>
</main>
