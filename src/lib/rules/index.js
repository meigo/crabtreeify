import canonical from "./canonical.js";
import silly from "./silly.js";
import weird from "./weird.js";

/**
 * Generative catch-all, applied after the curated layers so their better
 * jokes always win. Chaos controls how many leftover words it mangles.
 */
const vowels = {
  meta: {
    name: "vowels",
    label: "Vowel mangling",
    description: "Mangles whatever the lists missed — fosh and chops, scrimbled oggs",
  },
  generative: true,
};

export const layers = [canonical, silly, weird, vowels];

export const sampleText =
  "Good morning. Please reset your password and check the pie chart in the context menu. I was passing by the door when I heard two shots. You are holding in your hand a smoking gun; you are clearly the guilty party. Do not worry.";

/** Show quotes with plain-English source text to load into the input. */
export const canonicalQuotes = [
  {
    original: "Good moaning!",
    source: "Good morning!",
    note: "Catchphrase — used at any time of day (Wikipedia, IMDb)",
  },
  {
    original:
      "I was pissing by the door, when I heard two shats. You are holding in your hind a smoking goon; you are clearly the guilty potty.",
    source:
      "I was passing by the door, when I heard two shots. You are holding in your hand a smoking gun; you are clearly the guilty party.",
    note: "Classic interrogation scene (Fandom wiki, IMDb)",
  },
  {
    original: "I was pissing by the door, and I thought I would drip in.",
    source: "I was passing by the door, and I thought I would drop in.",
    note: "Drop-in visit (Wikipedia)",
  },
  {
    original: "There is obviously no piss for the wicked.",
    source: "There is obviously no peace for the wicked.",
    note: "After the pissoir / tank incident (IMDb)",
  },
  {
    original:
      "Good moaning. The resist-once have accqo-aired a bum. They are going to ex-plod the whaleway brodge.",
    source:
      "Good morning. The resistance have acquired a bomb. They are going to explode the railway bridge.",
    note: "Resistance briefing (IMDb)",
  },
  {
    original: "Good moaning, Herr Flock. And von Smellhorsen.",
    source: "Good morning, Herr Flick. And von Smallhausen.",
    note: "Greeting the Gestapo (IMDb)",
  },
  {
    original: "My lips are soiled.",
    source: "My lips are sealed.",
    note: "Secrecy oath, Crabtree-style (IMDb)",
  },
  {
    original: "I was raised in Nipples. As they say — see Nipples and do.",
    source: "I was raised in Naples. As they say — see Naples and die.",
    note: "Explaining his accent",
  },
  {
    original: "Half pissed sox.",
    source: "Half past six.",
    note: "Telling the time",
  },
  {
    original: "Tible for two by the winedow.",
    source: "Table for two by the window.",
    note: "Meeting Agent Grace (Fandom wiki)",
  },
  {
    original: "I was pissing by the door when I heard a shat.",
    source: "I was passing by the door when I heard a shot.",
    note: "Variant of the door scene (IMDb)",
  },
  {
    original: "Hole Hotler!",
    source: "Heil Hitler!",
    note: "Salute scene (IMDb)",
  },
];
