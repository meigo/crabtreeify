export const MAX_SHARE_URL_LENGTH = 1800;

const SHARE_KEYS = ["text", "chaos", "layers"];

export function readShareParams(locationLike) {
  const hash = locationLike.hash?.startsWith("#") ? locationLike.hash.slice(1) : "";
  const fragmentParams = new URLSearchParams(hash);
  if (SHARE_KEYS.some((key) => fragmentParams.has(key))) {
    return fragmentParams;
  }
  return new URLSearchParams(locationLike.search ?? "");
}

export function createSharePath({ pathname, text, intensity, enabledLayers }) {
  const params = new URLSearchParams();
  params.set("text", text);
  params.set("chaos", String(intensity));
  params.set("layers", enabledLayers.join(","));
  return `${pathname}#${params.toString()}`;
}

export function createShareUrl(locationLike, state) {
  return new URL(createSharePath(state), locationLike.origin).toString();
}

export function isShareUrlWithinLimit(url) {
  return url.length <= MAX_SHARE_URL_LENGTH;
}
