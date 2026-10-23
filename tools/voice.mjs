// Generates voiceover from story/lines.mjs with ElevenLabs.
//   ELEVENLABS_API_KEY=... node tools/voice.mjs PRO-03 Y1871-10 [--out dir] [--takes 2]
//   ELEVENLABS_API_KEY=... node tools/voice.mjs --dialogue SET-OWE,SET-YES,SET-REACT-SHORT
// The key is read from the environment and never stored in the repo.
import fs from "node:fs";
import { SCENES, TAGS, VOICES } from "../story/lines.mjs";

const key = process.env.ELEVENLABS_API_KEY;
if (!key) { console.error("Set ELEVENLABS_API_KEY first."); process.exit(1); }
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : dflt; };
const out = opt("--out", new URL("../audio/vo/", import.meta.url).pathname);
const takes = Number(opt("--takes", "1"));
const dialogue = opt("--dialogue", null);
const MODEL = "eleven_v4";
const FORMAT = "mp3_44100_64";

const lines = Object.fromEntries(SCENES.flatMap((s) => s.lines).filter((l) => l.voice).map((l) => [l.id, l]));
// Text sent to ElevenLabs: the line's own emotion-tagged version if it has one.
const voText = (l) => l.vo || [l.tag || TAGS[l.delivery] || "", l.text].filter(Boolean).join(" ");
fs.mkdirSync(out, { recursive: true });

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
