import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import App from "./App.svelte";

let writeText;
let user;

beforeEach(() => {
  user = userEvent.setup();
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
  render(App);
  await user.click(screen.getByRole("button", { name: "Copy" }));
  expect(writeText).toHaveBeenCalledOnce();
  expect(screen.getByRole("status")).toHaveTextContent("Output copied.");
});

test("announces clipboard failure without claiming success", async () => {
  writeText.mockRejectedValueOnce(new Error("denied"));
  render(App);
  await user.click(screen.getByRole("button", { name: "Copy" }));
  expect(screen.getByRole("status")).toHaveTextContent(
    "Copy failed. Select the output and copy it manually.",
  );
  expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
});

test("restores chaos from a share link", () => {
  history.replaceState(null, "", "/#chaos=0.8");
  render(App);
  expect(screen.getByLabelText("Chaos").value).toBe("0.8");
});

test("starts at the default chaos when the link has none", () => {
  render(App);
  expect(screen.getByLabelText("Chaos").value).toBe("0.35");
});
