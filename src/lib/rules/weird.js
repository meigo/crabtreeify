/**
 * Weird and wonderful words: swap a plain word for a funny-sounding synonym
 * ("umbrella" -> "bumbershoot", "fuss" -> "kerfuffle"). Not rude, not an accent,
 * just the words English keeps in the back of the cupboard.
 *
 * Sources: busuu.com "52 funny-sounding words in English" and parade.com "funny words".
 */

function group(minChaos, { wholeWords = {}, phrases = [] }) {
  return {
    wholeWords: Object.fromEntries(
      Object.entries(wholeWords).map(([from, to]) => [from, { to, minChaos }]),
    ),
    phrases: phrases.map((p) => ({ ...p, minChaos })),
  };
}

// Words rare enough in ordinary text that a swap is a treat, not a tic.
const rare = group(0.15, {
  wholeWords: {
    umbrella: "bumbershoot",
    commotion: "hullabaloo",
    uproar: "brouhaha",
    hype: "ballyhoo",
    jargon: "gobbledygook",
    dawdle: "dillydally",
    pamper: "mollycoddle",
    coddle: "mollycoddle",
    deceive: "bamboozle",
    mislead: "hoodwink",
    astonish: "gobsmack",
    amaze: "flabbergast",
    baffle: "flummox",
    perplex: "bumfuzzle",
    tipsy: "sozzled",
    rascal: "scallywag",
    idiot: "nincompoop",
    chatterbox: "flibbertigibbet",
    mixture: "hodgepodge",
    jumble: "hodgepodge",
    rickety: "ramshackle",
    indecisive: "wishy-washy",
    asap: "lickety-split",
    gadget: "doohickey",
    widget: "whatchamacallit",
    zilch: "bupkis",
    stomachache: "collywobbles",
    nausea: "wamble",
    giggle: "titter",
    cuddle: "canoodle",
    flatter: "schmooze",
    hashtag: "octothorpe",
    newbie: "noob",
    novice: "noob",
    klutz: "stumblebum",
    askew: "cattywampus",
    anticlockwise: "widdershins",
    counterclockwise: "widdershins",
    urchin: "ragamuffin",
    youngster: "whippersnapper",
    pontificate: "bloviate",
    prison: "hoosegow",
    mischief: "shenanigans",
    trickery: "skullduggery",
    politician: "snollygoster",
    grumpy: "ornery",
    rowdy: "rambunctious",
    boisterous: "rambunctious",
    hassle: "rigmarole",
    caveman: "troglodyte",
    lawyer: "pettifogger",
    hangover: "crapulence",
    meddler: "kibitzer",
    hypochondriac: "valetudinarian",
    stew: "slumgullion",
    trinket: "frippery",
    adorable: "adorbs",
    flee: "skedaddle",
    "old-fashioned": "fuddy-duddy",
  },
  phrases: [
    { from: "run away", to: "skedaddle", priority: 70 },
    { from: "ran away", to: "skedaddled", priority: 70 },
    { from: "backseat driver", to: "kibitzer", priority: 80 },
    { from: "interval training", to: "fartlek", priority: 80 },
    { from: "division sign", to: "obelus", priority: 80 },
    { from: "book thief", to: "biblioklept", priority: 80 },
  ],
});

// Everyday words that would otherwise turn every other sentence into a kerfuffle.
const common = group(0.45, {
  wholeWords: {
    fuss: "kerfuffle",
    nonsense: "poppycock",
    confuse: "discombobulate",
    nothing: "bupkis",
    cute: "cutesy-poo",
    beginner: "noob",
  },
});

export default {
  meta: {
    name: "weird",
    label: "Weird words",
    description: "Funny-sounding synonyms — kerfuffle, bumbershoot, gobbledygook",
  },
  wholeWords: { ...rare.wholeWords, ...common.wholeWords },
  phrases: [...rare.phrases, ...common.phrases],
};
