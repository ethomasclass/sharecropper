// ============================================================================
// VOICE — plays the recorded lines from story/lines.mjs and shows subtitles.
// Audio comes from VO_AUDIO (packed into the standalone file) or VO_BASE (a
// folder next to the page, as on GitHub Pages). With neither, or with the
// voice turned off, lines still show as timed subtitles.
// ============================================================================
const LINES = Object.fromEntries(SCENES.flatMap((s) => s.lines.map((l) => ({ ...l, scene: s.id }))).map((l) => [l.id, l]));
const SCENE_OF = Object.fromEntries(SCENES.map((s) => [s.id, s]));

// Lines for one moment of one scene, in script order. `cue` matches the
// start of each line's `when`.
function cueLines(sceneId, cue) {
  const s = SCENE_OF[sceneId];
  return s ? s.lines.filter((l) => (l.when || "").startsWith(cue)) : [];
}

// Who speaks a silent bubble, as a person in the world.
const BUBBLE_PERSON = { Hannah: "mama", Lucy: "lucy", Sam: "sam", "Mother Ruth": "ruth" };

const Voice = {
  on: (() => { try { return localStorage.getItem("settling-up:voice") !== "off"; } catch { return true; } })(),
  audio: typeof Audio !== "undefined" ? new Audio() : null,
  token: 0,
  hideTimer: null,

  src(l) {
    if (!l.voice) return null;
    const name = `${l.id.toLowerCase()}_${l.voice}.mp3`;
    if (typeof VO_AUDIO !== "undefined" && VO_AUDIO[name]) return VO_AUDIO[name];
    if (typeof VO_BASE !== "undefined" && VO_BASE) return VO_BASE + name;
    return null;
  },

  setOn(on) {
    this.on = on;
    try { localStorage.setItem("settling-up:voice", on ? "on" : "off"); } catch { /* storage off */ }
    if (!on) this.audio?.pause();
  },

  stop() {
    this.token++;
    if (this.audio) { this.audio.pause(); this.audio.removeAttribute("src"); }
    this.caption(null);
  },

  // Play one line. Resolves when it ends, or right away if another line
  // interrupts it. `caption: false` when the words are already on the page;
  // `voiced: false` to show the words without sound.
  play(id, o = {}) {
    const l = LINES[id];
    if (!l) return Promise.resolve();
    const my = ++this.token;
    this.audio?.pause();
    Game.log(this.labelled(l), l.delivery === "thought" ? "thought" : "line");
    if (o.caption !== false) this.caption(l);
    const words = l.text.split(/\s+/).length;
    const readTime = Math.max(1600, (words / 2.4) * 1000);
    const src = o.voiced !== false && this.on ? this.src(l) : null;
    return new Promise((resolve) => {
      const done = () => {
        if (my !== this.token) return resolve();
        clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => { if (my === this.token) this.caption(null); }, 700);
        resolve();
      };
      if (!src || !this.audio) { setTimeout(done, readTime); return; }
      const a = this.audio;
      let finished = false;
      const end = () => { if (!finished) { finished = true; done(); } };
      // A line always finishes, even if the browser never reports the end
      // (no audio device, a stalled file).
      setTimeout(end, readTime * 2 + 3000);
      a.onloadedmetadata = () => { if (isFinite(a.duration)) setTimeout(end, a.duration * 1000 + 1500); };
      a.src = src;
      a.onended = end;
      a.onerror = () => setTimeout(end, readTime);
      a.play().catch(() => setTimeout(end, readTime));
    });
  },

  // Play several lines in order; stops if something else interrupts.
  async seq(ids, o = {}) {
    for (const id of ids) {
      const my = this.token + 1;
      await this.play(id, o);
      if (this.token !== my) return;
      await new Promise((r) => setTimeout(r, 250));
    }
  },

  labelled(l) {
    if (l.voice === "holliday") return `Mr. ${Game.planter()}: "${l.text}"`;
    if (l.delivery === "aloud") return `"${l.text}"`;
    return l.text;
  },

  caption(l) {
    const el = document.getElementById("captions");
    if (!el) return;
    if (!l) { el.hidden = true; return; }
    const who = l.voice === "holliday" ? `Mr. ${Game.planter()}` : l.delivery === "thought" ? "Papa, thinking" : "Papa";
    el.querySelector(".cap-who").textContent = who;
    const what = el.querySelector(".cap-what");
    what.textContent = l.delivery === "thought" ? l.text : `"${l.text}"`;
    what.classList.toggle("thought", l.delivery === "thought");
    el.hidden = false;
  },
};

// Play the moment: bubbles pop up over the family, voiced lines play in
// order. Doesn't block the player; returns a promise for when it's done.
async function cue(sceneId, when, o = {}) {
  for (const l of cueLines(sceneId, when)) {
    if (l.delivery === "bubble") {
      World.say(BUBBLE_PERSON[l.who] || "mama", l.text, 5);
      Game.log(`${l.who}: "${l.text}"`, "line");
      await new Promise((r) => setTimeout(r, 900));
    } else if (l.voice) {
      await Voice.play(l.id, { voiced: l.voice !== "holliday" || Game.planterIsHolliday(), ...o });
    }
  }
}
