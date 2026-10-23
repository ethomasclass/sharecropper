// ============================================================================
// ENGINE — pure game rules. No DOM in here, so it can be tested on its own.
// ============================================================================

// Seeded draws: every roll is keyed, so a refresh never rerolls a year.
function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function roll(seed, key) {
  let t = (hashString(seed + "|" + key) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function familySeed(family, classCode) {
  return (family || "").trim().toLowerCase() + "::" + (classCode || "").trim().toUpperCase();
}

const money = (n) => Math.round(n * 100) / 100;
const cashOf = (credit) => credit / (1 + CONFIG.creditMarkup);

// One card per year, without repeats. 1873 is always the Panic.
function drawEvents(seed) {
  const used = new Set();
  return CONFIG.years.map((year) => {
    if (year === 1873) return "panic";
    const pool = DECK.filter((c) => !used.has(c.id) && (!c.years || c.years.includes(year)));
    const total = pool.reduce((s, c) => s + c.weight, 0);
    let r = roll(seed, "event:" + year) * total;
    let pick = pool[pool.length - 1];
    for (const c of pool) {
      r -= c.weight;
      if (r < 0) { pick = c; break; }
    }
    used.add(pick.id);
    return pick.id;
  });
}

function isBadCard(id) {
  if (id === "panic") return true;
  const c = DECK.find((d) => d.id === id);
  return !!(c && c.bad);
}

function newGame(family, classCode) {
  const seed = familySeed(family, classCode);
  return {
    v: 1,
    family: family.trim(),
    classCode: (classCode || "").trim().toUpperCase(),
    seed,
    events: drawEvents(seed),
    yearIndex: 0,
    step: "contract",
    balance: 0,          // the planter's books: + savings, - debt
    honestBalance: 0,    // same family, same choices, no hidden charges
    ownMule: false,
    education: 0,
    planterIndex: 0,     // 0 = Holliday; moves to the next planter on leaving or eviction
    revealed: [],        // hidden line items the family has forced into the open
    years: [],
    ending: null,
    signed: false,
  };
}

function currentYear(g) { return CONFIG.years[g.yearIndex]; }

function blankYear(g) {
  return {
    year: currentYear(g),
    corn: 0,
    basket: "basic",
    event: g.events[g.yearIndex],
    choice: null,        // event choice: "yes" | "no"
    cornLost: false,
    yieldNotes: [],
    doctor: 0,
    muleCharge: 0,
    eggs: 0,
    muleBought: 0,
    leaveCost: 0,
    voted: false,
    evicted: false,
    evictedBy: null,
    demanded: false,
    decision: null,      // "stay" | "leave" | "rent"
    startBalance: g.balance,
    startHonest: g.honestBalance,
  };
}

// Planting preview: what the family is told (no short weight).
function plantingEstimate(corn, year) {
  const cottonAcres = CONFIG.acres - corn;
  const bales = cottonAcres / CONFIG.acresPerBale;
  const half = bales * CONFIG.familyShare;
  const price = CONFIG.pricePerBale[year];
  return {
    cottonAcres,
    bales,
    half,
    shareValue: half * price,
    storeSavings: corn * CONFIG.cornSavingsCash * (1 + CONFIG.creditMarkup),
  };
}

// Apply the drawn card and any choice the family made on it.
function applyEvent(g, y) {
  const notes = [];
  let mult = 1;
  const id = y.event;
  y.doctor = 0; y.muleCharge = 0; y.eggs = 0; y.cornLost = false;
  switch (id) {
    case "rains": mult *= 1.2; notes.push(["Good rains", 1.2]); break;
    case "drought": mult *= 0.7; notes.push(["Drought", 0.7]); break;
    case "flood": mult *= 0.8; y.cornLost = true; notes.push(["Flood", 0.8]); break;
    case "muledies":
      if (g.ownMule) y.lostOwnMule = true;
      else y.muleCharge = CONFIG.muleCost;
      break;
    case "sickness":
      if (y.basket === "extra") { mult *= 0.9; notes.push(["Sickness (medicine on hand)", 0.9]); }
      else { mult *= 0.85; y.doctor += CONFIG.doctorCredit; notes.push(["Sickness", 0.85]); }
      break;
    case "school":
      if (y.choice === "yes") { mult *= 0.9; notes.push(["A child in school", 0.9]); }
      break;
    case "election":
      y.voted = y.choice === "yes";
      break;
    case "eggs":
      if (y.corn >= CONFIG.eggsMinCorn) y.eggs = CONFIG.eggsCash;
      break;
    default: break;
  }
  // A lean basket leaves the family thin when a bad year comes.
  if (y.basket === "lean" && isBadCard(id) && roll(g.seed, "lean:" + y.year) < CONFIG.leanSickOdds) {
    mult *= 0.85;
    y.doctor += CONFIG.doctorCredit;
    notes.push(["Thin winter, sickness", 0.85]);
  }
  y.yieldMult = mult;
  y.yieldNotes = notes;
}

// Mule purchase happens on the card, in cash, if the family has it.
function canBuyMule(g) { return g.balance >= CONFIG.muleCost && !g.ownMule; }

// Harvest and gin. Returns the numbers the planter shows and the true ones.
function harvest(g, y) {
  const cottonAcres = CONFIG.acres - y.corn;
  const bales = (cottonAcres / CONFIG.acresPerBale) * y.yieldMult;
  y.shareRate = g.ownMule ? CONFIG.muleOwnerShare : CONFIG.familyShare;
  const half = bales * y.shareRate;
  const credited = half * (1 - CONFIG.shortWeight);
  y.totalBales = bales;
  y.familyBales = half;
  y.creditedBales = credited;
  y.trueLbs = Math.round(bales * CONFIG.poundsPerBale);
  y.scaleLbs = Math.round(bales * (1 - CONFIG.shortWeight) * CONFIG.poundsPerBale);
  return y;
}

// Build both ledgers for the year. `evicted` zeroes the family's share.
function buildLedger(g, y) {
  const price = CONFIG.pricePerBale[y.year];
  const cornSavingsCash = y.cornLost ? 0 : y.corn * CONFIG.cornSavingsCash;
  const basketCredit = CONFIG.baskets[y.basket].credit;
  const storeCredit = basketCredit - cornSavingsCash * (1 + CONFIG.creditMarkup);
  const storeCash = cashOf(basketCredit) - cornSavingsCash;
  const ginning = y.familyBales * CONFIG.ginningPerBale;

  const carried = y.startBalance - y.muleBought + y.eggs;
  const honestCarried = y.startHonest - y.muleBought + y.eggs;
  const interest = y.startBalance < 0 ? -y.startBalance * CONFIG.interestCharged : 0;
  const honestInterest = y.startHonest < 0 ? -y.startHonest * CONFIG.interestTold : 0;

  const share = y.evicted ? 0 : y.creditedBales * price;
  const honestShare = y.evicted ? 0 : y.familyBales * price;

  const planter = {
    price,
    share,
    store: storeCredit,
    doctor: y.doctor,
    mule: y.muleCharge,
    ginning,
    interest,
    leave: y.leaveCost,
  };
  planter.charges = planter.store + planter.doctor + planter.mule + planter.ginning + planter.interest + planter.leave;
  planter.balance = money(carried + planter.share - planter.charges);

  const honest = {
    price,
    share: honestShare,
    store: storeCash,
    doctor: cashOf(y.doctor),
    mule: y.muleCharge,
    ginning,
    interest: honestInterest,
    leave: y.leaveCost,
  };
  honest.charges = honest.store + honest.doctor + honest.mule + honest.ginning + honest.interest + honest.leave;
  honest.balance = money(honestCarried + honest.share - honest.charges);

  y.ledger = planter;
  y.honest = honest;
  y.markup = (storeCredit - storeCash) + (y.doctor - cashOf(y.doctor));
  y.missingBales = y.familyBales - y.creditedBales;
  y.missingValue = y.evicted ? 0 : y.missingBales * price;
  y.extraInterest = interest - (y.startBalance < 0 ? -y.startBalance * CONFIG.interestTold : 0);
  return y;
}

function leaveCostFor(y) {
  return CONFIG.leaveCost * (y.event === "riders" ? 2 : 1);
}

// Settling up. Recompute after anything that changes the year.
function settleNumbers(g, y) {
  buildLedger(g, y);
  return y.ledger.balance;
}

// The vote can cost the family its place. Rolled once, at settling up.
function voteEviction(g, y) {
  return y.voted && roll(g.seed, "vote:" + y.year) < CONFIG.evictOddsVote;
}

const HIDDEN_ITEMS = ["markup", "weight", "interest"];

// Demanding the books: 1 in 3 the planter puts the family off the place.
function demandBooks(g, y) {
  y.demanded = true;
  if (roll(g.seed, "demand:" + y.year) < CONFIG.evictOddsDemand) {
    y.evicted = true;
    y.evictedBy = "demand";
    buildLedger(g, y);
    return { evicted: true };
  }
  const next = HIDDEN_ITEMS.find((k) => !g.revealed.includes(k)) || HIDDEN_ITEMS[0];
  if (!g.revealed.includes(next)) g.revealed.push(next);
  return { evicted: false, item: next };
}

function canRent(g, balance) { return balance >= CONFIG.rentSavings && g.ownMule; }

// Close the year with the family's decision and move on.
function closeYear(g, y, decision) {
  y.decision = decision;
  buildLedger(g, y);
  const owed = y.ledger.balance < 0;
  if (decision === "leave" && !y.evicted && !owed) {
    y.leaveCost = leaveCostFor(y);
    buildLedger(g, y);
  }
  g.balance = y.ledger.balance;
  g.honestBalance = y.honest.balance;
  if (y.lostOwnMule) g.ownMule = false;
  g.years[g.yearIndex] = y;

  if (decision === "rent") { g.ending = "rent"; return g; }
  if (decision === "leave" && owed && !y.evicted) { g.ending = "vagrancy"; return g; }
  if (decision === "leave" || y.evicted) g.planterIndex += 1;
  if (g.yearIndex >= CONFIG.years.length - 1) { g.ending = "cropping"; return g; }
  g.yearIndex += 1;
  return g;
}

// Totals for the audit, from the family's own play.
function auditTotals(g) {
  const ys = g.years.filter(Boolean);
  const markup = ys.reduce((s, y) => s + y.markup, 0);
  const missingBales = ys.reduce((s, y) => s + (y.evicted ? 0 : y.missingBales), 0);
  const missingValue = ys.reduce((s, y) => s + y.missingValue, 0);
  const extraInterest = ys.reduce((s, y) => s + y.extraInterest, 0);
  const finalPlanter = ys.length ? ys[ys.length - 1].ledger.balance : 0;
  const finalHonest = ys.length ? ys[ys.length - 1].honest.balance : 0;
  return {
    markup: money(markup),
    missingBales,
    missingLbs: Math.round(missingBales * CONFIG.poundsPerBale),
    missingValue: money(missingValue),
    extraInterest: money(extraInterest),
    finalPlanter,
    finalHonest,
    wouldRent: finalHonest >= CONFIG.rentSavings,
  };
}
