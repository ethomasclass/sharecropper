// Plays thousands of families through the engine to check tuning.
//   node tools/simulate.mjs          print outcome rates by play style
//   node tools/simulate.mjs --check  also assert the spec's worked example
import fs from "node:fs";
import vm from "node:vm";

const root = new URL("..", import.meta.url).pathname;
const code = ["src/config.js", "src/engine.js"].map((f) => fs.readFileSync(root + f, "utf8")).join("\n");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(code + "\nObject.assign(globalThis,{CONFIG,DECK,newGame,blankYear,applyEvent,harvest,buildLedger,settleNumbers,voteEviction,demandBooks,closeYear,canRent,canBuyMule,auditTotals,plantingEstimate,drawEvents,roll});", ctx);
const E = ctx;

function playFamily(seedName, style, rnd) {
  const g = E.newGame(seedName, "SIM");
  while (!g.ending) {
    const y = E.blankYear(g);
    y.corn = style.corn(rnd);
    y.basket = style.basket(rnd);
    if (y.event === "school") y.choice = rnd() < style.school ? "yes" : "no";
    if (y.event === "election") y.choice = rnd() < style.vote ? "yes" : "no";
    if (y.event === "mulebuy") {
      y.choice = E.canBuyMule(g) && rnd() < style.mule ? "yes" : "no";
      if (y.choice === "yes") { y.muleBought = E.CONFIG.muleCost; g.ownMule = true; }
    }
    E.applyEvent(g, y);
    E.harvest(g, y);
    E.buildLedger(g, y);
    if (E.voteEviction(g, y)) { y.evicted = true; y.evictedBy = "vote"; E.buildLedger(g, y); }
    if (!y.evicted && rnd() < style.demand) E.demandBooks(g, y);
    const bal = y.ledger.balance;
    let decision = "stay";
    if (!y.evicted && E.canRent(g, bal)) decision = "rent";
    else if (!y.evicted && rnd() < style.leave) decision = "leave";
    E.closeYear(g, y, decision);
  }
  return g;
}

const pick = (arr) => (rnd) => arr[Math.floor(rnd() * arr.length)];
const STYLES = {
  "careful (5 corn, lean)": { corn: () => 5, basket: () => "lean", school: 0, vote: 0, mule: 1, demand: 0, leave: 0 },
  "good (5 corn, basic)": { corn: () => 5, basket: () => "basic", school: 0.5, vote: 0.5, mule: 1, demand: 0, leave: 0 },
  "all cotton, basic": { corn: () => 0, basket: () => "basic", school: 0.5, vote: 0.5, mule: 1, demand: 0, leave: 0 },
  "thoughtful class": {
    corn: (r) => 3 + Math.floor(r() * 3),
    basket: pick(["lean", "lean", "basic", "basic", "extra"]),
    school: 0.5, vote: 0.5, mule: 0.9, demand: 0.2, leave: 0.03,
  },
  "typical class mix": {
    corn: (r) => Math.floor(r() * 6),
    basket: pick(["lean", "basic", "basic", "extra"]),
    school: 0.5, vote: 0.6, mule: 0.8, demand: 0.2, leave: 0.05,
  },
};

let seedCounter = 0;
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const N = 20000;
for (const [name, style] of Object.entries(STYLES)) {
  const counts = { cropping: 0, rent: 0, left: 0 };
  let debt = 0, sum = 0, honestRent = 0;
  for (let i = 0; i < N; i++) {
    const g = playFamily("fam" + seedCounter++, style, mulberry(seedCounter * 7919));
    counts[g.ending]++;
    if (g.balance < 0) debt++;
    sum += g.balance;
    if (E.auditTotals(g).wouldRent) honestRent++;
  }
  const pct = (n) => (100 * n / N).toFixed(1) + "%";
  console.log(`${name.padEnd(26)} rent ${pct(counts.rent).padStart(6)}  left owing ${pct(counts.left).padStart(6)}  in debt ${pct(debt).padStart(6)}  avg $${(sum / N).toFixed(0).padStart(5)}  honest books ≥$150 ${pct(honestRent)}`);
}

if (process.argv.includes("--check")) {
  // Spec worked example, 1869: all cotton, basic basket, no card effect.
  const g = E.newGame("Example", "TEST");
  const y = E.blankYear(g);
  y.event = "none"; y.corn = 0; y.basket = "basic";
  E.applyEvent(g, y); E.harvest(g, y); E.buildLedger(g, y);
  const ok = Math.abs(y.ledger.balance - 25) < 0.001 && Math.abs(y.ledger.share - 247.5) < 0.001 && Math.abs(y.ledger.ginning - 12.5) < 0.001;
  console.log(`\nWorked example 1869: share $${y.ledger.share}, ginning $${y.ledger.ginning}, balance $${y.ledger.balance} -> ${ok ? "PASS" : "FAIL"}`);
  // Seeded draws: same family + class code always gets the same cards.
  const a = E.drawEvents("whitfield::P3").join(), b = E.drawEvents("whitfield::P3").join();
  const det = a === b && E.drawEvents("x::P3").at(-1) === "panic";
  console.log(`Seeded draws repeat, 1873 is the Panic -> ${det ? "PASS" : "FAIL"}`);
  // Election only lands in 1870 or 1872.
  let electionOk = true;
  for (let i = 0; i < 5000; i++) {
    const ev = E.drawEvents("s" + i);
    ev.forEach((id, k) => { if (id === "election" && ![1871, 1872].includes(E.CONFIG.years[k])) electionOk = false; });
  }
  console.log(`Election only in 1871 or 1872 -> ${electionOk ? "PASS" : "FAIL"}`);
  if (!ok || !det || !electionOk) process.exit(1);
}
