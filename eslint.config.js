import eslint from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import svelteConfig from "./svelte.config.js";
import globals from "globals";
import prettier from "eslint-config-prettier";
import betterTailwind from "eslint-plugin-better-tailwindcss";

// Mirrors slop-audio-editor/eslint.config.js so the family lints the same way, minus the
// TypeScript layer: this project is plain JavaScript.
export default [
  eslint.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-constant-condition": "warn",
      "prefer-const": ["warn", { destructuring: "all" }],
    },
  },
  {
    // Runes awareness via svelte.config.js.
    files: ["**/*.svelte", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: [".svelte"],
        svelteConfig,
      },
    },
  },
  {
    // Core prefer-const mis-fires on runes (`let x = $state()` legitimately needs `let`); use the
    // runes-aware svelte/prefer-const instead.
    files: ["**/*.svelte"],
    rules: {
      "prefer-const": "off",
      "svelte/prefer-const": ["warn", { destructuring: "all" }],
    },
  },
  // Disable rules that conflict with Prettier (must be after the rule configs).
  prettier,
  ...svelte.configs.prettier,
  {
    // The CLI, dev scripts, engine tests and tool configs run in Node.
    files: ["cli.js", "scripts/**/*.js", "**/*.test.js", "*.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Tailwind class-level lint. ONLY the conflict/duplicate rules: they catch real bugs (two
    // classes fighting over one property). Deliberately NOT class-ORDER (prettier-plugin-tailwindcss
    // already sorts) or `no-unregistered-classes` (custom classes like `output` and `change`).
    // Tailwind 4 is CSS-first, so the plugin needs the entry stylesheet to resolve the theme.
    files: ["**/*.svelte"],
    plugins: { "better-tailwindcss": betterTailwind },
    settings: {
      "better-tailwindcss": { entryPoint: "src/app.css" },
    },
    rules: {
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-duplicate-classes": "warn",
      "better-tailwindcss/enforce-canonical-classes": "warn",
      // canonical-classes leaves double spaces behind when it collapses pairs — this tidies them.
      "better-tailwindcss/no-unnecessary-whitespace": "warn",
    },
  },
  {
    ignores: ["dist/", ".worktrees/", "src/lib/stress-data.js"],
  },
];
