#!/usr/bin/env node
import { crabtreeify } from "./src/lib/crabtreeify.js";
import { layers, sampleText } from "./src/lib/rules/index.js";

const text = process.argv.slice(2).join(" ") || sampleText;

// The engine uses its default chaos when CHAOS is unset or not a number.
console.log(crabtreeify(text, layers, { intensity: process.env.CHAOS }));
