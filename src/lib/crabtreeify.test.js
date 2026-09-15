import { test } from "node:test";
import assert from "node:assert/strict";
import { crabtreeify, crabtreeifyDetailed } from "./crabtreeify.js";
import { canonicalQuotes, layers } from "./rules/index.js";

function convert(text, intensity = 1, enabled = ["canonical", "silly"]) {
  return crabtreeify(text, layers, { intensity, enabledLayers: enabled });
}

test("preserves later capitals inside a phrase", () => {
  const out = convert("I was passing by the door and I thought I would drop in.", 0, ["canonical"]);
  assert.match(out, /I thought I would drip in/);
  assert.doesNotMatch(out, /i thought i would drip in/);
});

test("does not slap on a fake French accent", () => {
  const out = convert("Please look at this. The good news is that I am very happy.", 1);
  assert.doesNotMatch(out, /\bpleez\b/i);
  assert.doesNotMatch(out, /\bze\b/i);
  assert.doesNotMatch(out, /\bdis\b/i);
  assert.doesNotMatch(out, /\bgoot\b/i);
  assert.doesNotMatch(out, /\bvat\b/i);
  assert.doesNotMatch(out, /\bverry\b/i);
  assert.doesNotMatch(out, /\ballo\b/i);
});

test("good morning stays good moaning, not goot moaning", () => {
  assert.equal(convert("Good morning.", 1), "Good moaning.");
});

test("phrases do not cross sentence or arbitrary punctuation boundaries", () => {
  assert.equal(convert("mother. in law", 0, ["canonical"]), "mither. in law");
  assert.equal(convert("mother — in law", 0, ["canonical"]), "mither — in law");
});

test("phrase punctuation must match rule punctuation", () => {
  const punctuatedLayer = {
    meta: { name: "punctuated", label: "Punctuated" },
    phrases: [{ from: "alpha, beta", to: "one two" }],
  };
  const run = (text) =>
    crabtreeify(text, [punctuatedLayer], {
      intensity: 1,
      enabledLayers: ["punctuated"],
    });

  assert.equal(run("Alpha, beta"), "One, two");
  assert.equal(run("Alpha beta"), "Alpha beta");
});

test("does not rewrite set/bit inside longer words", () => {
  const out = convert("The asset and butterfly are setting.", 1);
  assert.doesNotMatch(out, /asshit/i);
  assert.doesNotMatch(out, /butt-erfly/i);
  assert.doesNotMatch(out, /shitting/i);
});

test("whole-word set and bit still fire at high chaos", () => {
  const out = convert("set the bit", 1, ["silly"]);
  assert.match(out, /shit/i);
  assert.match(out, /tit/i);
});

test("plurals follow the stem", () => {
  assert.match(convert("pie charts and passwords", 1, ["silly"]), /farts/i);
  assert.match(convert("pie charts and passwords", 1, ["silly"]), /pisswards/i);
});

test("low chaos skips silly gags but keeps canonical", () => {
  const out = convert("Good morning. Reset your password and check the chart.", 0);
  assert.match(out, /moaning/i);
  assert.doesNotMatch(out, /pissward/i);
  assert.doesNotMatch(out, /fart/i);
});

test("mid chaos adds star gags", () => {
  const out = convert("Reset your password and check the pie chart.", 0.35);
  assert.match(out, /pissward/i);
  assert.match(out, /fart/i);
});

test("high chaos still does puns without rewriting the", () => {
  const out = convert("The password is in the chart.", 1);
  assert.match(out, /\bThe\b/);
  assert.match(out, /pissward/i);
  assert.match(out, /fart/i);
});

test("classic door quote keeps structure", () => {
  const out = convert(
    "I was passing by the door, when I heard two shots. You are holding in your hand a smoking gun; you are clearly the guilty party.",
    0,
    ["canonical"],
  );
  assert.match(out, /pissing by the door/i);
  assert.match(out, /two shats/i);
  assert.match(out, /smoking goon/i);
  assert.match(out, /guilty potty/i);
});

test("science prose gets multiple malapropisms at full chaos", () => {
  const text =
    "The numbers are staggering: The DOE's light and neutron source facilities now produce tens of petabytes of data annually — that's millions of gigabytes, roughly equivalent to streaming 2 million hours of HD video. This backlog didn't always exist. Upgraded detectors, which have gone from capturing a single image every six seconds to 100,000 images per second, mean these facilities now generate orders of magnitude more data than they did a decade ago, and traditional manual analysis simply can't keep pace.";
  const { text: out, changeCount } = crabtreeifyDetailed(text, layers, {
    intensity: 1,
    enabledLayers: ["canonical", "silly"],
  });
  assert.match(out, /anally/i);
  assert.match(out, /newton/i);
  assert.match(out, /sauce/i);
  assert.match(out, /steaming/i);
  assert.match(out, /homage/i);
  assert.match(out, /sexond/i);
  assert.match(out, /manure/i);
  assert.match(out, /anal-ysis/i);
  assert.ok(changeCount >= 10, `expected many swaps, got ${changeCount}: ${out}`);
});

test("ly-forms follow the stem: publicly becomes pubicly", () => {
  assert.match(convert("They spoke publicly.", 1), /pubicly/i);
});

test("threat becomes tit", () => {
  assert.match(convert("The threat to humanity", 1), /tit/i);
  assert.match(convert("existential threats", 1), /tits/i);
});

test("news prose gets Crabtree swaps", () => {
  const text =
    "Days after two former Anthropic safety researchers publicly aired concerns that the existential threats AI might poste to humanity were receiving too little attention, Dario Amodei outlined a plan for companies like his and governments around the world to ensure that increasingly capable AI models remain aligned with the commands and values of responsible people.";
  const { text: out, changeCount } = crabtreeifyDetailed(text, layers, {
    intensity: 1,
    enabledLayers: ["canonical", "silly"],
  });
  assert.match(out, /pubicly/i);
  assert.match(out, /tits/i);
  assert.match(out, /commodes/i);
  assert.ok(changeCount >= 8, `expected many swaps, got ${changeCount}: ${out}`);
});

test("essay prose gets silly malapropisms without vowel mangling", () => {
  const text =
    "The human brain has some capabilities that the brains of other animals lack. It is to these distinctive capabilities that our species owes its dominant position. If machine brains surpassed human brains in general intelligence, then this new superintelligence could become extremely powerful - possibly beyond our control. As the fate of the gorillas now depends more on humans than on the species itself, so would the fate of humankind depend on the actions of the machine superintelligence.";
  const { text: out, changeCount } = crabtreeifyDetailed(text, layers, {
    intensity: 0.35,
    enabledLayers: ["silly"],
  });
  assert.match(out, /hymen/i);
  assert.match(out, /brawn/i);
  assert.match(out, /culpabilit/i);
  assert.match(out, /otter/i);
  assert.match(out, /genital/i);
  assert.match(out, /inelegance/i);
  assert.match(out, /guerrilla/i);
  assert.match(out, /auction/i);
  assert.ok(changeCount >= 12, `expected many silly swaps, got ${changeCount}: ${out}`);
});

test("company-memo words fall onto vulgar punchlines", () => {
  const out = convert("The bigger batch will ship after a mature review of the suit.", 0.35, [
    "silly",
  ]);
  assert.match(out, /bugger/i);
  assert.match(out, /bitch/i);
  assert.match(out, /shit/i);
  assert.match(out, /manure/i);
});

test("suffixes are spelled correctly on the replacement", () => {
  // safety -> sassiety, so the plural must be sassieties, not sassietyies.
  assert.equal(convert("safeties", 1), "sassieties");
  // receive -> recede, so the -ing form must drop the e.
  assert.equal(convert("receiving", 1), "receding");
});

test("singular and plural stay in step", () => {
  assert.equal(convert("day", 1), "die");
  assert.equal(convert("days", 1), "dies");
  assert.equal(convert("egg", 1), "ogg");
  assert.equal(convert("eggs", 1), "oggs");
});

test("detailed output marks changed words", () => {
  const { text, parts, changeCount } = crabtreeifyDetailed("Good morning", layers, {
    intensity: 0,
    enabledLayers: ["canonical"],
  });
  assert.equal(text, "Good moaning");
  assert.ok(changeCount >= 1);
  const moaning = parts.find((p) => p.text.toLowerCase() === "moaning");
  assert.equal(moaning?.changed, true);
  assert.equal(moaning?.from.toLowerCase(), "morning");
});

test("matches canonical rules containing accented letters", () => {
  assert.equal(convert("René", 0, ["canonical"]), "Ronnie");
});

test("preserves unrelated accented words and punctuation", () => {
  assert.equal(convert("café, résumé — naïve!", 0, ["canonical"]), "café, résumé — naïve!");
});

test("preserves initial capitalization on accented words", () => {
  const layer = {
    meta: { name: "accented-case", label: "Accented Case" },
    wholeWords: {
      éclair: "replacement",
    },
  };

  assert.equal(
    crabtreeify("Éclair", [layer], { intensity: 0, enabledLayers: ["accented-case"] }),
    "Replacement",
  );
});

test("preserves initial capitalization on supplementary-plane words", () => {
  const layer = {
    meta: { name: "deseret-case", label: "Deseret Case" },
    wholeWords: {
      "𐐨foo": "replacement",
    },
  };

  assert.equal(
    crabtreeify("𐐀foo", [layer], { intensity: 0, enabledLayers: ["deseret-case"] }),
    "Replacement",
  );
});

test("preserves lowercase replacement for uncased-script words", () => {
  const layer = {
    meta: { name: "uncased-script", label: "Uncased Script" },
    wholeWords: {
      中文: "replacement",
    },
  };

  assert.equal(
    crabtreeify("中文", [layer], { intensity: 0, enabledLayers: ["uncased-script"] }),
    "replacement",
  );
});

test("whole-word rules leave longer words that contain them alone", () => {
  assert.equal(convert("chartreuse", 1, ["silly"]), "chartreuse");
  assert.equal(convert("contextual", 1, ["silly"]), "contextual");
});

test("the whole words themselves still transform", () => {
  assert.equal(convert("chart context", 1, ["silly"]), "fart cocktext");
});

test("normalizes invalid and out-of-range intensity", () => {
  const gradedLayer = {
    meta: { name: "graded", label: "Graded" },
    wholeWords: {
      test: { to: "changed", minChaos: 0.8 },
    },
  };

  const run = (intensity) =>
    crabtreeify("test", [gradedLayer], {
      intensity,
      enabledLayers: ["graded"],
    });

  assert.equal(run("not-a-number"), "test");
  assert.equal(run(Number.NaN), "test");
  assert.equal(run(Number.POSITIVE_INFINITY), "test");
  assert.equal(run(-1), "test");
  assert.equal(run(2), "changed");
});

test("words named like Object.prototype members are plain words", () => {
  const text = "constructor constructors __proto__ toString";
  assert.equal(convert(text, 1), text);
});

test("-es is only a suffix after a hissing sound", () => {
  // plane -> plan, so "planes" must not be read as plan + es.
  assert.equal(convert("planes", 0, ["canonical"]), "plans");
  // site is not sit + es.
  assert.equal(convert("sites", 1, ["silly"]), "sites");
  // batch -> bitch still inflects through a real -es plural.
  assert.equal(convert("batches", 1, ["silly"]), "bitches");
});

test("a phrase that drops words leaves no stray whitespace", () => {
  const layer = {
    meta: { name: "shrinking", label: "Shrinking" },
    phrases: [{ from: "alpha beta gamma", to: "one two" }],
  };
  const run = (text) => crabtreeify(text, [layer], { intensity: 1, enabledLayers: ["shrinking"] });

  assert.equal(run("Alpha beta gamma."), "One two.");
  assert.equal(run("Alpha beta gamma delta"), "One two delta");
});

test("every show quote's source turns into its documented original", () => {
  for (const quote of canonicalQuotes) {
    assert.equal(convert(quote.source, 0, ["canonical"]), quote.original, quote.note);
  }
});

test("a bobby in a puddle gets the Crabtree treatment", () => {
  assert.equal(
    convert("The bobby stepped in a puddle.", 0.15, ["silly"]),
    "The booby stepped in a piddle.",
  );
});

test("science and news words find their bodily sound-alikes", () => {
  assert.equal(convert("The Higgs boson.", 0.15, ["silly"]), "The Higgs bosom.");
  assert.equal(
    convert("Keep abreast of the beast.", 0.15, ["silly"]),
    "Keep a breast of the breast.",
  );
});

test("replacements double a final consonant and drop a final e like English", () => {
  const layer = {
    meta: { name: "spelling", label: "Spelling" },
    wholeWords: {
      know: "knob",
      sheet: "shit",
      mentor: "manure",
      arch: "arse",
      weigh: "wee",
      willow: "willy",
    },
  };
  const run = (text) => crabtreeify(text, [layer], { intensity: 1, enabledLayers: ["spelling"] });

  assert.equal(run("knowing"), "knobbing");
  assert.equal(run("sheeting"), "shitting");
  assert.equal(run("mentoring"), "manuring");
  assert.equal(run("mentored"), "manured");
  assert.equal(run("arched"), "arsed");
  assert.equal(run("weighed"), "weed");
  assert.equal(run("weighing"), "weeing");
  assert.equal(run("willows"), "willies");
});

test("doubled consonants in the input reach their base word", () => {
  const layer = {
    meta: { name: "doubled", label: "Doubled" },
    wholeWords: { drop: "drip", chip: "chop", set: "shit", shut: "shat" },
  };
  const run = (text) => crabtreeify(text, [layer], { intensity: 1, enabledLayers: ["doubled"] });

  assert.equal(run("dropped"), "dripped");
  assert.equal(run("chipping"), "chopping");
  // Three-letter stems stay out of reach, so "setting" is not "shitting".
  assert.equal(run("setting"), "setting");
  assert.equal(run("shutting"), "shatting");
  // -er words are often words of their own: a shutter is not someone who shuts.
  assert.equal(run("shutter"), "shutter");
});

test("sound-alike punchlines land in ordinary prose", () => {
  assert.equal(
    convert("The competent mentor was beaming at the cinema after his annual bonus.", 0.15, [
      "silly",
    ]),
    "The impotent manure was bumming at the enema after his anal penis.",
  );
  assert.equal(
    convert("Stop shaking and shouting in the bank.", 0.15, ["silly"]),
    "Stop shagging and shitting in the bonk.",
  );
});

test("related-word punchlines land in ordinary prose", () => {
  assert.equal(
    convert("The funny planner found a brick in the salmon at the third burger.", 0.15, ["silly"]),
    "The fanny plonker found a prick in the semen at the turd booger.",
  );
  assert.equal(
    convert("A visit to the hinge parade left a false trail.", 0.15, ["silly"]),
    "A vomit to the minge prat left a phallus drool.",
  );
});

test("weird words swap plain words for funny synonyms", () => {
  assert.equal(
    convert("Grab your umbrella; the gadgets caused a commotion and I ran away.", 0.15, ["weird"]),
    "Grab your bumbershoot; the doohickeys caused a hullabaloo and I skedaddled.",
  );
  assert.equal(
    convert("The scamp would linger over a cookie after the quarrel.", 0.15, ["weird"]),
    "The jackanapes would lollygag over a snickerdoodle after the argy-bargy.",
  );
  // Everyday words wait for more chaos.
  assert.equal(convert("What a fuss.", 0.15, ["weird"]), "What a fuss.");
  assert.equal(convert("What a fuss.", 0.5, ["weird"]), "What a kerfuffle.");
  assert.equal(convert("What rubbish.", 0.15, ["weird"]), "What rubbish.");
  assert.equal(convert("What rubbish.", 0.5, ["weird"]), "What folderol.");
});

test("a consonant-y replacement takes -ied and a hissing one takes -es", () => {
  assert.equal(convert("She dawdled.", 0.15, ["weird"]), "She dillydallied.");
  assert.equal(convert("Two fallacies.", 0.15, ["silly"]), "Two phalluses.");
});

test("a phrase from a later layer beats a single-word swap from an earlier one", () => {
  const withSilly = (text) => convert(text, 0.15, ["canonical", "silly"]);
  assert.equal(withSilly("It was hit and miss."), "It was shit and piss.");
  assert.equal(withSilly("Hit or miss."), "Shit or piss.");
  assert.equal(withSilly("It was hit-and-miss."), "It was shit-and-piss.");
  // The show's own words and phrases still win everywhere else.
  assert.equal(withSilly("I hit the ball."), "I hot the ball.");
  assert.equal(withSilly("A direct hit."), "A direct hot.");
});
