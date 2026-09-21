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

test("a share link with no text or layers still opens the sample", () => {
  history.replaceState(null, "", "/#chaos=0.35");
  render(App);
  expect(screen.getByLabelText("Original").value.length).toBeGreaterThan(0);
  for (const box of screen.getAllByRole("checkbox")) expect(box).toBeChecked();
});

test("an empty share link restores an empty box and no layers", () => {
  history.replaceState(null, "", "/#chaos=0.35&layers=&text=");
  render(App);
  expect(screen.getByLabelText("Original")).toHaveValue("");
  for (const box of screen.getAllByRole("checkbox")) expect(box).not.toBeChecked();
  expect(
    screen.getByText("Enable at least one layer to crabtreeify the text."),
  ).toBeInTheDocument();
});

test("shared text with every layer off stays that way", () => {
  history.replaceState(null, "", "/#chaos=0.35&layers=&text=Hello");
  render(App);
  expect(screen.getByLabelText("Original")).toHaveValue("Hello");
  for (const box of screen.getAllByRole("checkbox")) expect(box).not.toBeChecked();
  expect(document.querySelector(".output")).toHaveTextContent("Hello");
});

test("sharing a cleared box round-trips the empty state", async () => {
  const view = render(App);
  await user.clear(screen.getByLabelText("Original"));
  for (const box of screen.getAllByRole("checkbox")) await user.click(box);
  await user.click(screen.getByRole("button", { name: "Share" }));
  view.unmount();
  render(App);
  expect(screen.getByLabelText("Original")).toHaveValue("");
  for (const box of screen.getAllByRole("checkbox")) expect(box).not.toBeChecked();
});
