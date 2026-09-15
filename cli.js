#!/usr/bin/env node
import { crabtreeify } from "./src/lib/crabtreeify.js";
import { layers, sampleText } from "./src/lib/rules/index.js";

const text = process.argv.slice(2).join(" ") || sampleText;
const intensity = Number(process.env.CHAOS ?? 0.85);

console.log(
  crabtreeify(text, layers, {
    intensity,
    enabledLayers: layers.map((layer) => layer.meta.name),
  }),
);
