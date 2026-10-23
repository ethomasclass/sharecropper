// Generates voiceover from story/lines.mjs with ElevenLabs.
//   ELEVENLABS_API_KEY=... node tools/voice.mjs PRO-03 Y1871-10 [--out dir] [--takes 2]
//   ELEVENLABS_API_KEY=... node tools/voice.mjs --dialogue SET-OWE,SET-YES,SET-REACT-SHORT
//   ELEVENLABS_API_KEY=... node tools/voice.mjs --all [--check]   every line, skipping files that exist;
//     --check transcribes each new file and reports lines that don't match the script
// The key is read from the environment and never stored in the repo.
import fs from "node:fs";
import { SCENES, TAGS, VOICES } from "../story/lines.mjs";
import { VO } from "../story/vo.mjs";

const key = process.env.ELEVENLABS_API_KEY;
if (!key) { console.error("Set ELEVENLABS_API_KEY first."); process.exit(1); }
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : dflt; };
const out = opt("--out", new URL("../audio/vo/", import.meta.url).pathname);
const takes = Number(opt("--takes", "1"));
const dialogue = opt("--dialogue", null);
const all = args.includes("--all");
const check = args.includes("--check");
for (const f of ["--all", "--check"]) if (args.includes(f)) args.splice(args.indexOf(f), 1);
const MODEL = "eleven_v4";
const FORMAT = "mp3_44100_64";

const lines = Object.fromEntries(SCENES.flatMap((s) => s.lines).filter((l) => l.voice).map((l) => [l.id, l]));
// Text sent to ElevenLabs: the line's own emotion-tagged version if it has one.
const voText = (l) => VO[l.id] || [l.tag || TAGS[l.delivery] || "", l.text].filter(Boolean).join(" ");
fs.mkdirSync(out, { recursive: true });

const fileFor = (l) => `${l.id.toLowerCase()}_${l.voice}.mp3`;

// Speech-to-text, to confirm a recording says the script's words.
async function transcribe(path) {
  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("file", new Blob([fs.readFileSync(path)], { type: "audio/mpeg" }), "line.mp3");
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body: form });
  if (!res.ok) return `(transcription failed: ${res.status})`;
  return (await res.json()).text || "";
}
// Share of the script's words that were heard, in order-insensitive terms.
function overlap(script, heard) {
  const norm = (t) => t.toLowerCase().replace(/\[[^\]]*\]/g, " ").replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);
  const want = norm(script), got = norm(heard);
  const bag = new Map();
  got.forEach((w) => bag.set(w, (bag.get(w) || 0) + 1));
  let hit = 0;
  want.forEach((w) => { if (bag.get(w)) { hit++; bag.set(w, bag.get(w) - 1); } });
  return want.length ? hit / want.length : 1;
}

async function post(path, body) {
  const res = await fetch(`https://api.elevenlabs.io/v1/${path}?output_format=${FORMAT}`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

if (dialogue) {
  const ids = dialogue.split(",");
  const inputs = ids.map((id) => ({ text: voText(lines[id]), voice_id: VOICES[lines[id].voice] }));
  const audio = await post("text-to-dialogue", { model_id: MODEL, inputs });
  const name = `dialogue_${ids.join("+").toLowerCase()}.mp3`;
  fs.writeFileSync(out + name, audio);
  console.log(`${name}  ${(audio.length / 1024).toFixed(0)} KB  ${inputs.reduce((s, i) => s + i.text.length, 0)} characters`);
} else if (all) {
  const todo = Object.values(lines).filter((l) => !fs.existsSync(out + fileFor(l)));
  console.log(`${todo.length} lines to record, ${todo.reduce((s, l) => s + voText(l).length, 0).toLocaleString()} characters`);
  const report = [];
  let next = 0;
  async function worker() {
    while (next < todo.length) {
      const l = todo[next++];
      try {
        const audio = await post(`text-to-speech/${VOICES[l.voice]}`, { text: voText(l), model_id: MODEL });
        fs.writeFileSync(out + fileFor(l), audio);
        let note = "";
        if (check) {
          const heard = await transcribe(out + fileFor(l));
          const score = overlap(l.text, heard);
          note = score < 0.85 ? `  CHECK: heard "${heard}"` : "";
          report.push({ id: l.id, score: Math.round(score * 100), heard });
        }
        console.log(`${fileFor(l)}${note}`);
      } catch (e) {
        console.log(`${l.id} FAILED: ${e.message.slice(0, 200)}`);
      }
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  if (check) fs.writeFileSync(out + "check.json", JSON.stringify(report, null, 1));
} else {
  for (const id of args) {
    const l = lines[id];
    if (!l) { console.warn(`No voiced line ${id}`); continue; }
    for (let t = 1; t <= takes; t++) {
      const audio = await post(`text-to-speech/${VOICES[l.voice]}`, { text: voText(l), model_id: MODEL });
      const name = `${id.toLowerCase()}_${l.voice}${takes > 1 ? `_take${t}` : ""}.mp3`;
      fs.writeFileSync(out + name, audio);
      console.log(`${name}  ${(audio.length / 1024).toFixed(0)} KB  ${voText(l).length} characters  "${voText(l)}"`);
    }
  }
}
