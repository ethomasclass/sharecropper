// ============================================================================
// TUNING — every game number lives here. Change prices and odds without
// touching game logic. All dollar amounts are game values, not history.
// ============================================================================
const CONFIG = {
  years: [1869, 1870, 1871, 1872, 1873],

  // The deal
  acres: 15,
  maxCornAcres: 5,          // contract caps the food patch
  acresPerBale: 3,          // about 1 bale per 3 acres of cotton
  familyShare: 0.5,         // half the crop
  muleOwnerShare: 2 / 3,    // a family with its own mule keeps two-thirds (planter takes a third)
  poundsPerBale: 400,

  // Cotton price per bale, announced each year
  pricePerBale: { 1869: 110, 1870: 95, 1871: 85, 1872: 85, 1873: 60 },

  // The almanac's years before the game: real New York prices, dollars per
  // pound of middling upland cotton (a history, not a game value). Historical
  // Statistics of the United States, Colonial Times to 1957, series E 104,
  // from James L. Watkins, Production and Price of Cotton for One Hundred Years (1895).
  historyPricePerLb: { 1866: 0.432, 1867: 0.316, 1868: 0.249 },

  // Store (furnish). Students only ever see credit prices.
  creditMarkup: 0.40,       // hidden: credit price = cash price x 1.40
  baskets: {
    lean:  { label: "Lean",  credit: 170, note: "Cut the cloth and shoes." },
    basic: { label: "Basic", credit: 210, note: "Food, cloth, shoes, and supplies." },
    extra: { label: "Extra", credit: 245, note: "Basic, plus medicine and coffee." },
  },
  cornSavingsCash: 12,      // each acre of corn cuts the store bill (cash price)

  ginningPerBale: 5,        // charged on the family's half
  shortWeight: 0.10,        // hidden: 10% of the family's cotton goes missing at the gin
  interestTold: 0.10,       // what the planter says
  interestCharged: 0.25,    // what the ledger actually charges on carried debt

  // Events
  doctorCredit: 10,
  muleCost: 60,
  eggsCash: 15,
  eggsMinCorn: 3,
  leaveCost: 10,            // moving costs; doubled after the night riders card
  evictOddsDemand: 1 / 3,   // demanding the books
  evictOddsVote: 1 / 4,     // voting

  leanSickOdds: 0.4,       // a lean basket in a bad year: chance someone falls sick

  // The ladder out
  rentSavings: 150,         // plus owning a mule
};

// The event deck. Weights set how often each card is drawn.
// 1873 is always the Panic. Election only in 1871 or 1872 (Mississippi had no 1870 election).
const DECK = [
  { id: "rains",    weight: 2.5 },
  { id: "drought",  weight: 1.2, bad: true },
  { id: "flood",    weight: 1.0, bad: true },
  { id: "muledies", weight: 0.8, bad: true },
  { id: "sickness", weight: 1.2, bad: true },
  { id: "school",   weight: 1.5 },
  { id: "election", weight: 2.0, years: [1871, 1872] },
  { id: "mulebuy",  weight: 3.5, years: [1870, 1871, 1872] },
  { id: "eggs",     weight: 2.0 },
  { id: "riders",   weight: 1.0, bad: true },
];
