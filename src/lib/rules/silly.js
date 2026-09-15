import { core as malapropCore, extra as malapropExtra } from "./malaprop.js";

function group(minChaos, { wholeWords = {}, phrases = [] }) {
  return {
    wholeWords: Object.fromEntries(
      Object.entries(wholeWords).map(([from, to]) => [from, { to, minChaos }]),
    ),
    phrases: phrases.map((p) => ({ ...p, minChaos })),
  };
}

const star = group(0.15, {
  wholeWords: {
    password: "pissward",
    context: "cocktext",
    computer: "com-pooter",
    compute: "com-poop",
    chart: "fart",
    success: "suck-cess",
    meet: "meat",
    database: "data-bass",
  },
  phrases: [
    { from: "password reset", to: "pissward re-shit", priority: 80 },
    { from: "reset password", to: "re-shit pissward", priority: 80 },
    { from: "pie chart", to: "pie fart", priority: 90 },
    { from: "bar chart", to: "bar fart", priority: 90 },
    { from: "line chart", to: "line fart", priority: 90 },
    { from: "context menu", to: "cocktext menu", priority: 80 },
    { from: "compute shader", to: "com-poop shader", priority: 80 },
  ],
});

const prose = group(0.15, malapropCore);
const proseExtra = group(0.45, malapropExtra);

const vulgar = group(0.8, {
  wholeWords: {
    bit: "tit",
    set: "shit",
    reset: "re-shit",
    work: "wank",
    count: "cunt",
    kind: "cunt",
    cut: "cunt",
    job: "gob",
    down: "dong",
    bad: "butt",
    door: "dork",
    off: "oaf",
    far: "fart",
    war: "whore",
  },
  phrases: [
    { from: "bit set", to: "tit shit", priority: 70 },
    { from: "set bit", to: "shit tit", priority: 70 },
  ],
});

function mergeGroups(...groups) {
  const wholeWords = Object.assign({}, ...groups.map((g) => g.wholeWords));
  const phrases = groups.flatMap((g) => g.phrases);
  return { wholeWords, phrases };
}

export default {
  meta: {
    name: "silly",
    label: "Silly substitutions",
    description: "Malapropisms — sauce/source, steaming/streaming — not a fake accent",
  },
  ...mergeGroups(star, prose, proseExtra, vulgar),
};
