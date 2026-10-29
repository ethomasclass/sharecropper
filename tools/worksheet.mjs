// Builds the printable student worksheet: teacher/worksheet.src.html, with
// the game's fonts packed in, becomes teacher/worksheet.html and, printed by
// headless Chromium, teacher/Settling-Up-Worksheet.pdf (two letter pages).
// Usage: node tools/worksheet.mjs   (needs Playwright; PLAYWRIGHT_MODULE can point at it)
import fs from "node:fs";
import { createRequire } from "node:module";

const root = new URL("..", import.meta.url).pathname;
const b64 = (f) => fs.readFileSync(root + f).toString("base64");
const face = (family, file, extra) => `@font-face { font-family: "${family}"; src: url(data:font/woff2;base64,${b64(file)}) format("woff2"); ${extra} }`;
const fonts = [
  face("Archivo", "node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2", "font-weight: 100 900; font-stretch: 62% 125%;"),
  face("Public Sans", "node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2", "font-weight: 100 900; font-style: normal;"),
  face("Public Sans", "node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-italic.woff2", "font-weight: 100 900; font-style: italic;"),
  face("Courier Prime", "node_modules/@fontsource/courier-prime/files/courier-prime-latin-700-normal.woff2", "font-weight: 700;"),
  face("Caveat", "node_modules/@fontsource/caveat/files/caveat-latin-700-normal.woff2", "font-weight: 400 700;"),
].join("\n");

const html = fs.readFileSync(root + "teacher/worksheet.src.html", "utf8").replace("/*FONTS*/", fonts);
fs.writeFileSync(root + "teacher/worksheet.html", html);

const pw = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await pw.chromium.launch();
const page = await browser.newPage();
await page.goto("file://" + root + "teacher/worksheet.html");
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: root + "teacher/Settling-Up-Worksheet.pdf", preferCSSPageSize: true, printBackground: true });
await browser.close();
const pages = (fs.readFileSync(root + "teacher/Settling-Up-Worksheet.pdf", "latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`Wrote teacher/worksheet.html and teacher/Settling-Up-Worksheet.pdf (${pages} page${pages === 1 ? "" : "s"}).`);
if (pages !== 2) process.exitCode = 1;
