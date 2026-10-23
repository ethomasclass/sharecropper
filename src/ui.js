// ============================================================================
// GAME — the flow: join, contract, five crop years, ending, audit.
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

const SAVE_KEY = "settling-up:v1";
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage off */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* storage off */ } },
};

const Game = {
  g: null,
  y: null,
  classroom: null,       // { mode, year, revealed } from the teacher, when live
  els: {},
  corn: new Set(),

  // ---- text helpers -------------------------------------------------------
  planter() { return PLANTERS[Math.min(this.g?.planterIndex || 0, PLANTERS.length - 1)]; },
  t(s) {
    return String(s || "")
      .replaceAll("{F}", this.g?.family || "")
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
    Sync.saveFamily(this.g);
    this.renderTopbar();
  },

  // ---- boot ----------------------------------------------------------------
  async boot() {
    this.els = {
      topbar: $("#topbar"), world: $("#world"), flat: $("#world-flat"), dock: $("#dock"),
      sheet: $("#sheet"), sheetBody: $("#sheet-body"), cut: $("#cutscene"), journal: $("#journal"),
      teacher: $("#teacher"),
    };
    World.on({
      plot: (i) => this.togglePlot(i),
      harvest: (f) => this.onHarvest(f),
      interact: (name) => this.onInteract(name),
      planterName: () => this.planter(),
    });
    $("#journal-btn").addEventListener("click", () => this.openJournal());
    const setTop = () => document.documentElement.style.setProperty("--top", this.els.topbar.offsetHeight + "px");
    new ResizeObserver(setTop).observe(this.els.topbar);
    setTop();
    $("#journal-close").addEventListener("click", () => { this.els.journal.hidden = true; });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.els.journal.hidden) this.els.journal.hidden = true;
    });
    this.showFlat("fieldSun");
    const worldReady = World.init(this.els.world);
    Sync.init();
    if (location.hash === "#teacher") { Teacher.open(); return; }
    await worldReady;
    if (World.ok) this.els.flat.hidden = true;
    else document.querySelector(".world-help")?.remove();
    this.showJoin();
  },

  showFlat(art) {
    if (World.ok) { this.els.flat.hidden = true; return; }
    this.els.flat.hidden = false;
    this.els.flat.innerHTML = sceneSVG(art, "");
  },

  // ---- top bar ------------------------------------------------------------
  renderTopbar() {
    const g = this.g;
    const yrs = CONFIG.years.map((yr, i) => {
      const done = g && g.years[i];
      const cur = g && !g.ending && i === g.yearIndex;
      const bal = done ? `<span class="chip-bal ${done.ledger.balance < 0 ? "neg" : ""}">${fmt(done.ledger.balance)}</span>` : "";
      return `<li class="${cur ? "cur" : ""} ${done ? "done" : ""}" aria-current="${cur ? "step" : "false"}"><span class="chip-yr">${yr}</span>${bal}</li>`;
    }).join("");
    $("#years").innerHTML = yrs;
    $("#fam").innerHTML = g ? `The ${esc(g.family)} family${g.ownMule ? ' · <span class="tag">own mule</span>' : ""}${g.education ? ' · <span class="tag">Lucy reads</span>' : ""}` : "";
  },

  // ---- dock: the small card in the corner --------------------------------
  dock(html) {
    this.els.dock.innerHTML = html;
    this.els.dock.hidden = !html;
  },
  sheet(html, opts = {}) {
    this.els.sheetBody.innerHTML = html;
    this.els.sheet.hidden = false;
    this.els.sheet.classList.toggle("wide", !!opts.wide);
    this.els.sheet.classList.toggle("low", !!opts.low);
    this.els.sheet.scrollTop = 0;
    this.els.sheetBody.scrollTop = 0;
    World.setMode("locked");
    const first = this.els.sheetBody.querySelector("[autofocus], input, button.primary");
    setTimeout(() => first?.focus({ preventScroll: true }), 30);
  },
  closeSheet() { this.els.sheet.hidden = true; },

  // ---- cutscenes -----------------------------------------------------------
  cutscene(panels) {
    return new Promise((resolve) => {
      let i = 0;
      const el = this.els.cut;
      World.setMode("locked");
      const show = () => {
        const p = panels[i];
        const cap = this.t(p.caption), sub = this.t(p.sub || "");
        this.log(cap + (sub ? " " + sub : ""), "cutscene");
        el.innerHTML = `
          <div class="cut-frame"><div class="cut-art">${sceneSVG(p.art, cap)}</div></div>
          <div class="cut-text">
            <p class="cut-cap">${esc(cap)}</p>
            ${sub ? `<p class="cut-sub">${esc(sub)}</p>` : ""}
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
        el.hidden = true;
        el.removeEventListener("click", onClick);
        document.removeEventListener("keydown", onKey);
        this.save();
        resolve();
      };
      const onClick = (e) => {
        if (e.target.closest("[data-skip]")) { finish(); return; }
        next();
      };
      const onKey = (e) => {
        if (["Enter", " ", "ArrowRight"].includes(e.key)) { e.preventDefault(); next(); }
        if (e.key === "Escape") finish();
      };
      el.addEventListener("click", onClick);
      document.addEventListener("keydown", onKey);
      show();
    });
  },

  // ---- join -----------------------------------------------------------------
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
          <label for="class-code">Class code <span class="opt">from your teacher, if you have one</span></label>
          <input id="class-code" name="code" maxlength="12" autocomplete="off" placeholder="e.g. P3" style="text-transform:uppercase">
          <p class="form-err" id="join-err" hidden>Type a family name to begin.</p>
          <button class="primary big" type="submit">${resume ? "Start a new family" : "Begin"}</button>
        </form>
        <p class="fine">About 25 minutes. One device per family of 2 or 3 is fine: talk each choice through. <a href="#teacher" id="teacher-link">Teacher board</a></p>
      </div>`);
    $("#teacher-link").addEventListener("click", (e) => { e.preventDefault(); location.hash = "teacher"; Teacher.open(); });
    if (resume) $("#resume-btn").addEventListener("click", () => this.resume(resume));
    $("#join-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fam = $("#fam-name").value.trim().replace(/\s+/g, " ");
      const code = $("#class-code").value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
      if (!fam) { $("#join-err").hidden = false; $("#fam-name").focus(); return; }
      this.start(fam, code);
    });
  },

  start(family, code) {
    this.g = newGame(family, code);
    this.g.step = "prologue";
    this.g.journal = [];
    this.y = null;
    this.corn = new Set();
    Sync.watchClass(code, (c) => this.onClassroom(c));
    this.save();
    this.closeSheet();
    this.run();
  },

  resume(saved) {
    this.g = saved;
    this.y = saved.cur || null;
    this.corn = new Set(saved.cornPlots || []);
    Sync.watchClass(saved.classCode, (c) => this.onClassroom(c));
    this.closeSheet();
    this.run();
  },

  onClassroom(c) {
    this.classroom = c;
    if (this.waiting) this.waiting();
  },

  // ---- the main sequence ----------------------------------------------------
  async run() {
    const g = this.g;
    this.renderTopbar();
    if (g.step === "prologue") {
      await this.cutscene(PROLOGUE);
      g.step = "contract"; this.save();
    }
    if (g.step === "contract") {
      await this.contract();
      g.step = "plant"; this.save();
    }
    while (!g.ending) {
      if (!this.y || this.y.year !== currentYear(g)) {
        this.y = blankYear(g);
        this.corn = new Set();
        this.save();
      }
      await this.playYear();
    }
    if (g.step !== "audit" && g.step !== "done") {
      await this.endingScene();
      g.step = "audit"; this.save();
    }
    if (g.step === "audit") {
      await this.waitForReveal();
      await this.audit();
      g.step = "done"; this.save();
    }
    this.done();
  },

  async playYear() {
    const g = this.g;
    const steps = ["plant", "store", "event", "harvest", "settle"];
    if (!steps.includes(g.step)) g.step = "plant";
    if (g.step === "plant") {
      await this.waitForYear();
      await this.plant();
      g.step = "store"; this.save();
    }
    if (g.step === "store") { await this.storeStep(); g.step = "event"; this.save(); }
    if (g.step === "event") { await this.eventStep(); g.step = "harvest"; this.save(); }
    if (g.step === "harvest") { await this.harvestStep(); g.step = "settle"; this.save(); }
    if (g.step === "settle") {
      const before = g.yearIndex;
      await this.settleStep();
      if (!g.ending) {
        g.step = "plant";
        this.save();
        if (g.yearIndex !== before && INTERLUDES[currentYear(g)]) await this.cutscene(INTERLUDES[currentYear(g)]);
      }
    }
  },

  // ---- class mode gates -------------------------------------------------------
  waitFor(test, html) {
    if (test()) return Promise.resolve();
    return new Promise((resolve) => {
      this.dock("");
      this.sheet(html);
      this.waiting = () => { if (test()) { this.waiting = null; this.closeSheet(); resolve(); } };
    });
  },
  waitForYear() {
    const yr = currentYear(this.g);
    return this.waitFor(
      () => !this.classroom || this.classroom.mode !== "class" || (this.classroom.year || CONFIG.years[0]) >= yr,
      `<div class="wait"><p class="eyebrow">Class mode</p><h2>Waiting for ${yr}</h2><p>Your teacher will start the next crop year for everyone at once. Talk with your family: what will you plant this time?</p></div>`
    );
  },
  waitForReveal() {
    return this.waitFor(
      () => !this.classroom || this.classroom.revealed || !this.classroom.exists,
      `<div class="wait"><p class="eyebrow">The books are closed</p><h2>Waiting for the audit</h2><p>Your teacher will open Mr. ${esc(this.planter())}'s books for every family at once.</p></div>`
    );
  },

  // ---- contract -------------------------------------------------------------
  contract() {
    return new Promise((resolve) => {
      World.setSky("spring");
      World.place("home");
      this.showFlat("contractDesk");
      this.log(CONTRACT.narration);
      this.sheet(`
        <p class="eyebrow">January 1869 · The big house</p>
        <h2>The contract</h2>
        <p class="voice">${esc(this.t(CONTRACT.narration))}</p>
        <div class="contract">
          <p class="doc-label">Labor contract with freedmen</p>
          ${CONTRACT.lines.map((l) => `<p>${esc(l)}</p>`).join("")}
          <p class="doc-credit">${esc(CONTRACT.credit)}</p>
        </div>
        <h3>The terms Mr. Holliday read out loud</h3>
        <dl class="terms">${CONTRACT.terms.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl>
        <p class="game-note">Game values. The contract excerpt is real and adapted. The dollar amounts are simplified.</p>
        <div class="mark-row">
          <button class="mark" id="mark-btn" aria-label="Make your mark">
            <span class="mark-line"></span><span class="mark-x" aria-hidden="true">X</span>
            <span class="mark-cap">Robert ${esc(this.g.family)}, his mark</span>
          </button>
          <p class="hint-small">Tap the line to make your mark.</p>
        </div>`);
      $("#mark-btn").addEventListener("click", (e) => {
        const b = e.currentTarget;
        if (b.classList.contains("made")) return;
        b.classList.add("made");
        this.g.signed = true;
        setTimeout(() => { this.closeSheet(); resolve(); }, 900);
      }, { once: true });
    });
  },

  // ---- spring: plant -------------------------------------------------------
  plant() {
    return new Promise((resolve) => {
      const y = this.y;
      World.setSky("spring"); World.setWeather("none"); World.setStage("plan");
      World.setPeople("home"); World.hideWagon();
      World.setFlags({ mule: "planter", school: !!this.g.education });
      World.setCorn(this.corn);
      World.setPlanter(this.planter());
      this.showFlat("plow");
      const line = this.t(YEAR_LINES[y.year].plant);
      this.log(line);
      World.walkTo("field").then(() => {
        World.setMode("plant");
        World.say("mama", "Cotton pays. Corn feeds us. Up to five acres of corn.");
      });
      this.plantDone = () => {
        y.corn = this.corn.size;
        y.cornPlots = [...this.corn];
        this.plantDone = null;
        World.setMode("locked");
        resolve();
      };
      this.renderPlant();
    });
  },
  renderPlant() {
    const y = this.y;
    const corn = this.corn.size;
    const est = plantingEstimate(corn, y.year);
    const prev = CONFIG.years.indexOf(y.year) > 0 ? CONFIG.pricePerBale[y.year - 1] : CONFIG.pricePerBale[y.year];
    const grid = Array.from({ length: CONFIG.acres }, (_, i) => {
      const isCorn = this.corn.has(i);
      return `<button class="acre ${isCorn ? "corn" : "cotton"}" data-acre="${i}" aria-pressed="${isCorn}" aria-label="Acre ${i + 1}: ${isCorn ? "corn" : "cotton"}">${isCorn ? "Corn" : "Cotton"}</button>`;
    }).join("");
    this.dock(`
      <p class="eyebrow">Spring ${y.year} · Plant</p>
      <p class="voice">${esc(this.t(YEAR_LINES[y.year].plant))}</p>
      <p class="how">${World.ok ? "Tap a square in the field, or here, to switch it between cotton and corn." : "Tap a square to switch it between cotton and corn."} Up to ${CONFIG.maxCornAcres} acres of corn.</p>
      <div class="acres" role="group" aria-label="Your 15 acres">${grid}</div>
      <div class="estimate">
        <div><span class="est-k">Cotton</span><span class="est-v">${est.cottonAcres} acres</span><span class="est-s">about ${fmtBales(est.bales)} bales. Your half: ${fmtBales(est.half)}</span></div>
        <div><span class="est-k">Corn</span><span class="est-v">${corn} acres</span><span class="est-s">store bill about ${fmt(est.storeSavings)} lower</span></div>
      </div>
      <p class="fine">Cotton sold for about $${prev} a bale last fall.</p>
      <button class="primary" id="plant-done">Done planting</button>`);
    this.els.dock.querySelectorAll("[data-acre]").forEach((b) => b.addEventListener("click", () => this.togglePlot(+b.dataset.acre)));
    $("#plant-done").addEventListener("click", () => this.plantDone?.());
  },
  togglePlot(i) {
    if (!this.plantDone) return;
    if (this.corn.has(i)) this.corn.delete(i);
    else if (this.corn.size < CONFIG.maxCornAcres) this.corn.add(i);
    else { World.say("mama", "The contract only allows five acres of corn."); this.flashLimit(); return; }
    World.setCorn(this.corn);
    this.renderPlant();
    this.els.dock.querySelector(`[data-acre="${i}"]`)?.focus({ preventScroll: true });
  },
  flashLimit() {
    const el = this.els.dock.querySelector(".how");
    if (!el) return;
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  },

  // ---- the store --------------------------------------------------------------
  async storeStep() {
    const y = this.y;
    World.setPeople("store");
    this.showFlat("bigHouse");
    this.dock(`<p class="eyebrow">Spring ${y.year} · The store</p><p class="voice">Papa and Mama walked to Mr. ${esc(this.planter())}'s store.</p>`);
    await World.walkTo("store");
    const line = this.t(YEAR_LINES[y.year].store);
    this.log(line);
    const cornCredit = y.corn * CONFIG.cornSavingsCash * (1 + CONFIG.creditMarkup);
    return new Promise((resolve) => {
      const opts = ["lean", "basic", "extra"].map((k) => {
        const b = CONFIG.baskets[k];
        const total = b.credit - cornCredit;
        return `<button class="basket" data-basket="${k}">
          <span class="basket-name">${b.label}</span>
          <span class="basket-note">${esc(b.note)}</span>
          <ul class="hand">${STORE_ITEMS[k].map((it) => `<li>${esc(it)}</li>`).join("")}</ul>
          <span class="basket-price"><span class="lbl">On account</span>${fmt(total)}</span>
        </button>`;
      }).join("");
      this.dock("");
      this.sheet(`
        <p class="eyebrow">Spring ${y.year} · ${esc(this.planter())} plantation store</p>
        <h2>Furnish for the year</h2>
        <p class="voice">${esc(line)}</p>
        <div class="baskets">${opts}</div>
        <p class="fine">${y.corn ? `Prices include about ${fmt(cornCredit)} off for your ${y.corn} acres of corn.` : "You planted no corn, so the store sells you all your food."} Everything goes on account until settling up.</p>
        <p class="fine warn">A lean basket saves money, but a family without shoes and cloth gets sick more easily in a bad year.</p>`, { wide: true });
      this.els.sheetBody.querySelectorAll("[data-basket]").forEach((b) => b.addEventListener("click", () => {
        y.basket = b.dataset.basket;
        const say = { lean: "No shoes this year, then. We'll make do.", basic: "That will see us through, if nothing goes wrong.", extra: "Medicine on the shelf. I'll sleep better." }[y.basket];
        this.log(`Mama: "${say}"`);
        this.closeSheet();
        World.say("mama", say);
        resolve();
      }));
    });
  },

  // ---- event card ------------------------------------------------------------
  async eventStep() {
    const y = this.y, g = this.g;
    const card = CARDS[y.event] || CARDS.none;
    World.setSky("summer");
    World.setStage("grow");
    World.setPeople("home");
    World.walkTo("home");
    this.showFlat(card.art);
    const title = this.t(card.title);
    await new Promise((resolve) => {
      const choice = !!card.question;
      let effect = card.effect;
      if (y.event === "muledies" && g.ownMule) effect = card.effectOwn;
      if (y.event === "sickness" && y.basket === "extra") effect = card.effectExtra;
      if (y.event === "eggs" && y.corn < CONFIG.eggsMinCorn) effect = card.effectNone;
      const muleBlocked = y.event === "mulebuy" && !canBuyMule(g);
      this.log(`${title}. ${this.t(card.body)}`, "card");
      this.sheet(`
        <div class="card">
          <div class="card-art">${cardSVG(card.art, title)}</div>
          <div class="card-text">
            <p class="eyebrow">Summer ${y.year} · Event card</p>
            <h2>${esc(title)}</h2>
            <p>${esc(this.t(card.body))}</p>
            ${choice ? `<p class="q">${esc(this.t(card.question))}</p>` : `<p class="effect">${esc(this.t(effect))}</p>`}
            ${muleBlocked ? `<p class="effect">${esc(card.cantAfford)}</p>` : ""}
            <div class="dyk"><span class="dyk-k">Did you know?</span> ${esc(card.dyk)}${card.credit ? ` <span class="credit">${esc(card.credit)}</span>` : ""}</div>
            <div class="card-actions" id="card-actions">
              ${choice && !muleBlocked
                ? `<button class="primary" data-choice="yes">${esc(this.t(card.yes))}</button><button class="secondary" data-choice="no">${esc(this.t(card.no))}</button>`
                : `<button class="primary" data-choice="ok">Continue</button>`}
            </div>
          </div>
        </div>`, { wide: true });
      this.els.sheetBody.querySelectorAll("[data-choice]").forEach((b) => b.addEventListener("click", () => {
        const c = b.dataset.choice;
        if (c === "ok") { y.choice = muleBlocked ? "no" : null; finish(); return; }
        y.choice = c;
        if (y.event === "mulebuy" && c === "yes") { y.muleBought = CONFIG.muleCost; g.ownMule = true; }
        if (y.event === "school" && c === "yes") g.education += 1;
        const res = this.t(c === "yes" ? card.effectYes : card.effectNo);
        this.log(res, "card");
        $("#card-actions").innerHTML = `<p class="effect">${esc(res)}</p><button class="primary" data-done>Continue</button>`;
        $("#card-actions [data-done]").addEventListener("click", finish);
        $("#card-actions [data-done]").focus();
      }));
      const finish = () => { this.closeSheet(); resolve(); };
    });
    applyEvent(g, y);
    World.setWeather({ rains: "rain", drought: "drought", flood: "flood" }[y.event] || "none");
    if (y.event === "muledies") World.setFlags({ mule: "none" });
    if (y.event === "school") World.setFlags({ school: true });
    if (y.event === "mulebuy" && y.choice === "yes") World.setFlags({ mule: "own" });
    this.save();
    if (World.ok && ["rains", "drought", "flood"].includes(y.event)) {
      this.dock(`<p class="eyebrow">Summer ${y.year}</p><p class="voice">${esc(this.t(card.body))}</p><button class="primary" id="go-on">Go on to the harvest</button>`);
      World.setMode("free");
      await new Promise((r) => $("#go-on").addEventListener("click", r, { once: true }));
      World.setMode("locked");
    }
  },

  // ---- fall: harvest and gin -------------------------------------------------
  async harvestStep() {
    const y = this.y, g = this.g;
    harvest(g, y);
    World.setWeather(y.event === "drought" ? "drought" : "none");
    World.setSky(y.event === "drought" ? "drought" : "fall");
    World.setStage("ripe");
    World.setPeople("field");
    World.say("mama", "Sun's up. Let's get these rows in before the frost.");
    this.showFlat("longRows");
    const line = this.t(YEAR_LINES[y.year].harvest);
    this.log(line);
    await World.walkTo("field");
    await new Promise((resolve) => {
      this.harvestDone = () => { this.harvestDone = null; World.setMode("locked"); resolve(); };
      this.dock(`
        <p class="eyebrow">Fall ${y.year} · Harvest</p>
        <p class="voice">${esc(line)}</p>
        <p class="how">${World.ok ? "Walk the rows with the family. Tap the ground to walk, or use WASD." : "The family worked the rows from September to frost."}</p>
        ${World.ok ? `<div class="progress" aria-hidden="true"><span id="harvest-bar"></span></div>
        <p class="pickcount" id="harvest-pct" aria-live="polite">Rows walked: 0%</p>
        <button class="secondary" id="walk-rows">Walk the rows for me</button>` : ""}
        <button class="primary" id="load-wagon" ${World.ok ? "disabled" : ""}>Load the wagon</button>`);
      World.setMode(World.ok ? "harvest" : "locked");
      $("#walk-rows")?.addEventListener("click", (e) => { e.currentTarget.disabled = true; World.walkRows(); });
      $("#load-wagon").addEventListener("click", () => this.harvestDone?.());
    });
    this.dock(`<p class="eyebrow">Fall ${y.year} · The gin</p><p class="voice">The family picked the rest. It took until frost. The wagon went to Mr. ${esc(this.planter())}'s scale.</p>`);
    const maxLbs = (CONFIG.acres / CONFIG.acresPerBale) * 1.2 * CONFIG.poundsPerBale;
    await World.harvestRun(y.totalBales, y.scaleLbs, maxLbs);
    this.showFlat("porchLantern");
    this.dock(`
      <p class="eyebrow">Fall ${y.year} · The scale</p>
      <div class="scale-read">
        <span class="scale-k">Mr. ${esc(this.planter())}'s scale</span>
        <span class="scale-v">${fmtLbs(y.scaleLbs)}</span>
        <span class="scale-s">${fmtBales(y.scaleLbs / CONFIG.poundsPerBale)} bales. Your ${y.shareRate > 0.5 ? "two-thirds" : "half"}: ${fmtBales(y.creditedBales)} bales. Ginning: $${CONFIG.ginningPerBale} a bale.</span>
      </div>
      <button class="primary" id="to-settle">Go up to the big house</button>`);
    World.say("mama", y.year === 1871 ? "That wagon felt heavier than that." : "That's the year's work, right there.");
    this.log(`Mr. ${this.planter()}'s scale read ${fmtLbs(y.scaleLbs)}.`);
    await new Promise((r) => $("#to-settle").addEventListener("click", r, { once: true }));
  },
  onHarvest(frac) {
    const pct = Math.round(frac * 100);
    const bar = $("#harvest-bar"), label = $("#harvest-pct"), load = $("#load-wagon");
    if (bar) bar.style.width = pct + "%";
    if (label) label.textContent = pct >= 99 ? "Every row is picked." : `Rows walked: ${pct}%`;
    if (load && frac >= 0.6) load.disabled = false;
  },

  onInteract(name) {
    const y = this.y;
    const talk = FAMILY_TALK[name];
    if (talk && y) {
      const line = talk[y.year] || talk.any;
      if (line) {
        World.say(name, this.t(line));
        const who = { mama: "Mama", lucy: "Lucy", sam: "Sam", ruth: "Grandma Ruth", holliday: "Mr. " + this.planter() }[name];
        this.log(who ? `${who}: "${this.t(line)}"` : this.t(line));
      }
    }
  },

  // ---- settling up --------------------------------------------------------------
  async settleStep() {
    const y = this.y, g = this.g;
    World.setSky("dusk");
    World.setStage("picked");
    World.setPeople("porch");
    World.hideWagon();
    this.showFlat("porchLantern");
    this.dock(`<p class="eyebrow">Christmas ${y.year} · Settling up</p><p class="voice">${esc(this.t(YEAR_LINES[y.year].settle))}</p>`);
    this.log(this.t(YEAR_LINES[y.year].settle));
    await World.walkTo("porch");
    World.say("holliday", "Come on up. I've got your number right here.");
    buildLedger(g, y);
    if (!y.evicted && voteEviction(g, y)) { y.evicted = true; y.evictedBy = "vote"; buildLedger(g, y); }
    this.dock("");
    await new Promise((resolve) => {
      this.settleResolve = resolve;
      this.renderSettle(null);
    });
  },
  renderSettle(revealed) {
    const y = this.y, g = this.g;
    const bal = y.ledger.balance;
    const price = CONFIG.pricePerBale[y.year];
    let said;
    if (y.evicted) said = y.evictedBy === "vote" ? SETTLE_TEXT.evictedVote : SETTLE_TEXT.evictedDemand;
    else if (bal < -0.005) said = SETTLE_TEXT.owe.replace("${N}", fmt(-bal));
    else if (bal > 0.005) said = SETTLE_TEXT.ahead.replace("${N}", fmt(bal));
    else said = SETTLE_TEXT.even;
    this.log(`Mr. ${this.planter()}: ${said}`, "settle");
    const rent = !y.evicted && canRent(g, bal);
    const isLast = g.yearIndex >= CONFIG.years.length - 1;
    const revealHtml = revealed ? (() => {
      const r = REVEALS[revealed];
      return `<div class="reveal"><p class="eyebrow">${esc(r.title)}</p><p>${esc(this.t(r.text))}</p><p class="figure-line">${esc(r.detail(y))}</p></div>`;
    })() : "";
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
        <blockquote class="said">${esc(said)}</blockquote>
        <div class="number ${bal < 0 ? "neg" : ""}" aria-label="Balance ${fmt(bal)}">${fmt(bal)}</div>
        ${revealHtml}
        ${rent ? `<p class="voice">${esc(SETTLE_TEXT.rentReady)}</p>` : ""}
        <div class="settle-actions">${actions}</div>
        ${!y.evicted && bal < 0 ? `<p class="fine">${esc(SETTLE_TEXT.leaveOwing)}</p>` : ""}
        ${!y.evicted && !y.demanded ? `<p class="fine">Demanding the books shows one hidden line. He may put you off the place (1 in 3).</p>` : ""}
      </div>`, { low: true });
    this.els.sheetBody.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => this.settleAct(b.dataset.act)));
  },
  settleAct(act) {
    const y = this.y, g = this.g;
    if (act === "demand") {
      this.log(SETTLE_TEXT.demandIntro, "settle");
      const r = demandBooks(g, y);
      this.save();
      if (r.evicted) World.say("holliday", "Get off my porch.");
      this.renderSettle(r.evicted ? null : r.item);
      return;
    }
    if (act === "leave" && y.ledger.balance < 0 && !this.confirmLeave) {
      this.confirmLeave = true;
      const box = this.els.sheetBody.querySelector(".settle-actions");
      box.innerHTML = `<p class="voice">Mama held Papa's arm. "We owe him ${fmt(-y.ledger.balance)}. If we go owing, the sheriff will come after you."</p>
        <button class="primary" data-act="stay">Stay</button><button class="secondary danger" data-act="leave">Leave anyway</button>`;
      box.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => this.settleAct(b.dataset.act)));
      return;
    }
    this.confirmLeave = false;
    const decision = act === "move" ? "stay" : act;
    closeYear(g, y, decision);
    this.log(`Settled ${y.year}: ${fmt(y.ledger.balance)}. ${{ stay: y.evicted ? "We moved to a new place." : "We stayed.", leave: "We left.", rent: "We rented a farm." }[decision]}`, "settle");
    this.closeSheet();
    this.save();
    const done = this.settleResolve;
    this.settleResolve = null;
    done?.();
  },

  // ---- ending and epilogue ---------------------------------------------------
  async endingScene() {
    const g = this.g;
    const e = ENDINGS[g.ending];
    World.setSky("dusk");
    const panels = [...e.panels, g.education ? EPILOGUE.school : EPILOGUE.noschool];
    await this.cutscene(panels);
  },

  // ---- the audit -------------------------------------------------------------
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
          <p class="voice">${esc(this.t(AUDIT_INTRO))}</p>
          ${table}
          <p class="fine">Red figures in the honest column are where his book and the truth part ways. Game values, rebuilt from your own play. This is a reconstruction, not a primary source.</p>
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
      $("#audit-done").addEventListener("click", () => { this.closeSheet(); resolve(); });
    });
  },

  done() {
    const g = this.g;
    const a = auditTotals(g);
    World.setMode("free");
    World.setSky("dusk");
    this.dock("");
    this.sheet(`
      <div class="final">
        <p class="eyebrow">The ${esc(g.family)} family · ${esc(ENDINGS[g.ending].title)}</p>
        <h2>${esc(EXIT_TICKET.question)}</h2>
        <p>${esc(EXIT_TICKET.prompt)}</p>
        <p>${esc(EXIT_TICKET.tracker)}</p>
        <div class="report">
          <p class="eyebrow">Report to your teacher</p>
          <p class="report-line"><strong>${esc(g.family)}</strong> · his book ${fmt(a.finalPlanter)} · honest ${fmt(a.finalHonest)} · ${esc(ENDINGS[g.ending].title)}</p>
          <p class="fine">Markup ${fmt(a.markup)} · Cotton missing ${fmtLbs(a.missingLbs)} (${fmt(a.missingValue)}) · Extra interest ${fmt(a.extraInterest)}</p>
        </div>
        <div class="final-actions">
          <button class="secondary" id="final-journal">Read the journal</button>
          <button class="secondary" id="final-new">Play another family</button>
        </div>
      </div>`);
    $("#final-journal").addEventListener("click", () => this.openJournal());
    $("#final-new").addEventListener("click", () => { store.del(SAVE_KEY); location.hash = ""; this.g = null; this.y = null; this.renderTopbar(); this.showJoin(); });
  },

  openJournal() {
    const j = (this.g && this.g.journal) || [];
    const byYear = {};
    j.forEach((e) => { (byYear[e.year] = byYear[e.year] || []).push(e); });
    $("#journal-list").innerHTML = j.length
      ? Object.entries(byYear).map(([yr, es]) => `<section><h3>${yr}</h3>${es.map((e) => `<p class="j-${e.kind}">${esc(e.text)}</p>`).join("")}</section>`).join("")
      : `<p class="fine">Everything you read in the game shows up here, so you can look back at anything you missed.</p>`;
    this.els.journal.hidden = false;
    $("#journal-close").focus();
  },
};

// Short lines when Papa taps a family member in the world.
const FAMILY_TALK = {
  mama: { 1869: "I'm keeping my own count, Robert. In my head.", 1871: "Somebody in this house should know what we really owe.", 1873: "Whatever he says up there, we stay together.", any: "Go on. The rows won't plant themselves." },
  lucy: { 1869: "Papa, is the land ours now?", 1870: "Mama says I could learn to read, if there was a school.", 1872: "I counted the bales. I got a different number than he did.", any: "I'll carry the water bucket." },
  sam: { 1869: "When I'm big I'm gonna pick a whole bale by myself.", any: "Can I ride the mule?" },
  ruth: { 1869: "I was born on this place. Never thought I'd see it from this side.", 1870: "Your grandfather would have walked ten miles to vote.", 1873: "Hard times come round. So do we.", any: "Plant the corn close to the house. Hungry is worse than broke." },
  holliday: { any: "Get on back to work. We'll settle up at Christmas." },
  mule: { any: "The mule flicks an ear and goes back to grazing." },
};
