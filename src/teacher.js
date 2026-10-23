// ============================================================================
// SYNC — family records to the artifact's shared database, when available.
// TEACHER — the class board: live balances, endings, year control, reveal.
// ============================================================================
const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "x";

const Sync = {
  db: null,
  user: null,
  ready: null,
  live: false,
  writable: true,
  unsubClass: null,
  timer: null,
  writing: false,
  queued: null,

  init() {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      try {
        if (!window.claude || typeof window.claude.use !== "function") return;
        const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
        this.db = db; this.user = user;
        this.live = !!db;
      } catch { this.live = false; }
    })();
    return this.ready;
  },

  async watchClass(code, cb) {
    await this.init();
    this.unsubClass?.();
    this.unsubClass = null;
    if (!this.db || !code) { cb(null); return; }
    try {
      this.unsubClass = this.db.doc("classrooms/" + code).onSnapshot(
        (s) => cb(s.exists ? { ...s.data(), exists: true } : { exists: false }),
        () => cb(null)
      );
    } catch { cb(null); }
  },

  docId(g) {
    if (!g.docId) g.docId = slug(g.classCode) + "--" + slug(g.family) + "-" + Math.random().toString(36).slice(2, 6);
    return g.docId;
  },

  saveFamily(g) {
    if (!g || !g.classCode) return;
    this.docId(g);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(g), 700);
  },
  async flush(g) {
    await this.init();
    if (!this.db || !this.writable) return;
    const body = { ...familyRecord(g), docId: g.docId, updatedAt: Date.now() };
    if (this.writing) { this.queued = body; return; }
    this.writing = true;
    try {
      await this.db.doc("families/" + g.docId).set(body);
    } catch (e) {
      if (e && (e.code === "invalid_argument" || e.code === "not_granted" || e.code === "revoked")) this.writable = false;
    }
    this.writing = false;
    if (this.queued) { const q = this.queued; this.queued = null; this.writing = true; try { await this.db.doc("families/" + q.docId).set(q); } catch { /* keep playing */ } this.writing = false; }
  },
};

const Teacher = {
  code: "",
  classroom: null,
  families: [],
  unsubs: [],
  canEdit: false,

  async open() {
    const el = $("#teacher");
    el.hidden = false;
    document.body.classList.add("teacher-mode");
    await Sync.init();
    this.canEdit = Sync.user ? await Sync.user.canEdit() : false;
    const last = store.get("settling-up:teacher-code");
    this.code = last || "";
    this.render();
    if (this.code) this.watch();
  },
  close() {
    $("#teacher").hidden = true;
    document.body.classList.remove("teacher-mode");
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    location.hash = "";
    if (!Game.g) Game.showJoin();
  },

  watch() {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    store.set("settling-up:teacher-code", this.code);
    if (!Sync.db || !this.code) { this.render(); return; }
    try {
      this.unsubs.push(Sync.db.doc("classrooms/" + this.code).onSnapshot((s) => {
        this.classroom = s.exists ? s.data() : null;
        this.render();
      }, () => {}));
      this.unsubs.push(Sync.db.collection("families").where("classCode", "==", this.code).onSnapshot((snap) => {
        this.families = snap.docs.map((d) => d.data());
        this.render();
      }, () => {}));
    } catch { this.render(); }
  },

  manualKey() { return "settling-up:manual:" + this.code; },
  manualRows() {
    if (Sync.db && this.classroom && Array.isArray(this.classroom.manual)) return this.classroom.manual;
    return store.get(this.manualKey()) || [];
  },

  async writeClass(patch) {
    const base = this.classroom || { mode: "solo", year: CONFIG.years[0], revealed: false, manual: [] };
    const next = { ...base, ...patch, updatedAt: Date.now() };
    if (Sync.db && this.canEdit) {
      try { await Sync.db.doc("classrooms/" + this.code).set(next); return; } catch { /* fall through */ }
    }
    this.classroom = next;
    if (patch.manual) store.set(this.manualKey(), patch.manual);
    this.render();
  },

  rows() {
    const live = this.families.map((f) => ({
      family: f.family, year: f.year, step: f.step, balance: f.balance, ending: f.ending, live: true, mule: f.ownMule,
    }));
    const manual = this.manualRows().map((m) => ({ ...m, live: false, year: 1873 }));
    return [...live, ...manual];
  },

  chart(rows) {
    if (!rows.length) return `<p class="fine">No families yet. They appear here as they play.</p>`;
    const sorted = [...rows].sort((a, b) => a.balance - b.balance);
    const max = Math.max(CONFIG.rentSavings + 20, ...sorted.map((r) => Math.abs(r.balance)));
    const W = 760, labelW = 150, mid = labelW + (W - labelW) / 2, half = (W - labelW) / 2 - 70;
    const H = sorted.length * 30 + 40;
    const sx = (v) => (v / max) * half;
    let out = `<line x1="${mid}" y1="14" x2="${mid}" y2="${H - 18}" class="axis"/>`;
    const rentX = mid + sx(CONFIG.rentSavings);
    out += `<line x1="${rentX}" y1="14" x2="${rentX}" y2="${H - 18}" class="rentline"/>`;
    out += `<text x="${rentX}" y="${H - 4}" text-anchor="middle" class="ax">$${CONFIG.rentSavings} to rent</text>`;
    out += `<text x="${mid}" y="${H - 4}" text-anchor="middle" class="ax">$0</text>`;
    sorted.forEach((r, i) => {
      const y = 20 + i * 30;
      const w = sx(r.balance);
      const x = w < 0 ? mid + w : mid;
      out += `<text x="${labelW - 10}" y="${y + 14}" text-anchor="end" class="lab">${esc(r.family)}</text>`;
      out += `<rect x="${x}" y="${y}" width="${Math.max(1.5, Math.abs(w))}" height="20" class="bar ${r.balance < 0 ? "neg" : ""}" rx="2"/>`;
      const vx = w < 0 ? x - 6 : x + Math.abs(w) + 6;
      out += `<text x="${vx}" y="${y + 14}" text-anchor="${w < 0 ? "end" : "start"}" class="val">${fmt(r.balance)}</text>`;
    });
    return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" class="board-chart" role="img" aria-label="Final balance for each family">${out}</svg></div>`;
  },

  render() {
    const el = $("#teacher-body");
    const rows = this.rows();
    const finished = rows.filter((r) => r.ending);
    const inDebt = finished.filter((r) => r.balance < 0).length;
    const endings = { cropping: 0, rent: 0, vagrancy: 0 };
    finished.forEach((r) => { if (endings[r.ending] != null) endings[r.ending]++; });
    const c = this.classroom || { mode: "solo", year: CONFIG.years[0], revealed: false };
    const live = Sync.live;
    const status = live
      ? (this.canEdit ? "Live board. Families signed in to claude.ai in your organization report here automatically." : "Live board (read only). Only the artifact's owner or editors can change class settings.")
      : "Not connected to the live board in this view. Add families by hand from their report line.";
    el.innerHTML = `
      <header class="t-head">
        <div><p class="eyebrow">Settling Up</p><h1>Teacher board</h1></div>
        <button class="secondary" id="t-close">Back to the game</button>
      </header>
      <p class="t-status ${live ? "on" : ""}">${esc(status)}</p>
      <form class="t-code" id="t-code">
        <label for="t-code-in">Class code</label>
        <input id="t-code-in" value="${esc(this.code)}" maxlength="12" autocomplete="off" placeholder="e.g. P3" style="text-transform:uppercase">
        <button class="primary" type="submit">Open board</button>
      </form>
      ${this.code ? `
      <section class="t-controls">
        <div class="t-ctl">
          <span class="t-k">Mode</span>
          <div class="seg" role="group" aria-label="Mode">
            <button class="${c.mode !== "class" ? "on" : ""}" data-mode="solo" ${this.canEdit || !live ? "" : "disabled"}>Solo</button>
            <button class="${c.mode === "class" ? "on" : ""}" data-mode="class" ${this.canEdit || !live ? "" : "disabled"}>Class</button>
          </div>
          <span class="t-s">${c.mode === "class" ? "Every family waits for you at the start of each year." : "Families play at their own pace."}</span>
        </div>
        <div class="t-ctl">
          <span class="t-k">Year</span>
          <span class="t-v">${c.mode === "class" ? c.year : "Any"}</span>
          ${c.mode === "class" ? `<button class="secondary" id="t-next" ${c.year >= 1873 ? "disabled" : ""}>Start ${Math.min(1873, (c.year || 1869) + 1)}</button>` : ""}
        </div>
        <div class="t-ctl">
          <span class="t-k">Audit</span>
          <span class="t-v">${c.revealed ? "Open" : "Closed"}</span>
          <button class="${c.revealed ? "secondary" : "primary"}" id="t-reveal">${c.revealed ? "Close the books" : "Open the books for everyone"}</button>
          <span class="t-s">${c.revealed ? "" : "Families who finish wait at the audit until you open it."}</span>
        </div>
      </section>
      <section class="t-board">
        <h2>${finished.length ? `${inDebt} of ${finished.length} families ended in debt` : `${rows.length} ${rows.length === 1 ? "family" : "families"} playing`}</h2>
        <div class="t-endings">
          <span><strong>${endings.cropping}</strong> still cropping</span>
          <span><strong>${endings.rent}</strong> renting a farm</span>
          <span><strong>${endings.vagrancy}</strong> arrested for vagrancy</span>
        </div>
        ${this.chart(rows)}
        <div class="ledger-wrap"><table class="t-table">
          <thead><tr><th>Family</th><th>Year</th><th>Step</th><th>Balance</th><th>Ending</th></tr></thead>
          <tbody>${rows.map((r) => `<tr><td>${esc(r.family)}${r.live ? "" : ' <span class="tag">by hand</span>'}</td><td>${r.year || ""}</td><td>${esc(r.step || (r.ending ? "done" : ""))}</td><td class="${r.balance < 0 ? "neg" : ""}">${fmt(r.balance || 0)}</td><td>${r.ending ? esc(ENDINGS[r.ending]?.title || r.ending) : ""}</td></tr>`).join("") || `<tr><td colspan="5" class="fine">No families yet.</td></tr>`}</tbody>
        </table></div>
      </section>
      <section class="t-manual">
        <h3>Add a family by hand</h3>
        <p class="fine">For families who can't connect: type the line from their final screen.</p>
        <form id="t-add" class="t-add">
          <label for="t-fam">Family</label><input id="t-fam" maxlength="24" required>
          <label for="t-bal">His final number ($)</label><input id="t-bal" inputmode="decimal" required>
          <label for="t-end">Ending</label>
          <select id="t-end"><option value="cropping">Still cropping</option><option value="rent">Renting a farm</option><option value="vagrancy">Arrested for vagrancy</option></select>
          <button class="secondary" type="submit">Add</button>
        </form>
      </section>
      <section class="t-debrief">
        <h3>Debrief prompts</h3>
        <ul>
          <li>How many of you made good choices and still ended in debt?</li>
          <li>Why didn't you just leave? Point to the vagrancy ending and the contract line: nothing is sold until the planter is paid.</li>
          <li>Is this slavery? Push for precision: name what it shares with slavery and what is different.</li>
        </ul>
      </section>` : ""}`;
    $("#t-close").addEventListener("click", () => this.close());
    $("#t-code").addEventListener("submit", (e) => {
      e.preventDefault();
      this.code = $("#t-code-in").value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
      this.classroom = null; this.families = [];
      this.watch();
    });
    if (!this.code) return;
    el.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => this.writeClass({ mode: b.dataset.mode, year: c.year || CONFIG.years[0] })));
    $("#t-next")?.addEventListener("click", () => this.writeClass({ year: Math.min(1873, (c.year || 1869) + 1) }));
    $("#t-reveal").addEventListener("click", () => this.writeClass({ revealed: !c.revealed }));
    $("#t-add").addEventListener("submit", (e) => {
      e.preventDefault();
      const fam = $("#t-fam").value.trim();
      const bal = parseFloat($("#t-bal").value.replace(/[^0-9.\-−]/g, "").replace("−", "-"));
      if (!fam || isNaN(bal)) return;
      const manual = [...this.manualRows(), { family: fam, balance: bal, ending: $("#t-end").value }];
      this.writeClass({ manual });
    });
  },
};
