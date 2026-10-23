// ============================================================================
// GAME — the flow: join, contract, five crop years, ending, audit.
// What Papa and Mr. Holliday say comes from story/lines.mjs through cue()
// and Voice (voice.js). This file decides when.
// ============================================================================
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function fmt(n) {
  const v = Math.abs(n) < 0.005 ? 0 : n;
  const s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (v < 0 ? "−$" : "$") + s;
}
const fmtLbs = (n) => Math.round(n).toLocaleString("en-US") + " lb";
const fmtBales = (n) => (Math.round(n * 100) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 });

const SAVE_KEY = "settling-up:v2";
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage off */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* storage off */ } },
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const say = (id) => LINES[id]?.text || "";

// Names shown when the pointer rests on someone in the world.
const NAMES = { mama: "Hannah", lucy: "Lucy", sam: "Sam", ruth: "Mother Ruth", holliday: "Mr. {P}", mule: "Old Jack", clerk: "The store clerk", neighbors: "The neighbors", fieldhand: "A neighbor" };
// What each person says when Papa taps them.
const TALK = { mama: "TALK-HANNAH", lucy: "TALK-LUCY", sam: "TALK-SAM", ruth: "TALK-RUTH", holliday: "TALK-HOLLIDAY" };

const Game = {
  g: null,
  y: null,
  els: {},
  corn: new Set(),
  arrivals: {},

  // ---- helpers ---------------------------------------------------------------
  planter() { return PLANTERS[Math.min(this.g?.planterIndex || 0, PLANTERS.length - 1)]; },
  planterIsHolliday() { return !this.g || !this.g.planterIndex; },
  t(s) {
    return String(s || "")
      .replaceAll("{P}", this.planter())
      .replaceAll("{Y}", this.y?.year || "")
      .replaceAll("Mr. Holliday", "Mr. " + this.planter());
  },
  log(text, kind = "story") {
    if (!this.g) return;
    this.g.journal = this.g.journal || [];
    const last = this.g.journal[this.g.journal.length - 1];
    if (last && last.text === text) return;
    this.g.journal.push({ year: this.y?.year || CONFIG.years[0], kind, text });
  },
  save() {
    if (!this.g) return;
    this.g.cur = this.y;
    this.g.cornPlots = [...this.corn];
    store.set(SAVE_KEY, this.g);
    this.renderTopbar();
  },
  sceneOf(y) { return "Y" + y.year; },

  // ---- boot ------------------------------------------------------------------
  async boot() {
    this.els = {
      topbar: $("#topbar"), world: $("#world"), flat: $("#world-flat"), dock: $("#dock"),
      sheet: $("#sheet"), sheetBody: $("#sheet-body"), cut: $("#cutscene"), journal: $("#journal"),
      compass: $("#compass"),
    };
    World.on({
      plot: (i) => this.togglePlot(i),
      progress: (f) => this.progressFn?.(f),
      arrive: (id) => this.onArrive(id),
      interact: (name) => this.onInteract(name),
      nameOf: (id) => NAMES[id] ? this.t(NAMES[id]) : "",
    });
    $("#journal-btn").addEventListener("click", () => this.openJournal());
    $("#journal-close").addEventListener("click", () => { this.els.journal.hidden = true; });
    const vb = $("#voice-btn");
    const showVoice = () => { vb.textContent = Voice.on ? "Voice on" : "Voice off"; vb.setAttribute("aria-pressed", String(Voice.on)); };
    vb.addEventListener("click", () => { Voice.setOn(!Voice.on); showVoice(); });
    showVoice();
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.els.journal.hidden) this.els.journal.hidden = true;
    });
    const setTop = () => document.documentElement.style.setProperty("--top", this.els.topbar.offsetHeight + "px");
    new ResizeObserver(setTop).observe(this.els.topbar);
    setTop();
    this.wirePad();
    this.showFlat("fieldSun");
    await World.init(this.els.world);
    if (World.ok) this.els.flat.hidden = true;
    else document.querySelectorAll(".world-help, #pad").forEach((el) => el.remove());
    this.showJoin();
  },

  // On-screen walking buttons for touchscreens. Hold to walk or turn.
  wirePad() {
    document.querySelectorAll("#pad [data-key]").forEach((b) => {
      const k = b.dataset.key;
      const on = (e) => { e.preventDefault(); World.press(k, true); b.classList.add("down"); };
      const off = () => { World.press(k, false); b.classList.remove("down"); };
      b.addEventListener("pointerdown", on);
      ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => b.addEventListener(ev, off));
      b.addEventListener("contextmenu", (e) => e.preventDefault());
    });
  },

  showFlat(art) {
    if (World.ok) { this.els.flat.hidden = true; return; }
    this.els.flat.hidden = false;
    this.els.flat.innerHTML = sceneSVG(art, "");
  },

  // ---- top bar ------------------------------------------------------------------
  renderTopbar() {
    const g = this.g;
    $("#years").innerHTML = CONFIG.years.map((yr, i) => {
      const done = g && g.years[i];
      const cur = g && !g.ending && i === g.yearIndex;
      const bal = done ? `<span class="chip-bal ${done.ledger.balance < 0 ? "neg" : ""}">${fmt(done.ledger.balance)}</span>` : "";
      return `<li class="${cur ? "cur" : ""} ${done ? "done" : ""}" aria-current="${cur ? "step" : "false"}"><span class="chip-yr">${yr}</span>${bal}</li>`;
    }).join("");
    $("#fam").innerHTML = g ? `The ${esc(g.family)} family${g.ownMule ? ' · <span class="tag">own mule</span>' : ""}${g.education ? ' · <span class="tag">Lucy reads</span>' : ""}` : "";
  },

  // ---- dock, sheet, objectives ----------------------------------------------------
  dock(html) {
    this.els.dock.innerHTML = html;
    this.els.dock.hidden = !html;
  },
  sheet(html, opts = {}) {
    this.els.sheetBody.innerHTML = html;
    this.els.sheet.hidden = false;
    this.els.sheet.classList.toggle("wide", !!opts.wide);
    this.els.sheet.classList.toggle("low", !!opts.low);
    this.els.sheetBody.scrollTop = 0;
    World.setMode("locked");
    World.clearObjective();
    World.hush();
    Voice.caption(null);
    const first = this.els.sheetBody.querySelector("[autofocus], input, button.primary");
    setTimeout(() => first?.focus({ preventScroll: true }), 30);
  },
  closeSheet() {
    this.els.sheet.hidden = true;
    // A focused button left under the sheet would take the next Enter press.
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  },

  // Send Papa somewhere. Resolves when he walks there himself.
  goTo(id, spot, text, r) {
    return new Promise((resolve) => {
      this.arrivals[id] = resolve;
      $("#compass .c-text").textContent = text;
      World.setMode("walk");
      World.objective(id, spot, r);
    });
  },
  onArrive(id) {
    const fn = this.arrivals[id];
    delete this.arrivals[id];
    fn?.();
  },

  // ---- cutscenes: panels are {art, id} for a script line, or {art, text} -----------
  cutscene(panels) {
    return new Promise((resolve) => {
      let i = 0;
      const el = this.els.cut;
      World.setMode("locked");
      World.hush();
      const show = () => {
        const p = panels[i];
        const l = p.id ? LINES[p.id] : null;
        const text = l ? l.text : p.text;
        const art = p.art || l?.art || "fieldSun";
        if (l && l.voice) Voice.play(l.id, { caption: false });
        else { Voice.stop(); this.log(text, "cutscene"); }
        el.innerHTML = `
          <div class="cut-frame"><div class="cut-art">${sceneSVG(art, text)}</div></div>
          <div class="cut-text">
            <p class="cut-cap ${l && l.voice ? "spoken" : "silent"}">${esc(text)}</p>
            <div class="cut-nav">
              <span class="cut-count">${i + 1} / ${panels.length}</span>
              <button class="ghost" data-skip>Skip</button>
              <button class="primary" data-next autofocus>${i === panels.length - 1 ? "Continue" : "Next"}</button>
            </div>
          </div>`;
        el.hidden = false;
        el.querySelector("[data-next]").focus({ preventScroll: true });
      };
      const next = () => { i++; if (i >= panels.length) finish(); else show(); };
      const finish = () => {
        Voice.stop();
        el.hidden = true;
        el.removeEventListener("click", onClick);
        document.removeEventListener("keydown", onKey);
        this.save();
        resolve();
      };
      const onClick = (e) => { if (e.target.closest("[data-skip]")) finish(); else next(); };
      const onKey = (e) => {
        if (["Enter", " ", "ArrowRight"].includes(e.key)) { e.preventDefault(); next(); }
        if (e.key === "Escape") finish();
      };
      el.addEventListener("click", onClick);
      document.addEventListener("keydown", onKey);
      show();
    });
  },
  scenePanels(sceneId) { return SCENE_OF[sceneId].lines.map((l) => ({ id: l.id, art: l.art })); },

  // ---- join -----------------------------------------------------------------------
  showJoin() {
    const saved = store.get(SAVE_KEY);
    const resume = saved && saved.v === 1 && saved.step !== "done" ? saved : null;
    this.dock("");
    this.sheet(`
      <div class="join">
        <p class="eyebrow">Mississippi · 1869 to 1873</p>
        <h1 class="title">Settling Up</h1>
        <p class="lede">You are Robert, a free farmer four years after the Civil War. For five crop years you will plant, buy on credit, and settle up with the planter who keeps the books. Then you will audit those books.</p>
        ${resume ? `<div class="resume"><p>Pick up where you left off: <strong>the ${esc(resume.family)} family</strong>, ${resume.ending ? "the audit" : CONFIG.years[resume.yearIndex]}.</p><button class="primary" id="resume-btn">Continue</button></div>` : ""}
        <form id="join-form" class="join-form" novalidate>
          <label for="fam-name">Family name</label>
          <input id="fam-name" name="family" maxlength="24" autocomplete="off" placeholder="Whitfield" required ${resume ? "" : "autofocus"}>
          <p class="form-err" id="join-err" hidden>Type a family name to begin.</p>
          <button class="primary big" type="submit">${resume ? "Start a new family" : "Begin"}</button>
        </form>
        <div class="controls-help">
          <p><strong>Walk:</strong> W A S D or the arrow keys${World.ok ? ". Hold Shift to hurry." : "."}</p>
          <p><strong>Look:</strong> drag on the screen.</p>
          <p><strong>Talk:</strong> tap a person.</p>
          <p><strong>Listen:</strong> you hear Papa's thoughts and Mr. Holliday. Subtitles are always on.</p>
        </div>
        <p class="fine">About 25 minutes. Follow the red flag to see where Papa goes next. The voices are AI-generated.</p>
      </div>`);
    if (resume) $("#resume-btn").addEventListener("click", () => this.resume(resume));
    $("#join-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fam = $("#fam-name").value.trim().replace(/\s+/g, " ");
      if (!fam) { $("#join-err").hidden = false; $("#fam-name").focus(); return; }
      this.start(fam);
    });
  },

  start(family) {
    if (this.running) return;
    this.g = newGame(family, "");
    this.g.step = "prologue";
    this.g.journal = [];
    this.y = null;
    this.corn = new Set();
    this.save();
    this.closeSheet();
    this.run();
  },
  resume(saved) {
    if (this.running) return;
    this.g = saved;
    this.y = saved.cur || null;
    this.corn = new Set(saved.cornPlots || []);
    this.closeSheet();
    this.run();
  },

  // ---- the main sequence ------------------------------------------------------------
  // Only one story runs at a time.
  async run() {
    if (this.running) return;
    this.running = true;
    const g = this.g;
    this.renderTopbar();
    if (g.step === "prologue") { await this.cutscene(this.scenePanels("PRO")); g.step = "contract"; this.save(); }
    if (g.step === "contract") { await this.contract(); g.step = "store"; this.save(); }
    while (!g.ending) {
      if (!this.y || this.y.year !== currentYear(g)) {
        this.y = blankYear(g);
        this.corn = new Set();
        this.save();
      }
      await this.playYear();
    }
    if (g.step !== "audit" && g.step !== "done") { await this.endingScene(); g.step = "audit"; this.save(); }
    if (g.step === "audit") { await this.audit(); g.step = "done"; this.save(); }
    this.done();
  },

  async playYear() {
    const g = this.g;
    if (!["store", "plant", "event", "harvest", "settle"].includes(g.step)) g.step = "store";
    if (g.step === "store") { this.newSpring(); await this.storeStep(); g.step = "plant"; this.save(); }
    if (g.step === "plant") { await this.plant(); g.step = "event"; this.save(); }
    if (g.step === "event") { await this.eventStep(); g.step = "harvest"; this.save(); }
    if (g.step === "harvest") { await this.harvestStep(); g.step = "settle"; this.save(); }
    if (g.step === "settle") {
      const before = g.yearIndex;
      await this.settleStep();
      if (!g.ending) {
        g.step = "store";
        this.save();
        if (g.yearIndex !== before && currentYear(g) === 1870) await this.cutscene(this.scenePanels("I1870"));
      }
    }
  },

  // A new year opens at the cabin, in spring.
  newSpring() {
    World.place("home");
    World.setSky("spring"); World.setWeather("none"); World.setStage("plan");
    World.setPeople("home"); World.resetWagon();
    World.setFlags({ mule: "planter", school: !!this.g.education });
    World.setCorn(this.corn);
    World.setPlanter(this.planter());
  },

  // ---- the contract ------------------------------------------------------------------
  async contract() {
    World.place("home");
    World.setSky("spring");
    World.setPeople("home");
    this.showFlat("bigHouse");
    this.dock(`<p class="eyebrow">January 1869</p><p class="voice">Walk up the hill to the big house and sign for the year.</p>`);
    cue("CON", "At the cabin");
    setTimeout(() => cue("CON", "Walking up the hill"), 1400);
    await this.goTo("contract", "porch", "Walk up the hill to the big house", 3.4);
    this.dock("");
    this.showFlat("contractDesk");
    await new Promise((resolve) => {
      this.sheet(`
        <p class="eyebrow">January 1869 · The big house</p>
        <h2>The contract</h2>
        <blockquote class="said">${esc(say("CON-02"))}</blockquote>
        <div class="contract">
          <p class="doc-label">Labor contract with freedmen</p>
          ${CONTRACT.lines.map((l, i) => `<p data-clause="${i}">${esc(l)}</p>`).join("")}
          <p class="doc-credit">${esc(CONTRACT.credit)}</p>
        </div>
        <h3>The terms Mr. Holliday reads out loud</h3>
        <dl class="terms">${CONTRACT.terms.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl>
        <p class="voice thought">${esc(say("CON-07"))}</p>
        <p class="game-note">Game values. The contract excerpt is real and adapted. The dollar amounts are simplified.</p>
        <div class="mark-row">
          <button class="mark" id="mark-btn" aria-label="Make your mark">
            <span class="mark-line"></span><span class="mark-x" aria-hidden="true">X</span>
            <span class="mark-cap">Robert ${esc(this.g.family)}, his mark</span>
          </button>
          <p class="hint-small">Tap the line to make your mark.</p>
        </div>`);
      // Mr. Holliday reads; the clause he is reading lights up.
      (async () => {
        for (const id of ["CON-02", "CON-03", "CON-04", "CON-05", "CON-06", "CON-07"]) {
          const clause = CONTRACT.reading[id];
          this.els.sheetBody.querySelectorAll("[data-clause]").forEach((p) => p.classList.toggle("reading", +p.dataset.clause === clause));
          const my = Voice.token + 1;
          await Voice.play(id, { caption: false });
          if (Voice.token !== my) return;
          await wait(250);
        }
        this.els.sheetBody.querySelectorAll("[data-clause]").forEach((p) => p.classList.remove("reading"));
      })();
      $("#mark-btn").addEventListener("click", async (e) => {
        const b = e.currentTarget;
        if (b.classList.contains("made")) return;
        b.classList.add("made");
        this.g.signed = true;
        await Voice.play("CON-08", { caption: false });
        this.closeSheet();
        resolve();
        Voice.play("CON-09");
      });
    });
  },

  // ---- spring: the store, then the field ----------------------------------------------
  async storeStep() {
    const y = this.y;
    this.showFlat("bigHouse");
    this.dock(`<p class="eyebrow">Spring ${y.year}</p><p class="voice">Seed, tools, and food for the year, all on account.</p>`);
    cue(this.sceneOf(y), "Walk to the store");
    await this.goTo("store", "store", `Walk to Mr. ${this.planter()}'s store for seed and supplies`, 2.4);
    const page = cueLines(this.sceneOf(y), "Store page")[0];
    const cornNote = `Every acre of corn you plant takes about ${fmt(CONFIG.cornSavingsCash * (1 + CONFIG.creditMarkup))} off this bill at settling up.`;
    await new Promise((resolve) => {
      const opts = ["lean", "basic", "extra"].map((k) => {
        const b = CONFIG.baskets[k];
        return `<button class="basket" data-basket="${k}">
          <span class="basket-name">${b.label}</span>
          <span class="basket-note">${esc(b.note)}</span>
          <ul class="hand">${STORE_ITEMS[k].map((it) => `<li>${esc(it)}</li>`).join("")}</ul>
          <span class="basket-price"><span class="lbl">On account</span>${fmt(b.credit)}</span>
        </button>`;
      }).join("");
      this.dock("");
      this.sheet(`
        <p class="eyebrow">Spring ${y.year} · ${esc(this.planter())} plantation store</p>
        <h2>Furnish for the year</h2>
        ${page ? `<p class="voice thought">${esc(page.text)}</p>` : ""}
        <div class="baskets">${opts}</div>
        <p class="fine">${esc(cornNote)} Everything goes on account until settling up.</p>
        <p class="fine warn">A lean basket saves money, but a family without shoes and cloth gets sick more easily in a bad year.</p>`, { wide: true });
      if (page) Voice.play(page.id, { caption: false });
      this.els.sheetBody.querySelectorAll("[data-basket]").forEach((b) => b.addEventListener("click", () => {
        y.basket = b.dataset.basket;
        this.closeSheet();
        Voice.play({ lean: "STORE-LEAN", basic: "STORE-BASIC", extra: "STORE-EXTRA" }[y.basket]);
        resolve();
      }));
    });
  },

  async plant() {
    const y = this.y, sc = this.sceneOf(y);
    World.setPeople("home");
    this.showFlat("plow");
    this.dock(`<p class="eyebrow">Spring ${y.year}</p><p class="voice">The seed is on the wagon. Now the field.</p>`);
    cue(sc, "Walk to the field");
    await this.goTo("field", "field", "Walk to the field", 3.2);
    // The split is a choice, made standing at the field's edge.
    await new Promise((resolve) => {
      this.planDone = () => { this.planDone = null; resolve(); };
      World.setMode("plan");
      cue(sc, "Planning the field");
      this.renderPlan();
    });
    y.corn = this.corn.size;
    y.cornPlots = [...this.corn];
    // Then Papa walks the rows. The family follows with the seed.
    World.setStage("sown");
    World.setPeople("field");
    cue(sc, "Planting");
    await this.walkRows("sow", `Spring ${y.year} · Planting`, "Walk the rows to plant. Hannah and the children follow behind with the seed.", "Walk every row of the field", "FIELD-SOWN");
    cue(sc, "Planting done");
  },
  renderPlan() {
    const y = this.y;
    const corn = this.corn.size;
    const est = plantingEstimate(corn, y.year);
    const prev = CONFIG.years.indexOf(y.year) > 0 ? CONFIG.pricePerBale[y.year - 1] : CONFIG.pricePerBale[y.year];
    const grid = Array.from({ length: CONFIG.acres }, (_, i) => {
      const isCorn = this.corn.has(i);
      return `<button class="acre ${isCorn ? "corn" : "cotton"}" data-acre="${i}" aria-pressed="${isCorn}" aria-label="Acre ${i + 1}: ${isCorn ? "corn" : "cotton"}">${isCorn ? "Corn" : "Cotton"}</button>`;
    }).join("");
    this.dock(`
      <p class="eyebrow">Spring ${y.year} · Plan the field</p>
      <p class="how">${World.ok ? "Tap a square in the field, or here, to switch it between cotton and corn." : "Tap a square to switch it between cotton and corn."} Up to ${CONFIG.maxCornAcres} acres of corn.</p>
      <div class="acres" role="group" aria-label="Your 15 acres">${grid}</div>
      <div class="estimate">
        <div><span class="est-k">Cotton</span><span class="est-v">${est.cottonAcres} acres</span><span class="est-s">about ${fmtBales(est.bales)} bales. Your half: ${fmtBales(est.half)}</span></div>
        <div><span class="est-k">Corn</span><span class="est-v">${corn} acres</span><span class="est-s">store bill about ${fmt(est.storeSavings)} lower</span></div>
      </div>
      <p class="fine">Cotton sold for about $${prev} a bale last fall.</p>
      <button class="primary" id="plan-done">Start planting</button>`);
    this.els.dock.querySelectorAll("[data-acre]").forEach((b) => b.addEventListener("click", () => this.togglePlot(+b.dataset.acre)));
    $("#plan-done").addEventListener("click", () => this.planDone?.());
  },
  togglePlot(i) {
    if (!this.planDone) return;
    if (this.corn.has(i)) this.corn.delete(i);
    else if (this.corn.size < CONFIG.maxCornAcres) this.corn.add(i);
    else { Voice.play("FIELD-LIMIT"); this.flashLimit(); return; }
    World.setCorn(this.corn);
    this.renderPlan();
    this.els.dock.querySelector(`[data-acre="${i}"]`)?.focus({ preventScroll: true });
  },
  flashLimit() {
    const el = this.els.dock.querySelector(".how");
    if (!el) return;
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  },

  // Papa walks the rows himself. Once he has walked most of the field, the
  // family finishes the rest.
  walkRows(kind, eyebrow, how, goal, earlyLine) {
    return new Promise((resolve) => {
      const finish = (early) => {
        this.progressFn = null;
        this.els.compass.hidden = true;
        this.els.compass.classList.remove("no-arrow");
        World.finishRows();
        World.setMode("locked");
        if (early) Voice.play(earlyLine);
        resolve();
      };
      if (!World.ok) {
        this.dock(`<p class="eyebrow">${esc(eyebrow)}</p><p class="how">${esc(how)}</p><button class="primary" id="rows-done">Walk the rows</button>`);
        $("#rows-done").addEventListener("click", () => finish(false), { once: true });
        return;
      }
      $("#compass .c-text").textContent = goal;
      this.els.compass.hidden = false;
      this.els.compass.classList.add("no-arrow");
      this.dock(`
        <p class="eyebrow">${esc(eyebrow)}</p>
        <p class="how">${esc(how)}</p>
        <div class="progress" aria-hidden="true"><span id="rows-bar"></span></div>
        <p class="pickcount" id="rows-pct" aria-live="polite">Rows walked: 0%</p>
        <button class="secondary" id="rows-done" disabled>Leave the rest to the family</button>`);
      $("#rows-done").addEventListener("click", () => finish(true));
      this.progressFn = (f) => {
        const pct = Math.round(f * 100);
        $("#rows-bar").style.width = pct + "%";
        $("#rows-pct").textContent = `Rows walked: ${pct}%`;
        if (f >= 0.6) $("#rows-done").disabled = false;
        if (f >= 0.92) finish(false);
      };
      World.setMode(kind);
    });
  },

  // ---- summer: news at the cabin ---------------------------------------------------------
  async eventStep() {
    const y = this.y;
    World.setStage("sown");
    this.dock(`<p class="eyebrow">Spring ${y.year}</p><p class="voice">The planting is done. Home for supper.</p>`);
    cue(this.sceneOf(y), "Walk home to the cabin");
    await this.goTo("cabin", "cabin", "Walk home to the cabin", 3.2);
    World.setSky("summer");
    World.setStage("grow");
    World.setPeople("home");
    if (y.event === "panic") { this.save(); return; } // 1873: the Panic comes in the fall
    await this.eventCard();
    World.setWeather({ rains: "rain", drought: "drought", flood: "flood" }[y.event] || "none");
    if (y.event === "muledies") World.setFlags({ mule: "none" });
    if (y.event === "school") World.setFlags({ school: true });
    this.save();
  },

  // Show the year's card. Papa voices it; the effect and the note are text.
  async eventCard() {
    const y = this.y, g = this.g;
    const card = CARDS[y.event] || CARDS.none;
    this.showFlat(card.art);
    const title = this.t(card.title);
    let line = card.line;
    if (y.event === "muledies" && g.ownMule) line = card.lineOwn;
    if (y.event === "sickness" && y.basket === "extra") line = card.lineExtra;
    if (y.event === "school" && y.year === 1869) line = card.line1869;
    let effect = card.effect;
    if (y.event === "muledies" && g.ownMule) effect = card.effectOwn;
    if (y.event === "sickness" && y.basket === "extra") effect = card.effectExtra;
    let after = null;
    if (y.event === "eggs") { after = y.corn >= CONFIG.eggsMinCorn ? card.lineYes : card.lineNone; if (y.corn < CONFIG.eggsMinCorn) effect = card.effectNone; }
    const muleBlocked = y.event === "mulebuy" && !canBuyMule(g);
    if (muleBlocked) after = card.lineCant;
    const choice = !!card.question && !muleBlocked;
    this.log(title, "card");
    await new Promise((resolve) => {
      this.sheet(`
        <div class="card">
          <div class="card-art">${cardSVG(card.art, title)}</div>
          <div class="card-text">
            <p class="eyebrow">${y.event === "panic" ? "Fall" : "Summer"} ${y.year}</p>
            <h2>${esc(title)}</h2>
            ${line ? `<p class="voice thought">${esc(say(line))}</p>` : ""}
            ${after ? `<p class="voice thought">${esc(say(after))}</p>` : ""}
            ${choice ? `<p class="q">${esc(this.t(card.question))}</p>` : `<p class="effect">${esc(this.t(muleBlocked ? card.cantAfford : effect))}</p>`}
            ${card.dyk ? `<div class="dyk"><span class="dyk-k">Did you know?</span> ${esc(card.dyk)}${card.credit ? ` <span class="credit">${esc(card.credit)}</span>` : ""}</div>` : ""}
            <div class="card-actions" id="card-actions">
              ${choice
                ? `<button class="primary" data-choice="yes">${esc(this.t(card.yes))}</button><button class="secondary" data-choice="no">${esc(this.t(card.no))}</button>`
                : `<button class="primary" data-choice="ok">Continue</button>`}
            </div>
          </div>
        </div>`, { wide: true });
      Voice.seq([line, after].filter(Boolean), { caption: false });
      const finish = () => { Voice.stop(); this.closeSheet(); resolve(); };
      this.els.sheetBody.querySelectorAll("[data-choice]").forEach((b) => b.addEventListener("click", () => {
        const c = b.dataset.choice;
        if (c === "ok") { y.choice = muleBlocked ? "no" : null; finish(); return; }
        y.choice = c;
        if (y.event === "mulebuy" && c === "yes") { y.muleBought = CONFIG.muleCost; g.ownMule = true; }
        if (y.event === "school" && c === "yes") g.education += 1;
        const outLine = c === "yes" ? card.lineYes : card.lineNo;
        const res = this.t(c === "yes" ? card.effectYes : card.effectNo);
        $("#card-actions").innerHTML = `${outLine ? `<p class="voice thought">${esc(say(outLine))}</p>` : ""}<p class="effect">${esc(res)}</p><button class="primary" data-done>Continue</button>`;
        if (outLine) Voice.play(outLine, { caption: false });
        $("#card-actions [data-done]").addEventListener("click", finish);
        $("#card-actions [data-done]").focus();
      }));
    });
    applyEvent(g, y);
  },

  // ---- fall: the harvest, the wagon, the scale ------------------------------------------------
  async harvestStep() {
    const y = this.y, g = this.g, sc = this.sceneOf(y);
    this.dock(`<p class="eyebrow">Summer ${y.year}</p><p class="voice">The cotton grows through the heat. By September the bolls are open.</p>`);
    cue(sc, "Walk to the field in the fall");
    await this.goTo("field-fall", "field", "Walk to the field to bring in the crop", 3.2);
    if (y.event === "panic") {
      // 1873: the best crop they ever grew, then the news from New York.
      await Voice.play("Y1873-07");
      await this.cutscene(this.scenePanels("I1873"));
      await this.eventCard();
    }
    harvest(g, y);
    World.setWeather(y.event === "drought" ? "drought" : y.event === "flood" ? "flood" : "none");
    World.setSky(y.event === "drought" ? "drought" : "fall");
    World.setStage("ripe");
    World.setPeople("field");
    this.showFlat("longRows");
    cue(sc, "Harvest");
    await this.walkRows("harvest", `Fall ${y.year} · Harvest`, "Walk the rows with the family. They pick; you lead.", "Walk the rows with the family", "FIELD-PICKED");
    World.readyWagon(y.totalBales);
    this.dock(`<p class="eyebrow">Fall ${y.year}</p><p class="voice">It takes until frost. The bales are tied and loaded on the wagon.</p>`);
    cue(sc, "Walk to the wagon");
    await this.goTo("wagon", "wagon", "Walk to the loaded wagon at the end of the field", 2.6);
    World.hitchWagon();
    await this.goTo("gin", "ginFront", `Lead the wagon to Mr. ${this.planter()}'s gin scale`, 2.2);
    World.setMode("locked");
    const maxLbs = (CONFIG.acres / CONFIG.acresPerBale) * 1.2 * CONFIG.poundsPerBale;
    await World.weigh(y.scaleLbs, maxLbs);
    this.showFlat("porchLantern");
    this.log(`Mr. ${this.planter()}'s scale read ${fmtLbs(y.scaleLbs)}.`);
    this.dock(`
      <p class="eyebrow">Fall ${y.year} · The scale</p>
      <div class="scale-read">
        <span class="scale-k">Mr. ${esc(this.planter())}'s scale</span>
        <span class="scale-v">${fmtLbs(y.scaleLbs)}</span>
        <span class="scale-s">${fmtBales(y.scaleLbs / CONFIG.poundsPerBale)} bales. Your ${y.shareRate > 0.5 ? "two-thirds" : "half"}: ${fmtBales(y.creditedBales)} bales. Ginning: $${CONFIG.ginningPerBale} a bale.</span>
      </div>
      <button class="primary" id="to-settle">Continue</button>`);
    cue(sc, "At the scale");
    await new Promise((r) => $("#to-settle").addEventListener("click", r, { once: true }));
  },

  onInteract(name) {
    const id = TALK[name];
    if (!id) return;
    const l = LINES[id];
    if (l.voice) Voice.play(id, { voiced: this.planterIsHolliday() });
    else { World.say(name, l.text); this.log(`${l.who}: "${l.text}"`, "line"); }
  },

  // ---- settling up ---------------------------------------------------------------------
  async settleStep() {
    const y = this.y, g = this.g, sc = this.sceneOf(y);
    World.setSky("dusk");
    World.setStage("picked");
    World.setPeople("porch");
    this.showFlat("porchLantern");
    this.dock(`<p class="eyebrow">Christmas ${y.year} · Settling up</p><p class="voice">Every Christmas, the planter reads each family one number.</p>`);
    cue(sc, "Walk to the big house");
    await this.goTo("porch", "porch", "Walk up to the big house to settle up", 3.4);
    await cue(sc, "Arriving at the porch");
    buildLedger(g, y);
    if (!y.evicted && voteEviction(g, y)) { y.evicted = true; y.evictedBy = "vote"; buildLedger(g, y); }
    this.dock("");
    await new Promise((resolve) => {
      this.settleResolve = resolve;
      this.renderSettle(null, true);
    });
  },

  // What Mr. Holliday says, and what Papa thinks, for this year's number.
  settleLines() {
    const y = this.y, g = this.g;
    const bal = y.ledger.balance;
    const prev = g.years[g.yearIndex - 1];
    let said, react;
    if (y.evicted) { said = y.evictedBy === "vote" ? "SET-EVICT-VOTE" : "BOOKS-EVICT"; react = "SET-REACT-EVICT"; }
    else if (bal > 0.005) { said = "SET-AHEAD"; react = "SET-REACT-AHEAD"; }
    else if (bal > -0.005) { said = "SET-EVEN"; react = "SET-REACT-EVEN"; }
    else { said = prev && prev.ledger.balance < 0 ? "SET-OWE-AGAIN" : "SET-OWE"; react = bal > -50 ? "SET-REACT-SHORT" : "SET-REACT-DEEP"; }
    return { said, react };
  },

  renderSettle(revealed, speak) {
    const y = this.y, g = this.g;
    const bal = y.ledger.balance;
    const price = CONFIG.pricePerBale[y.year];
    const { said, react } = this.settleLines();
    const rent = !y.evicted && canRent(g, bal);
    const isLast = g.yearIndex >= CONFIG.years.length - 1;
    const REVEAL = {
      markup: { h: "BOOKS-MARKUP", t: "BOOKS-MARKUP-T", detail: `This year: ${fmt(y.ledger.store + y.ledger.doctor)} on account. Cash price: ${fmt(y.honest.store + y.honest.doctor)}.` },
      weight: { h: "BOOKS-WEIGHT", t: "BOOKS-WEIGHT-T", detail: `Your wagon: ${fmtLbs(y.trueLbs)}. His scale: ${fmtLbs(y.scaleLbs)}.` },
      interest: { h: "BOOKS-INTEREST", t: "BOOKS-INTEREST-T", detail: y.startBalance < 0 ? `This year: ${fmt(y.ledger.interest)} in interest. At 10% it would be ${fmt(-y.startBalance * CONFIG.interestTold)}.` : "You weren't carrying debt this year, but it will apply the next time you are." },
    };
    const r = revealed ? REVEAL[revealed] : null;
    const nextPlanter = PLANTERS[Math.min(g.planterIndex + 1, PLANTERS.length - 1)];
    let actions;
    if (y.evicted) {
      actions = `<button class="primary" data-act="move">${isLast ? "Load the wagon" : `Move to the ${esc(nextPlanter)} place`}</button>
        <p class="fine">Your debt follows you. Mr. ${esc(nextPlanter)} pays it off and puts it on your new account.</p>`;
    } else {
      actions = `
        ${rent ? `<button class="primary" data-act="rent">Rent a farm</button>` : ""}
        <button class="${rent ? "secondary" : "primary"}" data-act="stay">${isLast ? "Stay on" : `Stay and sign for ${y.year + 1}`}</button>
        <button class="secondary" data-act="leave">Leave the ${esc(this.planter())} place</button>
        ${y.demanded ? "" : `<button class="secondary danger" data-act="demand">Demand to see the books</button>`}`;
    }
    this.sheet(`
      <div class="settle">
        <p class="eyebrow">Christmas ${y.year} · ${esc(this.planter())}'s porch</p>
        <p class="sold">He sold the cotton at <strong>$${price}</strong> a bale${y.event === "panic" ? ", after the Panic" : ""}.</p>
        <blockquote class="said">${esc(say(r ? r.h : said))}</blockquote>
        <div class="number ${bal < 0 ? "neg" : ""}" aria-label="Balance ${fmt(bal)}">${fmt(bal)}</div>
        ${r ? `<div class="reveal"><p class="eyebrow">One line from his book</p><p class="figure-line">${esc(r.detail)}</p></div>` : ""}
        <p class="voice thought">${esc(say(r ? r.t : react))}</p>
        ${rent ? `<p class="voice">You have the savings, and the mule is yours. A man two miles off has land to rent.</p>` : ""}
        <div class="settle-actions">${actions}</div>
        ${!y.evicted && !y.demanded ? `<p class="fine">Demanding the books shows one hidden line. He may put you off the place (1 in 3).</p>` : ""}
      </div>`, { low: true });
    const voiced = this.planterIsHolliday();
    if (speak) {
      (async () => {
        const my = Voice.token + 1;
        await Voice.play(r ? r.h : said, { caption: false, voiced });
        if (Voice.token !== my) return;
        await wait(300);
        Voice.play(r ? r.t : react, { caption: false });
      })();
    }
    this.els.sheetBody.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => this.settleAct(b.dataset.act)));
  },

  async settleAct(act) {
    const y = this.y, g = this.g;
    const voiced = this.planterIsHolliday();
    if (act === "demand") {
      this.els.sheetBody.querySelectorAll("[data-act]").forEach((b) => { b.disabled = true; });
      await Voice.play("BOOKS-01", { caption: false });
      await Voice.play("BOOKS-02", { caption: false });
      const res = demandBooks(g, y);
      this.save();
      this.renderSettle(res.evicted ? null : res.item, true);
      return;
    }
    if (act === "leave" && y.ledger.balance < 0 && !this.confirmLeave) {
      this.confirmLeave = true;
      const box = this.els.sheetBody.querySelector(".settle-actions");
      box.innerHTML = `<p class="voice thought">${esc(say("LEAVE-OWING"))}</p>
        <button class="primary" data-act="stay">Stay</button><button class="secondary danger" data-act="leave">Leave anyway</button>`;
      Voice.play("LEAVE-OWING", { caption: false });
      box.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => this.settleAct(b.dataset.act)));
      return;
    }
    this.confirmLeave = false;
    const decision = act === "move" ? "stay" : act;
    const owed = y.ledger.balance < 0;
    closeYear(g, y, decision);
    this.log(`Settled ${y.year}: ${fmt(y.ledger.balance)}.`, "settle");
    this.closeSheet();
    this.save();
    if (decision === "stay" && !y.evicted) await Voice.play("SET-YES");
    else if (decision === "rent") await Voice.play("RENT-01", { voiced });
    else if (decision === "leave" && !owed) await Voice.play("LEAVE-FREE", { voiced });
    if (!g.ending) cue(this.sceneOf(y), "Leaving the porch");
    const done = this.settleResolve;
    this.settleResolve = null;
    done?.();
  },

  // ---- ending ------------------------------------------------------------------------------
  async endingScene() {
    const g = this.g;
    World.setSky("dusk");
    const ep = g.education ? EPILOGUE.school : EPILOGUE.noschool;
    const panels = ENDINGS[g.ending].lines.map((id) => ({ id, art: LINES[id].art || "emptyRoad" }));
    panels.push({ id: ep.id, art: ep.art });
    await this.cutscene(panels);
  },

  // ---- the audit -----------------------------------------------------------------------------
  audit() {
    return new Promise((resolve) => {
      const g = this.g;
      const a = auditTotals(g);
      this.dock("");
      World.setMode("locked");
      const ys = g.years.filter(Boolean);
      const row = (label, f, cls = "") => `<tr class="${cls}"><th scope="row">${label}</th>${ys.map((y) => f(y)).join("")}</tr>`;
      const pair = (p, h) => {
        const diff = Math.abs(p - h) > 0.005;
        return `<td><span class="p">${fmt(p)}</span><span class="h ${diff ? "diff" : ""}">${fmt(h)}</span></td>`;
      };
      const table = `
        <div class="ledger-wrap"><table class="ledger">
          <thead><tr><th scope="col"></th>${ys.map((y) => `<th scope="col">${y.year}</th>`).join("")}</tr>
          <tr class="key"><th></th>${ys.map(() => `<th><span class="p">His book</span><span class="h">Honest</span></th>`).join("")}</tr></thead>
          <tbody>
            ${row("Cotton credited", (y) => `<td><span class="p">${fmtBales(y.evicted ? 0 : y.creditedBales)} bales</span><span class="h diff">${fmtBales(y.evicted ? 0 : y.familyBales)} bales</span></td>`)}
            ${row("Your share", (y) => pair(y.ledger.share, y.honest.share))}
            ${row("Store goods", (y) => pair(y.ledger.store, y.honest.store))}
            ${row("Doctor", (y) => pair(y.ledger.doctor, y.honest.doctor))}
            ${row("Mule", (y) => pair(y.ledger.mule + y.muleBought, y.honest.mule + y.muleBought))}
            ${row("Ginning", (y) => pair(y.ledger.ginning, y.honest.ginning))}
            ${row("Interest", (y) => pair(y.ledger.interest, y.honest.interest))}
            ${row("Eggs sold", (y) => pair(y.eggs, y.eggs))}
            ${row("Moving", (y) => pair(y.ledger.leave, y.honest.leave))}
            ${row("Balance", (y) => pair(y.ledger.balance, y.honest.balance), "total")}
          </tbody>
        </table></div>`;
      const qs = [
        { id: "q1", label: "How much did the credit markup cost you over the years you played?", unit: "$", answer: a.markup, tol: Math.max(5, a.markup * 0.05), show: fmt(a.markup) },
        { id: "q2", label: "How much of your cotton went missing at the gin, in pounds?", unit: "lb", answer: a.missingLbs, tol: Math.max(20, a.missingLbs * 0.05), show: `${fmtLbs(a.missingLbs)}, worth ${fmt(a.missingValue)}` },
      ];
      this.sheet(`
        <div class="audit">
          <p class="eyebrow">The audit · ${esc(ENDINGS[g.ending].title)}</p>
          <h2>Open the books</h2>
          <p class="voice thought">${esc(say("AUD-01"))}</p>
          <p>You are the auditors now. Here is the planter's book next to what the family really bought, at cash prices, with honest weights.</p>
          ${table}
          <p class="fine">Red figures in the honest column are where his book and the truth part ways. Game values, rebuilt from your own play. This is a reconstruction, not a primary source.</p>
          <blockquote class="source">${esc(say("AUD-QUOTE"))}</blockquote>
          <div class="findings">
            <div class="finding"><span class="f-k">You were told</span><span class="f-v">10% interest</span></div>
            <div class="finding"><span class="f-k">He charged</span><span class="f-v neg">25% interest</span><span class="f-s">${fmt(a.extraInterest)} extra</span></div>
            <div class="finding"><span class="f-k">His final number</span><span class="f-v ${a.finalPlanter < 0 ? "neg" : ""}">${fmt(a.finalPlanter)}</span></div>
            <div class="finding"><span class="f-k">Honest final number</span><span class="f-v ${a.finalHonest < 0 ? "neg" : ""}">${fmt(a.finalHonest)}</span></div>
          </div>
          <h3>Fill in the blanks</h3>
          <form id="audit-form" class="blanks" novalidate>
            ${qs.map((q, i) => `
              <div class="blank" data-q="${q.id}">
                <label for="${q.id}"><span class="qn">${i + 1}</span>${esc(q.label)}</label>
                <div class="blank-row"><span class="unit">${q.unit === "$" ? "$" : ""}</span><input id="${q.id}" inputmode="decimal" autocomplete="off"><span class="unit">${q.unit === "lb" ? "lb" : ""}</span></div>
                <p class="blank-fb" aria-live="polite"></p>
              </div>`).join("")}
            <div class="blank" data-q="q3">
              <fieldset><legend><span class="qn">3</span>Without the hidden charges, would you have reached the $${CONFIG.rentSavings} needed to rent?</legend>
              <div class="yn"><label><input type="radio" name="q3" value="yes"> Yes</label><label><input type="radio" name="q3" value="no"> No</label></div></fieldset>
              <p class="blank-fb" aria-live="polite"></p>
            </div>
            <button class="primary" type="submit">Check my answers</button>
          </form>
          <div id="audit-next" hidden><button class="primary big" id="audit-done">Finish</button></div>
        </div>`, { wide: true });
      Voice.play("AUD-01", { caption: false });
      let tries = 0;
      $("#audit-form").addEventListener("submit", (e) => {
        e.preventDefault();
        tries++;
        let right = 0;
        qs.forEach((q) => {
          const box = this.els.sheetBody.querySelector(`[data-q="${q.id}"]`);
          const val = parseFloat(String($("#" + q.id).value).replace(/[^0-9.\-]/g, ""));
          const ok = !isNaN(val) && Math.abs(val - q.answer) <= q.tol;
          if (ok) right++;
          box.classList.toggle("right", ok);
          box.querySelector(".blank-fb").textContent = ok ? `Right: ${q.show}.` : tries >= 2 ? `The books say ${q.show}.` : "Not quite. Look for the red figures and add them up.";
        });
        const box3 = this.els.sheetBody.querySelector('[data-q="q3"]');
        const pick = this.els.sheetBody.querySelector('input[name="q3"]:checked')?.value;
        const ok3 = pick === (a.wouldRent ? "yes" : "no");
        if (ok3) right++;
        box3.classList.toggle("right", ok3);
        box3.querySelector(".blank-fb").textContent = ok3 || tries >= 2
          ? `With honest books you would have ended at ${fmt(a.finalHonest)}, so ${a.wouldRent ? "yes, you would have had enough" : "no, not even then"}.`
          : "Not quite. Compare the honest final number with $" + CONFIG.rentSavings + ".";
        g.auditAnswers = { tries, right };
        if (right === 3 || tries >= 2) $("#audit-next").hidden = false;
        this.save();
      });
      $("#audit-done").addEventListener("click", () => { Voice.stop(); this.closeSheet(); resolve(); });
    });
  },

  done() {
    const g = this.g;
    const a = auditTotals(g);
    World.setMode("walk");
    World.setSky("dusk");
    this.dock("");
    this.sheet(`
      <div class="final">
        <p class="eyebrow">The ${esc(g.family)} family · ${esc(ENDINGS[g.ending].title)}</p>
        <h2>${esc(EXIT_TICKET.question)}</h2>
        <p>${esc(EXIT_TICKET.prompt)}</p>
        <p>${esc(EXIT_TICKET.tracker)}</p>
        <div class="report">
          <p class="eyebrow">Your numbers</p>
          <p class="report-line"><strong>${esc(g.family)}</strong> · his book ${fmt(a.finalPlanter)} · honest ${fmt(a.finalHonest)} · ${esc(ENDINGS[g.ending].title)}</p>
          <p class="fine">Markup ${fmt(a.markup)} · Cotton missing ${fmtLbs(a.missingLbs)} (${fmt(a.missingValue)}) · Extra interest ${fmt(a.extraInterest)}</p>
        </div>
        <div class="final-actions">
          <button class="secondary" id="final-journal">Read the journal</button>
          <button class="secondary" id="final-new">Play another family</button>
        </div>
      </div>`);
    $("#final-journal").addEventListener("click", () => this.openJournal());
    $("#final-new").addEventListener("click", () => { store.del(SAVE_KEY); this.g = null; this.y = null; this.renderTopbar(); this.showJoin(); });
  },

  openJournal() {
    const j = (this.g && this.g.journal) || [];
    const byYear = {};
    j.forEach((e) => { (byYear[e.year] = byYear[e.year] || []).push(e); });
    $("#journal-list").innerHTML = j.length
      ? Object.entries(byYear).map(([yr, es]) => `<section><h3>${yr}</h3>${es.map((e) => `<p class="j-${e.kind}">${esc(e.text)}</p>`).join("")}</section>`).join("")
      : `<p class="fine">Everything said in the game shows up here, so you can look back at anything you missed.</p>`;
    this.els.journal.hidden = false;
    $("#journal-close").focus();
  },
};
