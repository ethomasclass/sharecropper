// Plays the built game start to finish in headless Chromium and saves
// screenshots. Usage: node tools/playtest.mjs [outDir] [--flat]
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
  const file = root + "Settling-Up.html";
  res.writeHead(200, { "content-type": "text/html" });
  res.end(fs.readFileSync(file));
}).listen(0);
const port = server.address().port;

const browser = await pw.chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
await page.route("https://cdn.jsdelivr.net/**", (route) => {
  if (flat) return route.abort();
  route.fulfill({ status: 200, contentType: "application/javascript", headers: { "access-control-allow-origin": "*" }, body: fs.readFileSync(root + "node_modules/three/build/three.module.min.js", "utf8") });
});
await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
await page.route("https://fonts.gstatic.com/**", (r) => r.abort());

let n = 0;
const settle = async () => { for (let i = 0; i < 60; i++) { if (!(await page.evaluate(() => SettlingUp.World.debug?.walking))) break; await page.waitForTimeout(200); } await page.waitForTimeout(250); };
const shot = async (name) => { await settle(); await page.screenshot({ path: `${out}/${String(++n).padStart(2, "0")}-${name}.png` }); };
const click = async (sel) => { await page.waitForSelector(sel, { state: "visible", timeout: 20000 }); await page.click(sel); };

await page.goto(`http://localhost:${port}/`);
await page.waitForSelector("#fam-name", { timeout: 20000 });
await page.waitForTimeout(600);
await shot("join");
await page.fill("#fam-name", "Whitfield");
await page.fill("#class-code", "P3");
await page.click("#join-form button[type=submit]");
await page.waitForSelector("#cutscene:not([hidden])");
await page.waitForTimeout(400);
await shot("prologue");
for (let i = 0; i < 5; i++) { await page.keyboard.press("Enter"); await page.waitForTimeout(120); }
await page.waitForSelector("#mark-btn");
await shot("contract");
await page.click("#mark-btn");

const worldOk = await page.evaluate(() => SettlingUp.World.ok);
console.log("3D world:", worldOk ? "running" : "flat fallback");

for (let year = 0; year < 5; year++) {
  await page.waitForSelector("#plant-done", { timeout: 20000 });
  await page.waitForTimeout(year === 0 ? 2500 : 1500);
  if (year === 0) await shot("plant-start");
  for (const a of [0, 1, 2, 5, 6]) await page.click(`[data-acre="${a}"]`);
  await page.waitForTimeout(300);
  if (year === 0) await shot("plant-corn");
  await page.click("#plant-done");
  await page.waitForSelector("[data-basket]", { timeout: 20000 });
  await page.waitForTimeout(400);
  if (year === 0) await shot("store");
  await page.click(`[data-basket="${year % 2 ? "lean" : "basic"}"]`);
  await page.waitForSelector("[data-choice]", { timeout: 20000 });
  await page.waitForTimeout(400);
  await shot(`event-${1869 + year}`);
  await page.click("[data-choice]");
  const doneBtn = await page.$("#card-actions [data-done]");
  if (doneBtn) await doneBtn.click();
  const goOn = await page.waitForSelector("#go-on, #load-wagon", { timeout: 20000 });
  if ((await goOn.getAttribute("id")) === "go-on") { await page.waitForTimeout(800); if (year < 2) await shot("weather"); await page.click("#go-on"); }
  await page.waitForSelector("#load-wagon", { timeout: 20000 });
  if (await page.$("#walk-rows")) {
    if (year === 0) await shot("harvest");
    await page.click("#walk-rows");
    if (year === 0) { await page.waitForTimeout(5000); await page.screenshot({ path: `${out}/${String(++n).padStart(2, "0")}-walking-rows.png` }); }
    await page.waitForSelector("#load-wagon:not([disabled])", { timeout: 90000 });
  }
  await page.click("#load-wagon");
  await page.waitForSelector("#to-settle", { timeout: 30000 });
  await page.waitForTimeout(500);
  if (year === 0) await shot("scale");
  await page.click("#to-settle");
  await page.waitForSelector(".settle [data-act]", { timeout: 30000 });
  await page.waitForTimeout(600);
  await shot(`settle-${1869 + year}`);
  if (year === 1 && await page.$('[data-act="demand"]')) {
    await page.click('[data-act="demand"]');
    await page.waitForTimeout(300);
    await shot("demand");
  }
  const act = (await page.$('[data-act="rent"]')) ? "rent" : (await page.$('[data-act="move"]')) ? "move" : "stay";
  await page.click(`[data-act="${act}"]`);
  if (act === "rent") break;
  await page.waitForTimeout(500);
  if (await page.$("#cutscene:not([hidden])")) {
    await shot(`interlude-${1870 + year}`);
    for (let i = 0; i < 4; i++) { if (await page.$("#cutscene:not([hidden])")) await page.keyboard.press("Enter"); await page.waitForTimeout(150); }
  }
  const ended = await page.evaluate(() => !!SettlingUp.Game.g.ending);
  if (ended) break;
}
await page.waitForSelector("#cutscene:not([hidden])", { timeout: 20000 });
await page.waitForTimeout(400);
await shot("ending");
for (let i = 0; i < 6; i++) { if (await page.$("#cutscene:not([hidden])")) await page.keyboard.press("Enter"); await page.waitForTimeout(150); }
await page.waitForSelector("#audit-form", { timeout: 20000 });
await page.waitForTimeout(400);
await shot("audit");
const a = await page.evaluate(() => SettlingUp.auditTotals(SettlingUp.Game.g));
await page.fill("#q1", String(a.markup));
await page.fill("#q2", String(a.missingLbs));
await page.check(`input[name="q3"][value="${a.wouldRent ? "yes" : "no"}"]`);
await page.click("#audit-form button[type=submit]");
await page.waitForSelector("#audit-done", { state: "visible" });
await page.evaluate(() => document.querySelector(".blanks").scrollIntoView());
await shot("audit-checked");
await page.click("#audit-done");
await page.waitForSelector(".final");
await shot("final");
await page.click("#journal-btn");
await page.waitForTimeout(200);
await shot("journal");
await page.click("#journal-close");

// teacher board
await page.evaluate(() => { location.hash = "teacher"; SettlingUp.Teacher.open(); });
await page.waitForSelector("#t-code-in");
await page.fill("#t-code-in", "P3");
await page.click("#t-code button");
await page.fill("#t-fam", "Okafor"); await page.fill("#t-bal", "-84.17"); await page.click("#t-add button");
await page.fill("#t-fam", "Reyes"); await page.fill("#t-bal", "162"); await page.selectOption("#t-end", "rent"); await page.click("#t-add button");
await page.fill("#t-fam", "Baptiste"); await page.fill("#t-bal", "-12.5"); await page.click("#t-add button");
await page.waitForTimeout(200);
await shot("teacher");

// phone width
await page.setViewportSize({ width: 400, height: 820 });
await page.evaluate(() => SettlingUp.Teacher.close());
await page.waitForTimeout(500);
await shot("phone-join");

const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
console.log("Ending:", await page.evaluate(() => SettlingUp.Game.g?.ending ?? "(new game screen)"));
console.log("Horizontal overflow at 400px:", overflow);
console.log(errors.length ? "Errors:\n" + errors.join("\n") : "No page errors.");
await browser.close();
server.close();
