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
