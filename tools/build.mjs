// Assembles the whole game into one self-contained HTML page: the 3D
// library, the fonts, and any art you added in art/ are all packed inside,
// so it runs offline with no accounts and nothing to install.
//   Settling-Up.html       the standalone file, voice included: download, share, open
//   index.html             for GitHub Pages; loads the voice from audio/vo/ and
//                          the art from assets/art/, so the page itself stays small
//   dist/settling-up.html  the page body for a Claude artifact (drawn art, no voice)
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const read = (f) => fs.readFileSync(root + f, "utf8");
const b64 = (f) => fs.readFileSync(root + f).toString("base64");

// three.js ships as an ES module. Wrap it so it lives inside our one script.
function threeInline() {
  const src = read("node_modules/three/build/three.module.min.js");
  const at = src.lastIndexOf("export{");
  const list = src.slice(at + 7, src.indexOf("}", at));
  const body = src.slice(0, at);
  const pairs = list.split(",").map((e) => {
    const [local, , exported] = e.trim().split(/\s+/);
    return `${exported || local}:${local}`;
  });
  return `const THREE_LIB = (() => {\n${body}\nreturn {${pairs.join(",")}};\n})();`;
}

function fontFaces() {
  const face = (family, file, extra) => `@font-face { font-family: "${family}"; src: url(data:font/woff2;base64,${b64(file)}) format("woff2"); font-display: swap; ${extra} }`;
  return [
    face("Archivo", "node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2", "font-weight: 100 900; font-stretch: 62% 125%;"),
    face("Public Sans", "node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2", "font-weight: 100 900; font-style: normal;"),
    face("Public Sans", "node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-italic.woff2", "font-weight: 100 900; font-style: italic;"),
    face("Courier Prime", "node_modules/@fontsource/courier-prime/files/courier-prime-latin-400-normal.woff2", "font-weight: 400;"),
    face("Courier Prime", "node_modules/@fontsource/courier-prime/files/courier-prime-latin-700-normal.woff2", "font-weight: 700;"),
    face("Caveat", "node_modules/@fontsource/caveat/files/caveat-latin-500-normal.woff2", "font-weight: 500;"),
    face("Caveat", "node_modules/@fontsource/caveat/files/caveat-latin-700-normal.woff2", "font-weight: 700;"),
  ].join("\n");
}

function customArt() {
  const run = spawnSync("python3", [root + "tools/prepare_art.py"], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (run.status !== 0) {
    console.warn("Could not prepare art/ (needs Python 3 with Pillow). Using the drawn art.\n" + (run.stderr || ""));
    return {};
  }
  const { art, notes } = JSON.parse(run.stdout);
  notes.forEach((n) => console.log("  " + n));
  return art;
}

// story/lines.mjs and story/vo.mjs are modules; wrap them so they live in the page's script.
function storyInline() {
  const strip = (f) => read(f).replace(/^export /gm, "");
  return `const { SCENES, ARC, TAGS, VOICES, DYK } = (() => {\n${strip("story/lines.mjs")}\nreturn { SCENES, ARC, TAGS, VOICES, DYK };\n})();`;
}

// The recorded lines in audio/vo/ (or the loops in audio/amb/), as data URIs for the standalone file.
function audioInline(sub = "vo") {
  const dir = root + `audio/${sub}/`;
  if (!fs.existsSync(dir)) return {};
  return Object.fromEntries(fs.readdirSync(dir).filter((f) => f.endsWith(".mp3"))
    .map((f) => [f, "data:audio/mpeg;base64," + fs.readFileSync(dir + f).toString("base64")]));
}

const before = ["src/config.js", "src/engine.js"];
const scripts = ["src/story.js", "src/art.js", "src/world.js", "src/voice.js", "src/ui.js"];
const art = customArt();
// where each building painting's wall corners, eave, and ridge are (art/facades.json)
const artDir = process.env.ART_DIR ? process.env.ART_DIR.replace(/\/?$/, "/") : root + "art/";
const facadeFit = fs.existsSync(artDir + "facades.json") ? JSON.parse(fs.readFileSync(artDir + "facades.json", "utf8")) : {};
const head = read("src/head.html").replace("/*FONTS*/", fontFaces());
// One page, three ways to get its voice: packed in, from a folder, or none.
const pageWith = (voice, artMap) => [
  head,
  read("src/body.html"),
  `<script type="module">\n${threeInline()}\nconst CUSTOM_ART = ${JSON.stringify(artMap)};\nconst FACADE_FIT = ${JSON.stringify(facadeFit)};\n${voice}\n${before.map(read).join("\n")}\n${storyInline()}\n${scripts.map(read).join("\n")}\nwindow.SettlingUp = { Game, World, Voice, Ambience, auditTotals };\nGame.boot();\n</script>\n`,
].join("\n");
// The prepared art as files for GitHub Pages: assets/art/<kind>/<name>.webp
function artFiles(art) {
  const dir = root + "assets/art/";
  fs.rmSync(dir, { recursive: true, force: true });
  return Object.fromEntries(Object.entries(art).map(([kind, m]) => {
    fs.mkdirSync(dir + kind, { recursive: true });
    return [kind, Object.fromEntries(Object.entries(m).map(([name, uri]) => {
      fs.writeFileSync(`${dir}${kind}/${name}.webp`, Buffer.from(uri.split(",")[1], "base64"));
      return [name, `assets/art/${kind}/${name}.webp`];
    }))];
  }));
}

const audio = audioInline();
const amb = audioInline("amb");
const page = pageWith("", {}); // the Claude artifact: under its size limit, so no voice or painted art
const standalone = pageWith(`const VO_AUDIO = ${JSON.stringify(audio)};\nconst AMB_AUDIO = ${JSON.stringify(amb)};`, art);
const pages = pageWith(`const VO_BASE = "audio/vo/";\nconst AMB_BASE = "audio/amb/";`, artFiles(art));
const doc = (body) => `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>[hidden]{display:none!important}body{margin:0}</style>\n</head>\n<body>\n${body}</body>\n</html>\n`;

fs.mkdirSync(root + "dist", { recursive: true });
fs.writeFileSync(root + "dist/settling-up.html", page);
fs.writeFileSync(root + "Settling-Up.html", doc(standalone));
fs.writeFileSync(root + "index.html", doc(pages));
const kb = (standalone.length / 1024).toFixed(0);
const count = Object.values(art).reduce((s, m) => s + Object.keys(m).length, 0);
console.log(`Built Settling-Up.html (${kb} KB, ${Object.keys(audio).length} voice lines packed in, ${count} custom art file${count === 1 ? "" : "s"}), index.html for GitHub Pages, and dist/settling-up.html.`);
