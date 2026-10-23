// Assembles the game into one HTML page.
//   dist/settling-up.html  the page as published (no doctype; the host adds it)
//   Settling-Up.html       a standalone copy teachers can download and open
import fs from "node:fs";

const root = new URL("..", import.meta.url).pathname;
const read = (f) => fs.readFileSync(root + f, "utf8");
const scripts = ["src/config.js", "src/engine.js", "src/story.js", "src/art.js", "src/world.js", "src/ui.js", "src/teacher.js"];

const page = [
  read("src/head.html"),
  read("src/body.html"),
  `<script type="module">\n${scripts.map(read).join("\n")}\nwindow.SettlingUp = { Game, World, Teacher, auditTotals };\nGame.boot();\n</script>\n`,
].join("\n");

fs.mkdirSync(root + "dist", { recursive: true });
fs.writeFileSync(root + "dist/settling-up.html", page);
fs.writeFileSync(
  root + "Settling-Up.html",
  `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>[hidden]{display:none!important}body{margin:0}</style>\n</head>\n<body>\n${page}</body>\n</html>\n`
);
console.log(`Built dist/settling-up.html (${(page.length / 1024).toFixed(0)} KB) and Settling-Up.html`);
