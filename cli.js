#!/usr/bin/env node
import { crabtreeify, DEFAULT_INTENSITY } from "./src/lib/crabtreeify.js";
import { layers, sampleText } from "./src/lib/rules/index.js";

const text = process.argv.slice(2).join(" ") || sampleText;
const intensity = Number(process.env.CHAOS ?? DEFAULT_INTENSITY);

console.log(
  crabtreeify(text, layers, {
    intensity,
    enabledLayers: layers.map((layer) => layer.meta.name),
  }),
);
