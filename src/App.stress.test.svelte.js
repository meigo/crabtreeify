import { render } from "@testing-library/svelte";
import { expect, test, vi } from "vitest";
import App from "./App.svelte";

// Its own file: vitest shares modules between the tests in a file, so once any earlier test had
// rendered the app the stress data would already be loaded.
test("renders without stress data, then updates once it has loaded", async () => {
  history.replaceState(null, "", "/#text=remember&chaos=1&layers=vowels");
  const { container } = render(App);
  const output = container.querySelector(".output");
  expect(output).toHaveTextContent("romember");
  await vi.waitFor(() => expect(output).toHaveTextContent("remomber"));
});
