// ============================================================================
// ART — flat 2D cutscene panels and card art, built from simple shapes.
// Palette leans on tempera colors: ochre, indigo, brick, ink, and paper.
// ============================================================================
const ART_COLORS = {
  paper: "#EFE6D2", paper2: "#E2D4B6", ink: "#1E1B18", ochre: "#C08A3E", ochreLt: "#D9AE62",
  brick: "#A3271F", indigo: "#2E3B56", indigoLt: "#4C5C7E", green: "#5E6A3A", greenLt: "#7E8B4E",
  brown: "#7A4A2E", brownDk: "#4F2F1D", cream: "#F6EFDF", sky: "#D9B877", night: "#1F2840",
  skin1: "#5A3824", skin2: "#7A4E30", skin3: "#3E2718", cotton: "#F7F2E6", gray: "#8C8578",
};
const AC = ART_COLORS;

function svgWrap(w, h, inner, label) {
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label || ""}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}
const R = (x, y, w, h, f, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${extra}/>`;
const C = (x, y, r, f, extra = "") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${extra}/>`;
const P = (pts, f, extra = "") => `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="${f}" ${extra}/>`;
const L = (x1, y1, x2, y2, s, w, extra = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s}" stroke-width="${w}" ${extra}/>`;
const T = (x, y, txt, o = {}) => `<text x="${x}" y="${y}" fill="${o.fill || AC.ink}" font-family="${o.font || "Archivo, 'Arial Narrow', sans-serif"}" font-size="${o.size || 40}" font-weight="${o.weight || 800}" text-anchor="${o.anchor || "middle"}" letter-spacing="${o.ls || 0}" ${o.extra || ""}>${txt}</text>`;

// A flat, faceless figure. (x, y) is where the feet meet the ground.
function figure(x, y, h, o = {}) {
  const s = h / 100;
  const skin = o.skin || AC.skin1, top = o.top || AC.indigo, low = o.low || AC.brownDk;
  const dir = o.dir === "left" ? -1 : 1;
  const X = (dx) => x + dx * s * dir;
  const Y = (dy) => y - dy * s;
  let out = "";
  // legs or skirt
  if (o.skirt) {
    out += P([[X(-9), Y(52)], [X(9), Y(52)], [X(19), Y(3)], [X(-17), Y(3)]], low);
    out += R(X(-10) - (dir < 0 ? 5 * s : 0), Y(4), 6 * s, 4 * s, AC.ink);
  } else {
    out += P([[X(-9), Y(52)], [X(-1), Y(52)], [X(-3), Y(0)], [X(-11), Y(0)]], low);
    out += P([[X(1), Y(52)], [X(9), Y(52)], [X(11), Y(0)], [X(3), Y(0)]], low);
  }
  // torso
  out += P([[X(-13), Y(83)], [X(13), Y(83)], [X(10), Y(50)], [X(-10), Y(50)]], top);
  // arms
  const pose = o.pose || "down";
  if (pose === "down") {
    out += P([[X(-13), Y(82)], [X(-8), Y(80)], [X(-12), Y(48)], [X(-17), Y(49)]], top);
    out += P([[X(13), Y(82)], [X(8), Y(80)], [X(12), Y(48)], [X(17), Y(49)]], top);
    out += C(X(-14.5), Y(46), 3.4 * s, skin) + C(X(14.5), Y(46), 3.4 * s, skin);
  } else if (pose === "work") {
    // bent forward, both arms reaching low
    out += P([[X(8), Y(82)], [X(13), Y(80)], [X(30), Y(52)], [X(25), Y(49)]], top);
    out += P([[X(-6), Y(80)], [X(-1), Y(82)], [X(22), Y(44)], [X(17), Y(42)]], top);
    out += C(X(28), Y(48), 3.6 * s, skin) + C(X(21), Y(40), 3.6 * s, skin);
    if (o.tool) out += L(X(30), Y(55), X(46), Y(2), AC.brownDk, 2.4 * s);
  } else if (pose === "hat") {
    // hat held at the chest
    out += P([[X(-13), Y(82)], [X(-8), Y(80)], [X(2), Y(64)], [X(-2), Y(60)]], top);
    out += P([[X(13), Y(82)], [X(8), Y(80)], [X(4), Y(64)], [X(9), Y(60)]], top);
    out += `<ellipse cx="${X(3)}" cy="${Y(63)}" rx="${12 * s}" ry="${4 * s}" fill="${AC.ochreLt}"/>`;
  } else if (pose === "hold") {
    out += P([[X(-13), Y(82)], [X(-8), Y(80)], [X(4), Y(62)], [X(0), Y(58)]], top);
    out += P([[X(13), Y(82)], [X(8), Y(80)], [X(12), Y(60)], [X(16), Y(62)]], top);
    out += C(X(6), Y(60), 3.4 * s, skin) + C(X(14), Y(60), 3.4 * s, skin);
  } else if (pose === "up") {
    out += P([[X(-13), Y(82)], [X(-8), Y(83)], [X(-14), Y(112)], [X(-19), Y(110)]], top);
    out += P([[X(13), Y(82)], [X(8), Y(80)], [X(12), Y(48)], [X(17), Y(49)]], top);
    out += C(X(-17), Y(113), 3.4 * s, skin) + C(X(14.5), Y(46), 3.4 * s, skin);
  }
  // neck and head
  out += R(X(-3) - (dir < 0 ? 6 * s : 0), Y(89), 6 * s, 7 * s, skin);
  out += `<ellipse cx="${X(0)}" cy="${Y(96)}" rx="${8 * s}" ry="${9.5 * s}" fill="${skin}"/>`;
  if (o.hat) {
    out += `<ellipse cx="${X(0)}" cy="${Y(102)}" rx="${15 * s}" ry="${3.4 * s}" fill="${o.hat}"/>`;
    out += P([[X(-8), Y(102)], [X(8), Y(102)], [X(6), Y(111)], [X(-6), Y(111)]], o.hat);
  }
  if (o.wrap) {
    out += P([[X(-9), Y(99)], [X(9), Y(99)], [X(10), Y(106)], [X(0), Y(110)], [X(-10), Y(106)]], o.wrap);
  }
  if (o.gray) out += `<ellipse cx="${X(0)}" cy="${Y(103)}" rx="${8.4 * s}" ry="${4 * s}" fill="${AC.paper2}"/>`;
  return `<g>${out}</g>`;
}

function mule(x, y, s, o = {}) {
  const col = o.color || AC.brownDk;
  const d = o.dir === "left" ? -1 : 1;
  const X = (dx) => x + dx * s * d, Y = (dy) => y - dy * s;
  let out = "";
  out += P([[X(-40), Y(52)], [X(30), Y(56)], [X(34), Y(30)], [X(-38), Y(30)]], col);
  [[-34], [-24], [20], [28]].forEach(([lx]) => { out += R(Math.min(X(lx), X(lx + 6)), Y(32), 6 * s, 32 * s, col); });
  if (o.down) {
    out += P([[X(30), Y(52)], [X(48), Y(30)], [X(62), Y(16)], [X(54), Y(10)], [X(36), Y(28)]], col);
  } else {
    out += P([[X(28), Y(56)], [X(44), Y(80)], [X(64), Y(70)], [X(60), Y(62)], [X(40), Y(48)]], col);
    out += P([[X(42), Y(80)], [X(40), Y(98)], [X(47), Y(82)]], col) + P([[X(47), Y(80)], [X(50), Y(97)], [X(52), Y(80)]], col);
  }
  out += P([[X(-40), Y(50)], [X(-50), Y(26)], [X(-46), Y(26)]], col);
  return `<g>${out}</g>`;
}

function cabin(x, y, w, h, o = {}) {
  const wall = o.wall || AC.brown, roof = o.roof || AC.brownDk;
  let out = R(x, y - h, w, h, wall);
  for (let i = 1; i < 6; i++) out += L(x, y - h + (h * i) / 6, x + w, y - h + (h * i) / 6, AC.brownDk, 2, 'opacity="0.45"');
  out += P([[x - w * 0.08, y - h], [x + w / 2, y - h - h * 0.62], [x + w * 1.08, y - h]], roof);
  out += R(x + w * 0.4, y - h * 0.62, w * 0.2, h * 0.62, o.door || AC.ink);
  out += R(x + w * 0.1, y - h * 0.7, w * 0.18, h * 0.22, o.window || AC.ink);
  out += R(x + w * 0.78, y - h - h * 0.5, w * 0.08, h * 0.35, AC.brownDk);
  return out;
}

function bigHouse(x, y, w, h) {
  let out = R(x, y - h, w, h, AC.cream);
  out += P([[x - w * 0.06, y - h], [x + w / 2, y - h - h * 0.45], [x + w * 1.06, y - h]], AC.brick);
  for (let i = 0; i < 6; i++) out += R(x + w * 0.06 + i * w * 0.17, y - h, w * 0.035, h, AC.paper2);
  for (let i = 0; i < 4; i++) out += R(x + w * 0.14 + i * w * 0.2, y - h * 0.8, w * 0.08, h * 0.24, AC.indigo);
  out += R(x + w * 0.44, y - h * 0.42, w * 0.12, h * 0.42, AC.indigo);
  return out;
}

function fieldRows(y0, y1, n, a, b, extra = "") {
  let out = "";
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n;
    const yA = y0 + (y1 - y0) * Math.pow(t0, 1.6), yB = y0 + (y1 - y0) * Math.pow(t1, 1.6);
    out += R(0, yA, 1600, yB - yA + 1, i % 2 ? a : b, extra);
  }
  return out;
}

function cottonDots(y0, y1, count, seed = 1) {
  let out = "", s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < count; i++) {
    const t = rnd();
    const y = y0 + (y1 - y0) * t;
    out += C(rnd() * 1600, y, 3 + 9 * t, AC.cotton);
  }
  return out;
}

function newspaper(x, y, w, h, mast, head, sub) {
  let out = R(x, y, w, h, AC.cream) + R(x, y, w, h, "none", `stroke="${AC.ink}" stroke-width="4"`);
  out += T(x + w / 2, y + 70, mast, { size: 34, weight: 700, font: "'Courier Prime', Courier, monospace", ls: 6 });
  out += L(x + 30, y + 92, x + w - 30, y + 92, AC.ink, 4) + L(x + 30, y + 100, x + w - 30, y + 100, AC.ink, 1.5);
  const lines = Array.isArray(head) ? head : [head];
  lines.forEach((ln, i) => { out += T(x + w / 2, y + 180 + i * 84, ln, { size: 76, weight: 900 }); });
  const subY = y + 180 + lines.length * 84 + 10;
  if (sub) out += T(x + w / 2, subY, sub, { size: 30, weight: 600, font: "'Public Sans', Arial, sans-serif" });
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 7; r++) {
      const cx = x + 40 + c * ((w - 80) / 3);
      out += R(cx, subY + 40 + r * 26, (w - 80) / 3 - 30, 9, AC.gray, 'opacity="0.55"');
    }
  }
  return out;
}

const PANEL_ART = {
  fieldSun() {
    return R(0, 0, 1600, 900, AC.sky) + C(1160, 300, 190, AC.brick) +
      P([[0, 470], [300, 400], [620, 450], [940, 380], [1300, 440], [1600, 400], [1600, 520], [0, 520]], AC.indigo) +
      fieldRows(500, 900, 12, AC.green, AC.brown) + cottonDots(520, 900, 140, 7) +
      figure(330, 820, 230, { pose: "work", top: AC.ochre, low: AC.indigo, skin: AC.skin2, hat: AC.ochreLt });
  },
  family() {
    let out = R(0, 0, 1600, 900, AC.ochre) + R(0, 730, 1600, 170, AC.brownDk);
    out += cabin(980, 730, 520, 430, { wall: AC.brown });
    out += figure(300, 760, 380, { top: AC.indigo, low: AC.brownDk, hat: AC.ochreLt, skin: AC.skin1 });
    out += figure(470, 760, 350, { skirt: true, top: AC.brick, low: AC.indigoLt, wrap: AC.cream, skin: AC.skin2 });
    out += figure(625, 760, 300, { skirt: true, top: AC.green, low: AC.brownDk, wrap: AC.paper2, gray: true, skin: AC.skin3 });
    out += figure(760, 760, 230, { skirt: true, top: AC.cream, low: AC.brick, skin: AC.skin2 });
    out += figure(870, 760, 170, { top: AC.ochreLt, low: AC.indigo, skin: AC.skin1 });
    return out;
  },
  plow() {
    return R(0, 0, 1600, 900, AC.ochreLt) + C(260, 220, 120, AC.cream) +
      fieldRows(430, 900, 10, AC.brown, AC.brownDk) +
      mule(980, 700, 4.2, { color: AC.ink }) +
      L(700, 600, 840, 560, AC.ink, 8) + P([[690, 610], [720, 700], [700, 712]], AC.ink) +
      figure(560, 760, 340, { pose: "work", top: AC.indigo, low: AC.brick, hat: AC.ochre, skin: AC.skin1 });
  },
  bigHouse() {
    return R(0, 0, 1600, 900, AC.sky) +
      P([[0, 520], [500, 260], [1100, 240], [1600, 470], [1600, 900], [0, 900]], AC.green) +
      bigHouse(620, 330, 420, 200) +
      P([[0, 760], [1600, 700], [1600, 900], [0, 900]], AC.greenLt) +
      cabin(160, 820, 260, 190, { wall: AC.brown });
  },
  contractDesk() {
    let out = R(0, 0, 1600, 900, AC.indigo) + P([[0, 420], [1600, 360], [1600, 900], [0, 900]], AC.brown);
    out += P([[520, 470], [1080, 440], [1140, 860], [480, 880]], AC.cream);
    for (let i = 0; i < 11; i++) out += L(540, 520 + i * 30, 1090 - (i < 10 ? 0 : 200), 505 + i * 31, AC.gray, 5, 'opacity="0.7"');
    out += T(800, 840, "X", { size: 70, fill: AC.brick, font: "'Courier Prime', Courier, monospace" });
    out += `<ellipse cx="1290" cy="560" rx="70" ry="24" fill="${AC.ink}"/>` + R(1235, 470, 110, 90, AC.ink);
    out += L(1290, 470, 1180, 260, AC.cream, 6);
    out += P([[200, 900], [330, 560], [420, 600], [360, 900]], AC.skin1);
    return out;
  },
  newspaper15() {
    return R(0, 0, 1600, 900, AC.ochre) + `<g transform="rotate(-3 800 450)">` +
      newspaper(330, 70, 940, 780, "THE COUNTY REPUBLICAN", ["FIFTEENTH", "AMENDMENT RATIFIED"], "The vote may not be denied on account of race") + `</g>`;
  },
  tracker() {
    let out = R(0, 0, 1600, 900, AC.indigo) + R(360, 160, 880, 580, AC.cream);
    for (let i = 0; i < 9; i++) out += L(360, 230 + i * 60, 1240, 230 + i * 60, "#9FB3C2", 2);
    out += L(450, 160, 450, 740, AC.brick, 2);
    out += T(800, 380, "VOTELESS", { size: 120, weight: 900, fill: AC.gray });
    out += L(500, 345, 1100, 345, AC.brick, 16, 'stroke-linecap="round"');
    out += T(800, 590, "LANDLESS", { size: 120, weight: 900 });
    return out;
  },
  senate() {
    let out = R(0, 0, 1600, 900, AC.sky) + R(0, 690, 1600, 210, AC.green);
    out += R(440, 470, 720, 220, AC.cream) + R(700, 380, 200, 90, AC.cream);
    out += `<path d="M640 390 A160 160 0 0 1 960 390 Z" fill="${AC.cream}"/>` + R(790, 180, 20, 60, AC.cream) + C(800, 175, 16, AC.cream);
    for (let i = 0; i < 9; i++) out += R(470 + i * 78, 500, 24, 190, AC.paper2);
    out += figure(800, 860, 300, { top: AC.ink, low: AC.ink, skin: AC.skin1, pose: "down" });
    return out;
  },
  newspaperPanic() {
    let out = R(0, 0, 1600, 900, AC.night) + `<g transform="rotate(2 800 450)">` +
      newspaper(330, 70, 940, 780, "THE DAILY LEDGER", ["PANIC IN", "NEW YORK"], "Jay Cooke & Co. fails. Banks close their doors.") + `</g>`;
    out += P([[1350, 200], [1420, 200], [1420, 600], [1480, 600], [1385, 760], [1290, 600], [1350, 600]], AC.brick);
    return out;
  },
  priceChart() {
    let out = R(0, 0, 1600, 900, AC.cream);
    const ys = CONFIG.years, max = 120, base = 760, top = 160;
    ys.forEach((yr, i) => {
      const v = CONFIG.pricePerBale[yr], h = ((base - top) * v) / max, x = 300 + i * 220;
      out += R(x, base - h, 140, h, yr === 1873 ? AC.brick : AC.indigo);
      out += T(x + 70, base - h - 22, "$" + v, { size: 48, weight: 700, font: "'Courier Prime', Courier, monospace" });
      out += T(x + 70, base + 60, String(yr), { size: 40, weight: 700, font: "'Courier Prime', Courier, monospace" });
    });
    out += L(260, base, 1400, base, AC.ink, 5);
    out += T(800, 110, "Cotton, price per bale (game values)", { size: 40, weight: 700 });
    return out;
  },
  porchLantern() {
    let out = R(0, 0, 1600, 900, AC.night) + C(1320, 160, 60, AC.cream, 'opacity="0.9"');
    out += R(0, 640, 1600, 260, AC.brownDk) + R(200, 220, 1200, 420, AC.indigo) + R(200, 200, 1200, 40, AC.ink);
    for (let i = 0; i < 6; i++) out += R(220 + i * 230, 240, 26, 400, AC.cream, 'opacity="0.85"');
    out += C(820, 420, 160, AC.ochre, 'opacity="0.35"') + R(800, 380, 40, 60, AC.ochreLt) + C(820, 370, 10, AC.cream);
    out += R(940, 520, 220, 20, AC.brown) + R(960, 540, 16, 100, AC.brown) + R(1124, 540, 16, 100, AC.brown);
    out += R(970, 470, 140, 50, AC.cream) + L(1040, 470, 1040, 520, AC.ink, 3);
    out += figure(1060, 640, 260, { top: AC.cream, low: AC.ink, skin: "#C9A27E", pose: "hold" });
    out += figure(600, 700, 330, { top: AC.indigoLt, low: AC.brownDk, skin: AC.skin1, pose: "hat", dir: "right" });
    return out;
  },
  longRows() {
    let out = R(0, 0, 1600, 900, AC.ochreLt) + R(0, 300, 1600, 60, AC.indigo);
    out += fieldRows(340, 900, 14, AC.green, AC.brown) + cottonDots(360, 900, 160, 3);
    [[260, 560, 90], [520, 600, 110], [820, 650, 140], [1180, 720, 190]].forEach(([x, y, h], i) => {
      out += figure(x, y, h, { pose: "work", top: [AC.indigo, AC.brick, AC.cream, AC.ochre][i], low: AC.brownDk, skin: AC.skin1 });
    });
    return out;
  },
  muleRoad() {
    let out = R(0, 0, 1600, 900, AC.sky) + C(1300, 330, 150, AC.ochreLt);
    out += P([[0, 520], [1600, 460], [1600, 900], [0, 900]], AC.greenLt);
    out += P([[620, 900], [780, 470], [880, 470], [1260, 900]], AC.ochre);
    out += R(820, 640, 260, 90, AC.brown) + C(860, 750, 40, AC.ink) + C(1040, 750, 40, AC.ink);
    out += mule(700, 760, 2.6, { color: AC.ink, dir: "left" });
    out += figure(420, 860, 300, { top: AC.indigo, low: AC.brownDk, hat: AC.ochre, skin: AC.skin1 });
    out += figure(1230, 860, 280, { skirt: true, top: AC.brick, low: AC.indigoLt, wrap: AC.cream, skin: AC.skin2 });
    out += figure(1360, 860, 200, { skirt: true, top: AC.cream, low: AC.brick, skin: AC.skin2 });
    return out;
  },
  ownField() {
    let out = R(0, 0, 1600, 900, AC.ochreLt) + fieldRows(420, 900, 10, AC.green, AC.brown) + cottonDots(440, 900, 120, 11);
    out += cabin(1100, 470, 300, 200, { wall: AC.brown });
    out += figure(600, 860, 380, { top: AC.indigo, low: AC.brownDk, hat: AC.ochre, skin: AC.skin1, pose: "hold" });
    out += C(625, 625, 12, AC.ochreLt) + C(640, 618, 12, AC.ochreLt) + C(612, 612, 12, AC.ochreLt);
    return out;
  },
  emptyRoad() {
    let out = R(0, 0, 1600, 900, AC.night) + C(1200, 200, 80, AC.cream);
    out += P([[0, 560], [1600, 520], [1600, 900], [0, 900]], AC.indigo);
    out += P([[700, 900], [790, 540], [830, 540], [1100, 900]], AC.indigoLt);
    out += `<ellipse cx="900" cy="780" rx="60" ry="26" fill="${AC.ochre}"/>`;
    return out;
  },
  emptyDoor() {
    let out = R(0, 0, 1600, 900, AC.brown);
    for (let i = 0; i < 12; i++) out += L(0, i * 75, 1600, i * 75, AC.brownDk, 4, 'opacity="0.5"');
    out += R(560, 150, 480, 750, AC.ink) + R(1040, 150, 40, 750, AC.brownDk);
    out += R(720, 620, 160, 18, AC.brown) + R(730, 638, 14, 120, AC.brown) + R(856, 638, 14, 120, AC.brown) + R(730, 480, 14, 140, AC.brown);
    return out;
  },
  schoolLetters() {
    let out = R(0, 0, 1600, 900, AC.ochre) + R(300, 120, 1000, 460, AC.ink);
    out += T(800, 300, "A  B  C", { size: 140, weight: 400, fill: AC.cream, font: "'Courier Prime', Courier, monospace" });
    out += T(800, 470, "Lucy", { size: 110, weight: 400, fill: AC.cream, font: "'Caveat', 'Segoe Script', cursive" });
    out += R(0, 720, 1600, 180, AC.brownDk);
    out += figure(1100, 860, 300, { skirt: true, top: AC.indigo, low: AC.brick, skin: AC.skin2, pose: "up", dir: "left" });
    return out;
  },
  grandmother() {
    let out = R(0, 0, 1600, 900, AC.night) + C(800, 420, 300, AC.ochre, 'opacity="0.25"');
    out += R(780, 360, 40, 70, AC.ochreLt) + C(800, 350, 12, AC.cream);
    out += figure(540, 820, 360, { skirt: true, top: AC.green, low: AC.brownDk, wrap: AC.paper2, gray: true, skin: AC.skin3, pose: "hold" });
    out += figure(1020, 820, 240, { skirt: true, top: AC.brick, low: AC.indigo, skin: AC.skin2, dir: "left" });
    return out;
  },
};

// Card art, 400 x 240.
const CARD_ART = {
  fieldSun: () => PANEL_ART.fieldSun(),
  rain() {
    let out = R(0, 0, 1600, 900, AC.indigoLt) + fieldRows(520, 900, 10, AC.green, AC.greenLt);
    out += `<ellipse cx="520" cy="200" rx="300" ry="110" fill="${AC.paper2}"/><ellipse cx="900" cy="170" rx="330" ry="130" fill="${AC.cream}"/><ellipse cx="1220" cy="220" rx="260" ry="100" fill="${AC.paper2}"/>`;
    for (let i = 0; i < 40; i++) { const x = (i * 97) % 1600; out += L(x, 300 + (i % 5) * 40, x - 60, 420 + (i % 5) * 40, AC.cream, 8, 'stroke-linecap="round"'); }
    return out;
  },
  drought() {
    let out = R(0, 0, 1600, 900, AC.ochreLt) + C(800, 260, 200, AC.brick) + R(0, 520, 1600, 380, AC.ochre);
    for (let i = 0; i < 18; i++) { const x = 60 + i * 90; out += `<polyline points="${x},540 ${x + 30},640 ${x - 10},720 ${x + 40},900" fill="none" stroke="${AC.brownDk}" stroke-width="7"/>`; }
    return out;
  },
  flood() {
    let out = R(0, 0, 1600, 900, AC.paper2) + fieldRows(380, 900, 8, AC.green, AC.brown);
    for (let i = 0; i < 6; i++) out += `<path d="M0 ${520 + i * 70} Q 200 ${480 + i * 70} 400 ${520 + i * 70} T 800 ${520 + i * 70} T 1200 ${520 + i * 70} T 1600 ${520 + i * 70} V 900 H 0 Z" fill="${i % 2 ? AC.indigo : AC.indigoLt}" opacity="0.9"/>`;
    return out;
  },
  mule() {
    return R(0, 0, 1600, 900, AC.ochre) + R(0, 660, 1600, 240, AC.brownDk) + R(240, 140, 1120, 520, AC.brown, 'opacity="0.6"') + mule(800, 760, 6, { color: AC.ink, down: true });
  },
  sick() {
    let out = R(0, 0, 1600, 900, AC.indigo) + C(1200, 300, 180, AC.ochre, 'opacity="0.35"');
    out += R(260, 560, 900, 60, AC.brown) + R(260, 420, 60, 300, AC.brown) + R(1100, 480, 60, 240, AC.brown);
    out += R(320, 500, 780, 70, AC.cream) + `<ellipse cx="420" cy="500" rx="60" ry="46" fill="${AC.skin2}"/>`;
    out += R(1220, 520, 70, 140, AC.greenLt) + R(1240, 490, 30, 30, AC.ink) + R(1195, 660, 120, 14, AC.brownDk);
    return out;
  },
  school() {
    let out = R(0, 0, 1600, 900, AC.sky) + R(0, 700, 1600, 200, AC.green);
    out += R(520, 380, 560, 320, AC.cream) + P([[480, 380], [800, 180], [1120, 380]], AC.brick);
    out += R(760, 90, 80, 120, AC.cream) + P([[740, 90], [800, 20], [860, 90]], AC.brick) + C(800, 150, 22, AC.ochre);
    out += R(740, 540, 120, 160, AC.indigo) + R(580, 450, 100, 90, AC.indigo) + R(920, 450, 100, 90, AC.indigo);
    return out;
  },
  ballot() {
    let out = R(0, 0, 1600, 900, AC.ochre) + R(520, 380, 560, 420, AC.brown) + R(520, 380, 560, 40, AC.brownDk);
    out += R(700, 360, 200, 20, AC.ink);
    out += `<g transform="rotate(-8 800 250)">` + R(680, 120, 240, 260, AC.cream) + L(710, 180, 890, 180, AC.gray, 8) + L(710, 230, 890, 230, AC.gray, 8) + T(800, 330, "X", { size: 90, fill: AC.brick, font: "'Courier Prime', Courier, monospace" }) + `</g>`;
    return out;
  },
  mulebuy() {
    return R(0, 0, 1600, 900, AC.greenLt) + R(0, 700, 1600, 200, AC.green) + mule(760, 760, 6, { color: AC.brownDk }) +
      L(1080, 380, 1200, 300, AC.ink, 5) + `<g transform="rotate(12 1260 300)">` + R(1170, 240, 200, 120, AC.cream) + T(1270, 325, "$60", { size: 64, font: "'Courier Prime', Courier, monospace" }) + `</g>`;
  },
  eggs() {
    let out = R(0, 0, 1600, 900, AC.ochreLt) + R(0, 700, 1600, 200, AC.brownDk);
    out += `<ellipse cx="800" cy="560" rx="380" ry="80" fill="${AC.brown}"/>` + P([[420, 560], [1180, 560], [1080, 780], [520, 780]], AC.brown);
    out += `<path d="M460 560 Q 800 180 1140 560" fill="none" stroke="${AC.brownDk}" stroke-width="24"/>`;
    [[640, 520], [740, 500], [850, 510], [950, 525], [700, 545], [900, 548]].forEach(([x, y]) => { out += `<ellipse cx="${x}" cy="${y}" rx="44" ry="56" fill="${AC.cream}"/>`; });
    out += P([[1000, 520], [1120, 380], [1080, 540]], AC.green) + P([[1020, 530], [1200, 440], [1100, 550]], AC.greenLt);
    return out;
  },
  headline() { return R(0, 0, 1600, 900, AC.night) + newspaper(300, 60, 1000, 780, "THE COUNTY WEEKLY", ["NIGHT RIDERS", "IN THE COUNTY"], "Families warned to keep inside after dark"); },
  panic() { return PANEL_ART.newspaperPanic(); },
};

// Your own art in art/scenes/ or art/cards/ replaces a drawn panel of the same name.
function customImg(kind, name, label) {
  const src = typeof CUSTOM_ART !== "undefined" && CUSTOM_ART[kind] && CUSTOM_ART[kind][name];
  return src ? `<img class="art-img" src="${src}" alt="${label || ""}">` : null;
}
function sceneSVG(name, label) {
  const mine = customImg("scenes", name, label);
  if (mine) return mine;
  const fn = PANEL_ART[name] || CARD_ART[name] || PANEL_ART.fieldSun;
  return svgWrap(1600, 900, fn(), label);
}
function cardSVG(name, label) {
  const mine = customImg("cards", name, label) || customImg("scenes", name, label);
  if (mine) return mine;
  const fn = CARD_ART[name] || PANEL_ART[name] || PANEL_ART.fieldSun;
  return svgWrap(1600, 900, fn(), label);
}
