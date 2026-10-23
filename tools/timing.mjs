// Estimates how long one playthrough takes, from the game's real walking
// routes, the words on screen, and time for decisions.
//   node tools/timing.mjs
import fs from "node:fs";
import vm from "node:vm";

const root = new URL("..", import.meta.url).pathname;
const ctx = { fmt: (n) => "$" + n };
vm.createContext(ctx);
vm.runInContext(["src/config.js", "src/story.js"].map((f) => fs.readFileSync(root + f, "utf8")).join("\n") +
  "\nObject.assign(globalThis,{CONFIG,PROLOGUE,CONTRACT,YEAR_LINES,CARDS,INTERLUDES,ENDINGS,EPILOGUE,SETTLE_TEXT,STORE_ITEMS});", ctx);
const S = ctx;

const PROPOSED = process.argv.includes("--proposed");
// Assumptions, all adjustable
const A = {
  walkSpeed: 4.4,        // m/s, as in the game
  wander: 1.4,           // real players turn, look around, and overshoot
  readWpm: 150,          // groups of 2-3 reading together, often aloud
  voWpm: 145,            // unhurried narration
  panelPause: 1.5,       // seconds of art before a cutscene panel's text
  decide: { plan: 40, store: 25, cardChoice: 20, settle: 30, mark: 8 },
  audit: 240, final: 60, join: 45,
};
const words = (s) => String(s || "").split(/\s+/).filter(Boolean).length;
const readSec = (s) => (words(s) / A.readWpm) * 60;
const voSec = (s) => (words(s) / A.voWpm) * 60;
const walk = (m) => (m / A.walkSpeed) * A.wander;

// Walking routes in meters, measured on the map (roads and the field gate)
const ROUTE = {
  homeToPorch: 46, porchToStore: 36, homeToStore: 27.4, storeToField: 15.9,
  rows: 72, rowsToCabin: 30, cabinToField: 14.7, rowsToWagon: 8, wagonToGin: 3.3, ginToPorch: 32.5,
};
// Proposed: the family finishes once Papa has walked about 60% of the rows,
// the big house moves 8 m closer, and repeat years skip what students know.
if (PROPOSED) Object.assign(ROUTE, { rows: 44, homeToPorch: 38, porchToStore: 30, ginToPorch: 25 });

const rows = [];
const add = (part, sec, note = "") => rows.push({ part, sec, note });

add("Join screen", A.join);
const pro = S.PROLOGUE.map((p) => p.caption + " " + p.sub).join(" ");
add("Prologue (5 panels)", S.PROLOGUE.length * A.panelPause + Math.max(readSec(pro), voSec(pro)), `${words(pro)} words`);
add("Walk to the big house", walk(ROUTE.homeToPorch));
const contract = [S.CONTRACT.narration, ...S.CONTRACT.lines, ...S.CONTRACT.terms.flat()].join(" ");
add("Contract", readSec(contract) + A.decide.mark, `${words(contract)} words`);

for (const yr of S.CONFIG.years) {
  const L = S.YEAR_LINES[yr];
  const first = yr === 1869;
  const walking = walk((first ? ROUTE.porchToStore : ROUTE.homeToStore) + ROUTE.storeToField + ROUTE.rows + ROUTE.rowsToCabin + ROUTE.cabinToField + ROUTE.rows + ROUTE.rowsToWagon + ROUTE.wagonToGin + ROUTE.ginToPorch);
  const storeText = L.store + " " + Object.values(S.STORE_ITEMS).flat().join(" ");
  // a representative card: average card text
  const cards = Object.values(S.CARDS).filter((c) => c.dyk);
  const cardWords = cards.reduce((s, c) => s + words([c.title, c.body, c.effect || c.question, c.dyk].join(" ")), 0) / cards.length;
  const dockText = [L.plant, L.harvest, L.settle].join(" ");
  const settleWords = words(S.SETTLE_TEXT.owe) + 40;
  const repeat = PROPOSED && !first ? 0.5 : 1;  // students skim screens they've seen
  const sec = walking + readSec(storeText) * repeat + A.decide.store * repeat + A.decide.plan * (PROPOSED && !first ? 0.6 : 1) + (cardWords / A.readWpm) * 60 + A.decide.cardChoice * 0.4 +
    readSec(dockText) + 15 + (settleWords / A.readWpm) * 60 + A.decide.settle;
  add(`Year ${yr}`, sec, `walking ${Math.round(walking)} s`);
  if (S.INTERLUDES[yr + 1]) {
    const t = S.INTERLUDES[yr + 1].map((p) => p.caption + " " + p.sub).join(" ");
    add(`Interlude before ${yr + 1}`, S.INTERLUDES[yr + 1].length * A.panelPause + Math.max(readSec(t), voSec(t)), `${words(t)} words`);
  }
}
const end = [...S.ENDINGS.cropping.panels, S.EPILOGUE.school].map((p) => p.caption + " " + p.sub).join(" ");
add("Ending and epilogue", 3 * A.panelPause + Math.max(readSec(end), voSec(end)), `${words(end)} words`);
add("Audit", A.audit);
add("Exit ticket screen", A.final);

const total = rows.reduce((s, r) => s + r.sec, 0);
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
console.log(PROPOSED ? "PROPOSED" : "AS BUILT");
console.log("Part".padEnd(28), "Time".padStart(6), " Notes");
rows.forEach((r) => console.log(r.part.padEnd(28), mmss(r.sec).padStart(6), " " + r.note));
console.log("-".repeat(50));
console.log("Total".padEnd(28), mmss(total).padStart(6));
