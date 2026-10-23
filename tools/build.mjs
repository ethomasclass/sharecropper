// Assembles the whole game into one self-contained HTML page: the 3D
// library, the fonts, and any art you added in art/ are all packed inside,
// so it runs offline with no accounts and nothing to install.
//   dist/settling-up.html  the page body (for publishing as a Claude artifact)
//   Settling-Up.html       the standalone file to download, share, and open
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

const scripts = ["src/config.js", "src/engine.js", "src/story.js", "src/art.js", "src/world.js", "src/ui.js"];
const art = customArt();
const head = read("src/head.html").replace("/*FONTS*/", fontFaces());
const page = [
  head,
  read("src/body.html"),
  `<script type="module">\n${threeInline()}\nconst CUSTOM_ART = ${JSON.stringify(art)};\n${scripts.map(read).join("\n")}\nwindow.SettlingUp = { Game, World, auditTotals };\nGame.boot();\n</script>\n`,
].join("\n");

fs.mkdirSync(root + "dist", { recursive: true });
fs.writeFileSync(root + "dist/settling-up.html", page);
fs.writeFileSync(
  root + "Settling-Up.html",
  `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>[hidden]{display:none!important}body{margin:0}</style>\n</head>\n<body>\n${page}</body>\n</html>\n`
);
const kb = (page.length / 1024).toFixed(0);
const count = Object.values(art).reduce((s, m) => s + Object.keys(m).length, 0);
console.log(`Built Settling-Up.html (${kb} KB, ${count} custom art file${count === 1 ? "" : "s"}).`);
