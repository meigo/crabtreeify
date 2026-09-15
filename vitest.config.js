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
