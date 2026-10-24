// Makes the outdoor sound loops with ElevenLabs sound effects, into audio/amb/.
// Skips loops that already exist; delete a file to make it again. Then sets
// every loop to the same quiet loudness (-30 LUFS), so they sit under the
// voice; that step needs ffmpeg and measures each time, so it can rerun.
// Usage: ELEVENLABS_API_KEY=... node tools/ambience.mjs
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const key = process.env.ELEVENLABS_API_KEY;
if (!key) { console.error("Set ELEVENLABS_API_KEY."); process.exit(1); }

const NO = "No music, no voices, no people, no vehicles, no machines, no modern sounds.";
export const LOOPS = {
  day: `Rural farm field ambience in the American South on a warm spring day, 1870: soft wind moving through grass, songbirds near and far, a mockingbird, a distant crow, a gentle insect hum. Calm and open. ${NO}`,
  fall: `Rural cotton field ambience on a dry autumn afternoon in Mississippi: breeze rustling dry stalks and leaves, a few crows far off, sparse birdsong, a faint wind gust now and then. ${NO}`,
  dusk: `Quiet rural farm on a cold, still winter evening in Mississippi: faint wind, an owl far away, a distant dog barking once, the hush of open country at dusk. Very calm and sparse. ${NO}`,
  rain: `Steady soft rain falling on open farmland, light patter on grass and on a nearby wooden roof, gentle and even, no thunder. ${NO}`,
};

const dir = root + "audio/amb/";
fs.mkdirSync(dir, { recursive: true });
for (const [name, text] of Object.entries(LOOPS)) {
  const file = `${dir}${name}.mp3`;
  if (fs.existsSync(file)) { console.log(`have ${name}`); continue; }
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_64", {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ text, duration_seconds: 22, prompt_influence: 0.45, loop: true, model_id: "eleven_text_to_sound_v2" }),
  });
  if (!res.ok) { console.error(`${name}: ${res.status} ${await res.text()}`); process.exitCode = 1; continue; }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log(`made ${name} (${Math.round(fs.statSync(file).size / 1024)} KB)`);
}

// Level every loop to -30 LUFS, catching peaks below -3 dB.
const TARGET = -30;
for (const name of Object.keys(LOOPS)) {
  const file = `${dir}${name}.mp3`;
  if (!fs.existsSync(file)) continue;
  const probe = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-af", "ebur128=framelog=quiet", "-f", "null", "-"], { encoding: "utf8" });
  if (probe.error) { console.warn("No ffmpeg, so the loops keep their own loudness."); break; }
  const m = /I:\s+(-?[\d.]+) LUFS/.exec(probe.stderr.split("Summary:").pop() || "");
  if (!m) continue;
  const gain = TARGET - parseFloat(m[1]);
  if (Math.abs(gain) < 0.5) { console.log(`${name} is at ${m[1]} LUFS`); continue; }
  const tmp = `${dir}${name}.tmp.mp3`;
  spawnSync("ffmpeg", ["-hide_banner", "-y", "-i", file, "-af", `volume=${gain.toFixed(1)}dB,alimiter=limit=0.7:level=false`, "-b:a", "64k", tmp]);
  fs.renameSync(tmp, file);
  console.log(`${name}: ${m[1]} -> ${TARGET} LUFS`);
}
