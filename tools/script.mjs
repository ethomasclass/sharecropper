// Builds the readable script and the voiceover sheet from story/lines.mjs.
//   node tools/script.mjs   ->  story/SCRIPT.md, story/vo-lines.csv
import fs from "node:fs";
import { SCENES, ARC, TAGS, DYK } from "../story/lines.mjs";

const root = new URL("..", import.meta.url).pathname;
const WPM = 140;                                   // unhurried narration
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const secs = (s) => Math.max(1.5, (words(s) / WPM) * 60);
const voText = (l) => [l.tag || TAGS[l.delivery] || "", l.text].filter(Boolean).join(" ");
const file = (l) => `${l.id.toLowerCase()}_${l.voice}.mp3`;
const all = SCENES.flatMap((s) => s.lines.map((l) => ({ ...l, scene: s })));
const voiced = all.filter((l) => l.voice);

// A typical playthrough hears the spine, one basket line a year, one card and
// its outcome a year, one result and reaction a year, and one ending.
const typical = voiced.filter((l) =>
  /^(PRO|CON|Y18|I18)/.test(l.id) || ["AUD-01", "SET-YES"].includes(l.id) || /^END-STAY/.test(l.id));
const perYear = ["STORE-BASIC", "CARD-RAINS", "SET-OWE", "SET-REACT-SHORT"].map((id) => voiced.find((l) => l.id === id));
const typicalSecs = typical.reduce((s, l) => s + secs(l.text), 0) + 5 * perYear.reduce((s, l) => s + secs(l.text), 0);

const byVoice = (v) => voiced.filter((l) => l.voice === v);
const chars = (ls) => ls.reduce((s, l) => s + voText(l).length, 0);
const mins = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

// ---- CSV for ElevenLabs ------------------------------------------------------
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const csv = [["id", "file", "voice", "delivery", "text_for_elevenlabs", "subtitle", "when", "notes", "est_seconds"].join(",")]
  .concat(voiced.map((l) => [l.id, file(l), l.voice, l.delivery, voText(l), l.text, l.when || l.scene.when || "", l.note || "", secs(l.text).toFixed(1)].map(csvCell).join(",")))
  .join("\n");
fs.writeFileSync(root + "story/vo-lines.csv", csv + "\n");

// ---- Markdown script ------------------------------------------------------------
const label = (l) => l.voice === "papa"
  ? ({ thought: "PAPA (thinking)", narration: "PAPA (narrating)", aloud: "PAPA (aloud)" })[l.delivery]
  : l.voice === "holliday" ? "MR. HOLLIDAY" : l.delivery === "bubble" ? `${l.who} (silent bubble)` : "Silent card";
const fmtLine = (l) => {
  const t = l.delivery === "thought" ? `*${l.text}*` : l.voice ? `"${l.text}"` : l.text;
  const meta = [l.when, l.art ? `art: ${l.art}` : "", l.note].filter(Boolean).join(" · ");
  return `| \`${l.id}\` | ${label(l)} | ${t} | ${meta} |`;
};

let md = `# Settling Up: Script

Two voices only. **Papa** (Robert) is heard as his own thoughts, as the narrator of the cutscenes, and in the few words he says out loud. **Mr. Holliday** speaks out loud. Everyone else reaches the student through Papa, or as a silent speech bubble in the world.

This file is generated from \`story/lines.mjs\` by \`node tools/script.mjs\`. Edit the lines there, then regenerate, and this script, the voiceover sheet (\`story/vo-lines.csv\`), and the timing below stay in step.

## The arc

The supporting question is the spine: *Can you be free if you can't leave?* Each year turns Papa a step further from hope toward knowing, and the gap between what he thinks and what he can say on the porch gets wider.

| Year | Title | What happens to Papa |
| --- | --- | --- |
${ARC.map((a) => `| ${a.year} | ${a.title} | ${a.beat} |`).join("\n")}

**The turn is 1871.** Until then, Papa hopes the numbers are honest. At the scale, Hannah whispers that the wagon felt heavier, and that night her knotted string and the planter's book don't match. From then on Papa knows, and the student knows he knows, every time he says "Yes, sir."

**Threads that run all five years:**

- **Hannah's string:** a knot for every dollar charged. It starts in 1869, doesn't match in 1871, and pays off in the audit ("Hannah's string was right").
- **Lucy's letters:** she asks for school (1870), learns letters on Sundays (1871), reads the store sign (1872), and dreams of naming a mule on their own land (1873). Papa signed with an X. His daughter learns to write their name.
- **The vote:** first vote in December 1869, the 15th Amendment in 1870, his father sold away before he could vote, and the Election Day card in 1871 or 1872.
- **"Next year":** Papa says it every spring. Mr. Holliday says it in the end.

## How the lines work

| Kind | What the student hears or sees | Recording |
| --- | --- | --- |
| PAPA (thinking) | His inner voice, while walking or at a moment in the world. Italic subtitles. | \`${TAGS.thought}\`, close and quiet |
| PAPA (narrating) | Cutscene panels | \`${TAGS.narration}\`, unhurried |
| PAPA (aloud) | The few things he says to Mr. Holliday | Each line has its own tag, such as \`[respectfully]\` |
| MR. HOLLIDAY | Out loud, on the porch and at the contract | No tag; his calm does the work |
| Silent bubble | Family members' words, as paper speech bubbles in the world | Not recorded |
| Silent card | History notes and Lucy's ending | Not recorded |

**Recording rules:**

- Voiced lines never use the family surname or an amount that changes from game to game; numbers appear on the ledger page.
- Fixed game values (sixty dollars, ten percent, five acres) are spoken. Re-record them if \`src/config.js\` changes.
- Papa says "Mr. Holliday" by name only in the prologue and 1869, before the family could have moved to another planter.
- Every word uses standard spelling. The voice comes from word choice and rhythm, never from dialect spelling.

## Size and timing

| | Papa | Mr. Holliday | Total |
| --- | --- | --- | --- |
| Lines | ${byVoice("papa").length} | ${byVoice("holliday").length} | ${voiced.length} |
| Characters (credits for one take) | ${chars(byVoice("papa")).toLocaleString()} | ${chars(byVoice("holliday")).toLocaleString()} | ${chars(voiced).toLocaleString()} |
| Audio if every line is recorded | ${mins(byVoice("papa").reduce((s, l) => s + secs(l.text), 0))} | ${mins(byVoice("holliday").reduce((s, l) => s + secs(l.text), 0))} | ${mins(voiced.reduce((s, l) => s + secs(l.text), 0))} |

- **One playthrough hears about ${mins(typicalSecs)} of voice.** Most of it plays while Papa walks, so it adds little to play time.
- **Three takes of every line** come to about ${(chars(voiced) * 3).toLocaleString()} credits.
- **Play time stays inside 30 minutes** with the cuts in \`node tools/timing.mjs --proposed\`: about 29 minutes as modeled, before the voice that plays during walking.
- **Spoken lines are short.** Lines heard while walking stay between 3 and 8 seconds. Longer moments sit in cutscenes and pages the student moves through.

## Changes this script makes to the game

These come from the history fact-check. Each needs a small code change when the script is wired in.

| Change | Why | Source |
| --- | --- | --- |
| Election Day card in **1871 or 1872** (was 1870 or 1872) | Mississippi held no general election in 1870. It voted in November 1871 (legislature) and November 1872 (president). | Mississippi History Now; 1870–71 U.S. House elections |
| Papa **votes in December 1869**, a week before the first settling up | Mississippi ratified its new constitution November 30 to December 1, 1869. Black men there first voted in 1867. | Mississippi History Now, "The Constitution of 1868" |
| 15th Amendment line: the Constitution now protects a vote **he already had** | The amendment made the right permanent and federal. It didn't create it in Mississippi. | Mississippi History Now, "First Black Legislators" |
| **Panic moves to the fall of 1873** (cutscene before the harvest); no card that summer | Jay Cooke & Co. failed September 18, 1873. | Federal Reserve History |
| **"Left owing" ending replaces the vagrancy arrest** | The 1865 Black Codes were void by 1866–67 and repealed in 1870. In 1869–73 a family that left owing lost the crop and goods to the lien and couldn't get another contract. Arrest-and-hire-out became the real risk after 1876, which a silent card says. | Mississippi Encyclopedia, "Black Codes," "Crop Liens," "Convict Leasing" |
| Sickness card: **chills and fever (malaria)**; drop the Jim Downs citation | Downs covers 1862–1870, mostly smallpox before 1869. | Mississippi Encyclopedia; Vicksburg Post on 1873 yellow fever |
| School card: the **free public school of 1870**, whose cost is lost labor, not tuition | Mississippi's school law of July 1870 made schools free, with short terms. | SPLC timeline; Mississippi History Now |
| No Freedmen's Bureau at the contract signing | The Bureau stopped supervising contracts January 1, 1869. | Smithsonian NMAAHC, Bureau records finding aid |
| Interest wording: "historians estimate **25 to 60 percent or more**" | The "about 60 percent" figure couldn't be confirmed. | Mississippi Encyclopedia, "Crop Liens" |

**Cotton prices.** The real New York prices for the 1869–73 crops ran about $106, $75, $90, $80, and $75 a bale. The game's $110, $95, $85, $85, $60 keep the downward trend and are labeled as game values. Matching them exactly would make 1870 much harsher; that's a tuning choice for later.

## Decisions made

1. **The ending when a family leaves owing is "Lost to the lien."** The planter's claim takes the crop and goods, and no planter in the county will sign Papa. It replaces the spec's vagrancy arrest, which fits 1865–67 and after 1876 but not 1869–73. A final silent card says that after 1876 arrest-and-hire-out became the real risk, so the debrief question "Why didn't you just leave?" still lands.
2. **Papa's father stays** (\`Y1870-06\`). It is brief and offstage, and it is the one line that makes the vote personal. Flag it for the reviewer.
3. **There is no second planter voice.** If the family moves, the new planter's words appear as text only, and Papa's thoughts stay voiced. Only Mr. Holliday is ever heard, so one voice never plays two men.

`;

for (const s of SCENES) {
  md += `\n## ${s.title}\n\n${s.when ? `*${s.when}*\n\n` : ""}| ID | Who | Line | When and notes |\n| --- | --- | --- | --- |\n`;
  md += s.lines.map(fmtLine).join("\n") + "\n";
}

md += `\n## Did You Know notes (on screen, not voiced)\n\nRewritten where the fact-check found problems. The other cards keep their current notes.\n\n| Card | Note | Credit |\n| --- | --- | --- |\n`;
md += Object.entries(DYK).map(([k, v]) => `| ${k} | ${v.text} | ${v.credit} |`).join("\n") + "\n";

md += `
## Recording notes

- **Model:** Eleven v4 (or v3). Neither supports \`<break>\` tags, so pauses are written into the text with ellipses and short sentences.
- **Papa** is one voice recorded two ways: thoughts \`[quietly]\`, close and private; spoken lines careful and respectful. Generate a thought and a spoken line first, and confirm the voice can do both before recording the rest.
- **Mr. Holliday** never raises his voice. If a take sounds like a sneering villain, regenerate it. His menace is his politeness.
- **Files** are named \`<id>_<voice>.mp3\` (for example \`y1871-10_papa.mp3\`). The \`file\` column in \`vo-lines.csv\` has each name. Keep the best take and drop it in \`audio/vo/\`.
- **Format:** \`mp3_44100_64\` or \`mp3_24000_48\`. Speech sounds fine at 48 kbps.
- **Review:** before students hear it, have a Black colleague or community member listen to Papa's lines. Tell students the voices are AI-generated.
`;

fs.writeFileSync(root + "story/SCRIPT.md", md);
console.log(`Wrote story/SCRIPT.md and story/vo-lines.csv: ${voiced.length} voiced lines, ${chars(voiced).toLocaleString()} characters, about ${mins(typicalSecs)} heard per playthrough.`);
