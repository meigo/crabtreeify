/**
 * Jackpot words. If a vowel swap happens to land on one of these,
 * take it — this is where Crabtree's innuendo comes from.
 */
// prettier-ignore
const seeds = [
  // the classics the show actually used
  "piss", "pissed", "pissing", "pisser", "pissage", "pissable",
  "moan", "moaned", "moaning", "moaner",
  "shat", "shats", "goon", "goons", "potty", "potties",
  "tit", "tits", "titty", "titties", "tittle",
  "fart", "farts", "farted", "farting",
  "bum", "bums", "bummer", "bummers",
  "arse", "arses", "arsed",
  "poo", "poos", "pooed", "poop", "poops", "pooped", "pooper",
  "wee", "weed", "wees",
  "knob", "knobs", "knobbly",
  "willy", "willies",
  "bonk", "bonked", "bonking", "bonkers",
  "shag", "shags", "shagged",
  "snog", "snogs", "snogged",
  "pong", "pongs", "pongy",
  "whiff", "whiffs", "whiffy",
  "nipple", "nipples",
  "bugger", "buggers", "buggered",
  "crap", "craps", "crapped",
  "sod", "sods", "sodded",
  "twit", "twits", "twerp",
  "git", "gits", "prat", "prats", "plonker", "plonkers",
  "wank", "wanks", "wanked", "wanker",
  "botty", "botties", "loo", "loos", "lav", "lavs", "bog", "bogs",
  "turd", "turds", "dung", "manure", "slurry", "sewage",
  "snot", "snotty", "bogey", "bogeys", "phlegm",
  "boil", "boils", "wart", "warts", "verruca", "piles", "hernia",
  "groin", "groins", "loins", "crotch", "gusset", "gussets",
  "buttock", "buttocks", "thigh", "thighs", "bosom", "bosoms",
  "knicker", "knickers", "drawers", "girdle", "girdles", "corset", "corsets",
  "nappy", "nappies", "truss", "trusses", "enema", "enemas",
  "bowel", "bowels", "colon", "rectum", "sphincter",
  "testicle", "testicles", "scrotum",

  // not rude, just funny in a sentence about physics
  "moose", "goose", "geese", "poodle", "noodle", "noodles",
  "pudding", "puddings", "sausage", "sausages", "kipper", "kippers",
  "trout", "haddock", "gammon", "suet", "lard", "gravy", "custard",
  "dollop", "dollops", "blob", "blobs", "lump", "lumps", "bulge", "bulges",
  "wobble", "wobbles", "wobbly", "wibble", "grot", "grotty", "gunge",
  "smell", "smells", "smelly", "stink", "stinks", "stinky",
  "nostril", "nostrils", "armpit", "armpits", "earwig", "earwigs",
  "maggot", "maggots", "weevil", "weevils", "slug", "slugs",
  "goblin", "goblins", "gnome", "gnomes", "troll", "trolls",
  "clot", "clots", "oaf", "oafs", "dolt", "dolts", "nit", "nits",
  "waffle", "waffles", "piffle", "twaddle", "drivel", "guff",
  "mongrel", "mongrels", "whelk", "whelks", "winkle", "winkles",
  "bladder", "bladders", "gizzard", "gizzards", "gullet", "gullets",
  "trotter", "trotters", "haunch", "haunches", "rump", "rumps",
  "udder", "udders", "teat", "teats", "snout", "snouts",
  "hog", "hogs", "sow", "sows", "boar", "boars",
  "stool", "stools", "commode", "chamberpot",
  "corgi", "corgis", "spaniel", "ferret", "ferrets", "weasel", "weasels",
  "mucus", "pus", "scab", "scabs", "blister", "blisters",
  "whore", "whores", "harlot", "harlots", "hussy", "trollop",
  "codpiece", "bloomers",
  "chops", "oggs", "fosh", "frigs",

  // landings the curated lists aim for
  "orgasm", "orgasms", "prostitute", "prostitutes", "prostituted",
  "unfartunate", "unfartunately", "uniperversity", "uniperversities",
  "devilopment", "devilopments", "deviloper", "devilopers",
  "moovement", "moovements", "farter", "farters",
  "shit", "shits", "shitting", "bitch", "bitches",
  "cock", "cocks", "bottom", "bottoms", "wanking",
  "cunty", "cunties", "constipation", "arsessment", "arsessments",
  "arsumption", "arsumptions", "penisular", "regurgitate",
  "anal", "anally", "pubic", "pubicly", "impotent", "erection", "erections",
  "human-titty", "tittles",

  // found with Datamuse related-word lookups
  "knocker", "knockers", "piddle", "piddles", "boob", "boobs", "booby", "boobies",
  "pecker", "peckers", "hump", "humps", "breast", "breasts",

  // found by running the existing words through relatedwords.org and Datamuse
  "anus", "boner", "boners", "bollock", "booger", "boogers", "bonce", "butt", "butts",
  "crapper", "crappers", "dong", "dongs", "dork", "dorks", "dribble", "drool",
  "fanny", "fannies", "floozy", "fondle", "gob", "gonad", "gonads", "grope", "gropes",
  "heinie", "hiccup", "hooter", "hooters", "horny", "loin", "manky", "minging", "nad",
  "nads", "numpty", "perv", "pervs", "phallus", "pillock", "pillocks", "pimple", "pimples",
  "prick", "pricks", "pube", "pubes", "randy", "semen", "shite", "slobber", "strumpet",
  "strumpets", "thong", "thongs", "tosspot", "tosspots", "tummy", "tummies", "tush", "twat",
  "vomit", "wally", "wallies", "wiener", "wieners",

  // words worth exposing with a well-placed hyphen
  "suck", "sucks", "sucking", "meat", "meats", "bass", "dick", "dicks",
  "tickle", "tickles", "mint", "mints", "once",
];

export const targets = new Set(seeds);
