export const SHARE_TEXT_LIMIT = 1800;

const SHARE_KEYS = ["text", "chaos", "layers"];

function hasShareKeys(params) {
  return SHARE_KEYS.some((key) => params.has(key));
}

export function parseShareParams(search = "", hash = "") {
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  if (hasShareKeys(fragment)) return fragment;
  return new URLSearchParams(search.replace(/^\?/, ""));
}

export function buildShareParams({ text, chaos, layers }, limit = SHARE_TEXT_LIMIT) {
  const next = new URLSearchParams();
  next.set("chaos", String(chaos));
  next.set("layers", layers.join(","));
  if (text.length <= limit) next.set("text", text);
  return next;
}

export function buildSharePath(pathname, params) {
  return `${pathname}#${params.toString()}`;
}
