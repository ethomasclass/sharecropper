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
    if (src) Ambience.duck(true);
    return new Promise((resolve) => {
      const done = () => {
        if (my === this.token) Ambience.duck(false);
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

// ============================================================================
// AMBIENCE — outdoor sound loops (audio/amb/, made by tools/ambience.mjs):
// day, fall, dusk, and rain. Looped gaplessly with Web Audio, faded from one
// to the next as the season and weather change, and turned down under the
// voice. Browsers only allow sound after a tap or key, so start() waits.
// ============================================================================
const Ambience = {
  on: (() => { try { return localStorage.getItem("settling-up:sound") !== "off"; } catch { return true; } })(),
  LEVEL: 0.6,
  ctx: null, master: null, ducker: null, cur: null, want: null, buffers: {},

  src(name) {
    const file = name + ".mp3";
    if (typeof AMB_AUDIO !== "undefined" && AMB_AUDIO[file]) return AMB_AUDIO[file];
    if (typeof AMB_BASE !== "undefined" && AMB_BASE) return AMB_BASE + file;
    return null;
  },
  start() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || !this.src("day")) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.ducker = this.ctx.createGain();
      this.master.gain.value = this.on ? 1 : 0;
      this.master.connect(this.ducker).connect(this.ctx.destination);
    } catch { this.ctx = null; return; }
    if (this.want) this.play(this.want);
  },
  async load(name) {
    if (!this.buffers[name]) {
      this.buffers[name] = fetch(this.src(name)).then((r) => r.arrayBuffer())
        .then((b) => new Promise((ok, no) => this.ctx.decodeAudioData(b, ok, no))).catch(() => null);
    }
    return this.buffers[name];
  },
  set(name) {
    this.want = name;
    if (this.ctx) this.play(name);
  },
  async play(name) {
    if (this.cur && this.cur.name === name) return;
    const buf = await this.load(name);
    if (!buf || this.want !== name || (this.cur && this.cur.name === name)) return;
    const t = this.ctx.currentTime, fade = 2.5;
    const node = this.ctx.createBufferSource();
    node.buffer = buf; node.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(this.LEVEL, t + fade);
    node.connect(gain).connect(this.master);
    node.start(t, Math.random() * buf.duration);   // start anywhere, so it never sounds the same twice
    const old = this.cur;
    if (old) {
      old.gain.gain.setValueAtTime(old.gain.gain.value, t);
      old.gain.gain.linearRampToValueAtTime(0, t + fade);
      old.node.stop(t + fade + 0.1);
    }
    this.cur = { name, node, gain };
  },
  // quieter while someone speaks
  duck(down) {
    if (!this.ctx) return;
    this.ducker.gain.setTargetAtTime(down ? 0.4 : 1, this.ctx.currentTime, down ? 0.15 : 0.6);
  },
  setOn(on) {
    this.on = on;
    try { localStorage.setItem("settling-up:sound", on ? "on" : "off"); } catch { /* storage off */ }
    if (this.ctx) this.master.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.3);
  },
  // the loop for a sky and weather (World tells us)
  forSky(sky, weather) {
    if (weather === "rain") return "rain";
    if (sky === "dusk") return "dusk";
    if (sky === "fall" || sky === "drought") return "fall";
    return "day";
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
