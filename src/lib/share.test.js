import { test } from "node:test";
import assert from "node:assert/strict";
import { SHARE_TEXT_LIMIT, parseShareParams, buildShareParams, buildSharePath } from "./share.js";

test("prefers the hash over the query string", () => {
  const params = parseShareParams("?text=from-query&chaos=1", "#text=from-hash&chaos=0.5");
  assert.equal(params.get("text"), "from-hash");
  assert.equal(params.get("chaos"), "0.5");
});

test("falls back to the query string when the hash is empty", () => {
  const params = parseShareParams("?text=hello&layers=canonical", "");
  assert.equal(params.get("text"), "hello");
  assert.equal(params.get("layers"), "canonical");
});

test("ignores a hash that is not a share fragment", () => {
  const params = parseShareParams("?text=hello&chaos=0.35", "#about");
  assert.equal(params.get("text"), "hello");
  assert.equal(params.get("chaos"), "0.35");
});

test("omits text that would make a share URL too long", () => {
  const short = buildShareParams({ text: "Good morning.", chaos: 0.35, layers: ["canonical"] });
  assert.equal(short.get("text"), "Good morning.");

  const long = buildShareParams({
    text: "x".repeat(SHARE_TEXT_LIMIT + 1),
    chaos: 1,
    layers: ["canonical", "silly"],
  });
  assert.equal(long.get("text"), null);
  assert.equal(long.get("chaos"), "1");
  assert.equal(long.get("layers"), "canonical,silly");
});

test("builds a hash share path", () => {
  const params = buildShareParams({ text: "hi", chaos: 0, layers: ["vowels"] });
  assert.equal(buildSharePath("/crabtreeify/", params), `/crabtreeify/#${params.toString()}`);
});
