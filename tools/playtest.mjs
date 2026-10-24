// Plays the built game start to finish in headless Chromium and saves
// screenshots. Papa is walked to each flag the way a student would.
// Usage: node tools/playtest.mjs [outDir] [--flat]
// Needs Playwright (PLAYWRIGHT_MODULE can point at an install).
import fs from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pw = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = new URL("..", import.meta.url).pathname;
const out = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : root + "dist/shots";
const flat = process.argv.includes("--flat");
fs.mkdirSync(out, { recursive: true });

const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/html" });
  res.end(fs.readFileSync(root + "Settling-Up.html"));
}).listen(0);
const browser = await pw.chromium.launch({ args: [...(flat ? ["--disable-webgl", "--disable-3d-apis"] : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]), "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
const requests = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
page.on("request", (r) => { if (!r.url().startsWith("http://localhost") && !r.url().startsWith("data:")) requests.push(r.url()); });

let n = 0;
let cutscenes = 0;
const shot = async (name) => { await page.waitForTimeout(350); await page.screenshot({ path: `${out}/${String(++n).padStart(2, "0")}-${name}.png` }); };
const dbg = () => page.evaluate(() => SettlingUp.World.debug);
const sleep = (ms) => page.waitForTimeout(ms);

// Walk Papa in short steps toward a point, facing where he goes.
async function walkTo(x, z) {
  const d = await dbg();
  const steps = Math.max(1, Math.ceil(Math.hypot(x - d.x, z - d.z) / 1.2));
  for (let i = 1; i <= steps; i++) {
    const px = d.x + ((x - d.x) * i) / steps, pz = d.z + ((z - d.z) * i) / steps;
    await page.evaluate(([px, pz, yaw]) => SettlingUp.World._teleport(px, pz, yaw), [px, pz, Math.atan2(-(x - d.x), -(z - d.z))]);
    await sleep(40);
  }
}
async function followFlag(id) {
  if (!worldOk) return;
  for (let i = 0; i < 300; i++) {
    const d = await dbg();
    if (d.objective === id) break;
    // An interlude (the 1870 amendment, the 1873 panic) can open between steps.
    if (await page.$("#cutscene:not([hidden])")) { cutscenes++; await page.keyboard.press("Enter"); }
    await sleep(100);
  }
  const d = await dbg();
  if (d.objective !== id) {
    const state = await page.evaluate(() => ({ step: SettlingUp.Game.g?.step, sheet: !document.querySelector("#sheet").hidden, cut: !document.querySelector("#cutscene").hidden, mark: document.querySelector("#mark-btn")?.className, dock: document.querySelector("#dock").innerText.slice(0, 80), cutText: document.querySelector("#cutscene").innerText.slice(0, 160) }));
    throw new Error(`expected objective ${id}, got ${d.objective}: ${JSON.stringify(state)}`);
  }
  await walkTo(d.ox, d.oz + (id === "porch" || id === "contract" ? 1.5 : 0));
  for (let i = 0; i < 40; i++) { if ((await dbg()).objective !== id) return; await sleep(100); }
}
async function walkRows() {
  if (!worldOk) { await page.click("#rows-done"); return; }
  for (const [z, xs] of [[4.6, [-10.5, 10.5]], [0, [10.5, -10.5]], [-4.6, [-10.5, 10.5]]]) {
    await walkTo(xs[0], z);
    await walkTo(xs[1], z);
    if (!(await page.$("#rows-pct"))) return;
  }
  const left = await page.$("#rows-done:not([disabled])");
  if (left) await left.click().catch(() => {});   // the rows may finish on their own first
}

await page.goto(`http://localhost:${server.address().port}/`);
await page.waitForSelector("#fam-name", { timeout: 30000 });
const worldOk = await page.evaluate(() => SettlingUp.World.ok);
console.log("3D world:", worldOk ? "running" : "flat fallback");
await page.evaluate(() => { window.__voice = 0; SettlingUp.Voice.audio.addEventListener("playing", () => window.__voice++); });
await shot("join");
await page.fill("#fam-name", "Whitfield");
await page.click("#join-form button[type=submit]");
await page.waitForSelector("#cutscene:not([hidden])");
await shot("prologue");
for (let i = 0; i < 5; i++) { await page.keyboard.press("Enter"); await sleep(120); }

if (worldOk) {
  await sleep(300);
  const before = await dbg();
  await page.keyboard.down("w"); await sleep(900); await page.keyboard.up("w");
  const after = await dbg();
  console.log("Keyboard walking moved Papa:", Math.hypot(after.x - before.x, after.z - before.z).toFixed(1), "m");
  await shot("walk-to-contract");
}
await followFlag("contract");
await page.waitForSelector("#mark-btn", { timeout: 20000 });
await shot("contract");
await page.click("#mark-btn");

for (let year = 0; year < 5; year++) {
  await followFlag("store");
  await page.waitForSelector("[data-basket]", { timeout: 20000 });
  if (year === 0) await shot("store");
  await page.click(`[data-basket="${year % 2 ? "lean" : "basic"}"]`);
  await followFlag("field");
  await page.waitForSelector("#almanac-close", { timeout: 20000 });
  if (year < 2) await shot(`almanac-${1869 + year}`);
  await page.click("#almanac-close");
  await page.waitForSelector("#plan-done", { timeout: 20000 });
  for (const a of [0, 1, 2, 5, 6]) await page.click(`[data-acre="${a}"]`);
  if (year === 0) await shot("plan");
  await page.click("#plan-done");
  await sleep(200);
  if (year === 0 && worldOk) { await walkTo(-10.5, 6.6); await walkTo(0, 6.6); await shot("planting-rows"); }
  await walkRows();
  await followFlag("cabin");
  const card = async (name) => {
    await page.waitForSelector("[data-choice]", { timeout: 30000 });
    await shot(name);
    await page.click("[data-choice]");
    const doneBtn = await page.$("#card-actions [data-done]");
    if (doneBtn) await doneBtn.click();
  };
  if (year < 4) await card(`event-${1869 + year}`);
  await followFlag("field-fall");
  if (year === 4) {
    await page.waitForSelector("#cutscene:not([hidden])", { timeout: 30000 });
    await shot("panic-cutscene");
    for (let i = 0; i < 2; i++) { await page.keyboard.press("Enter"); await sleep(200); }
    await card("panic-card");
  }
  await page.waitForSelector("#rows-pct, #rows-done", { timeout: 20000 });
  if (year === 0 && worldOk) { await walkTo(-10.5, 6.6); await walkTo(-2, 6.6); await shot("harvest-rows"); }
  await walkRows();
  await followFlag("wagon");
  if (year === 0 && worldOk) { await walkTo(12.4, 0.6); await shot("leading-wagon"); }
  await followFlag("gin");
  await page.waitForSelector("#to-settle", { timeout: 30000 });
  await sleep(year === 0 ? 3600 : 0);
  if (year === 0) await shot("scale");
  await page.click("#to-settle");
  await followFlag("porch");
  await page.waitForSelector(".settle [data-act]", { timeout: 30000 });
  await sleep(year === 0 ? 4500 : 0);   // let the book add itself up
  await shot(`settle-${1869 + year}`);
  // Leaving is offered but never allowed: it stays this year and the next.
  if (year === 0) {
    const before = await page.evaluate(() => SettlingUp.Game.g.yearIndex);
    await page.click('[data-act="leave"]');
    await page.waitForSelector('[data-act="leave"][disabled]', { timeout: 5000 });
    await shot("leave-blocked");
    const after = await page.evaluate(() => ({ i: SettlingUp.Game.g.yearIndex, end: SettlingUp.Game.g.ending }));
    if (after.i !== before || after.end) throw new Error("Leaving moved the story on: " + JSON.stringify(after));
    console.log("Leaving is offered and refused: yes");
  }
  if (year === 1 && await page.$('[data-act="demand"]')) {
    await page.click('[data-act="demand"]');
    await page.waitForSelector('.settle [data-act]:not([disabled])', { timeout: 30000 });
    await shot("demand");
  }
  const act = (await page.$('[data-act="rent"]')) ? "rent" : (await page.$('[data-act="move"]')) ? "move" : "stay";
  await page.click(`[data-act="${act}"]`);
  await sleep(400);
  if (await page.$("#cutscene:not([hidden])")) {
    if (!(await page.evaluate(() => !!SettlingUp.Game.g.ending))) {
      await shot(`interlude-${1870 + year}`);
      for (let i = 0; i < 4; i++) { if (await page.$("#cutscene:not([hidden])")) await page.keyboard.press("Enter"); await sleep(150); }
    }
  }
  if (await page.evaluate(() => !!SettlingUp.Game.g.ending)) break;
}
await page.waitForSelector("#cutscene:not([hidden])", { timeout: 20000 });
await shot("ending");
for (let i = 0; i < 6; i++) { if (await page.$("#cutscene:not([hidden])")) await page.keyboard.press("Enter"); await sleep(150); }
await page.waitForSelector("#audit-form", { timeout: 20000 });
await shot("audit");
const a = await page.evaluate(() => SettlingUp.auditTotals(SettlingUp.Game.g));
await page.fill("#q1", String(a.markup));
await page.fill("#q2", String(a.missingLbs));
await page.check(`input[name="q3"][value="${a.wouldRent ? "yes" : "no"}"]`);
await page.click("#audit-form button[type=submit]");
await page.waitForSelector("#audit-done", { state: "visible" });
await page.click("#audit-done");
await page.waitForSelector(".final");
await shot("final");
await page.setViewportSize({ width: 400, height: 820 });
await shot("phone-final");
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
console.log("Voice lines heard:", await page.evaluate(() => window.__voice));
console.log("Ambience loop playing:", await page.evaluate(() => SettlingUp.Ambience.cur ? SettlingUp.Ambience.cur.name : "none"));
console.log("Interlude panels clicked through:", cutscenes);
console.log("Ending:", await page.evaluate(() => SettlingUp.Game.g.ending));
console.log("Horizontal overflow at 400px:", overflow);
console.log("Outside requests:", requests.length ? requests.join(", ") : "none");
console.log(errors.length ? "Errors:\n" + errors.join("\n") : "No page errors.");
await browser.close();
server.close();
