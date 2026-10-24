// ============================================================================
// WORLD — a first-person 3D farm. The player walks Papa everywhere himself:
// WASD or arrow keys (on-screen buttons on touchscreens), drag to look.
// Buildings and ground are simple 3D shapes. People, the mule, trees, crops,
// and props are flat 2D cutouts standing in the world. Any cutout can be
// replaced with your own art: see art/README.md.
// If 3D can't start, World.ok stays false and the game runs on flat screens.
// ============================================================================
const World = (() => {
  const T3 = typeof THREE_LIB !== "undefined" ? THREE_LIB : null;
  let renderer, scene, camera, container, tagEl, bubbleEl, compassEl;
  let ok = false;
  const EYE = 1.68;
  const WALK = 4.4, RUN = 7.5;       // meters per second
  const v = {};
  const look = { yaw: 0, pitch: -0.1 };
  const pos = { x: -12, z: 9.5 };
  const keys = {};
  const tweens = [];
  const billboards = [];
  const clickables = [];
  const people = {};
  const plots = [];
  const plants = [];
  const colliders = [];
  const tex = {};
  const mats = {};
  let mode = "locked";               // locked | walk | plan | sow | harvest
  let handlers = {};
  let hovered = null;
  let rain = null, flood = null, school = null, muleCut = null, wagon = null, scaleNeedle = null, flag = null;
  let bubble = null;
  let objective = null;              // { id, x, z, r }
  let wagonFollow = false;
  let groundMats = [];
  let reduceMotion = false;
  let lastT = 0;
  let drag = null;
  let stage = "plan";
  let skyName = "spring";
  let weatherName = "none";
  let porchY = 0.2;                  // the cabin porch, where Lucy and Mother Ruth stand
  const tinted = [];                 // painted materials that dim at dusk
  const propMeshes = [];             // props that only show in some seasons
  let sky = null;                    // the painted sky, if there is one

  // ---- where things are --------------------------------------------------
  const SPOTS = {
    home:   { x: -11.5, z: 10, face: [0, 0, 0] },
    field:  { x: 0, z: 8.6 },
    cabin:  { x: -14, z: 13 },
    store:  { x: 15.9, z: 8.4 },
    wagon:  { x: 12.6, z: -2.6 },     // the loaded wagon waits at the field's east end
    gin:    { x: 12.5, z: 7 },        // the middle of the scale's platform
    ginFront: { x: 12.2, z: 2.8 },    // where Papa stands to watch the needle, clear of the field
    porch:  { x: 0.6, z: -22.8 },
    school: { x: -24.2, z: -9 },
  };

  // ---- terrain -----------------------------------------------------------
  const HILL = { x: 0, z: -31, top: 9, base: 19, h: 2.4 };
  function heightAt(x, z) {
    const d = Math.hypot(x - HILL.x, z - HILL.z);
    if (d <= HILL.top) return HILL.h;
    if (d >= HILL.base) return 0;
    return HILL.h * (HILL.base - d) / (HILL.base - HILL.top);
  }

  // ---- cutout art ------------------------------------------------------------
  const EDGE = `<filter id="e" x="-10%" y="-10%" width="120%" height="120%"><feMorphology operator="dilate" radius="5" in="SourceAlpha" result="d"/><feFlood flood-color="${AC.cream}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  const cut = (w, h, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 2}" height="${h * 2}"><defs>${EDGE}</defs><g filter="url(#e)">${inner}</g></svg>`;
  const svgURL = (svg) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

  const PERSON_H = 420;
  // Built-in drawings. A file in art/sprites/ with the same name replaces one.
  const SPRITES = {
    mama:     () => cut(240, PERSON_H, figure(120, 410, 340, { skirt: true, top: AC.brick, low: AC.indigoLt, wrap: AC.cream, skin: AC.skin2 })),
    lucy:     () => cut(240, PERSON_H, figure(120, 410, 340, { skirt: true, top: AC.cream, low: AC.brick, skin: AC.skin2 })),
    sam:      () => cut(240, PERSON_H, figure(120, 410, 340, { top: AC.ochreLt, low: AC.indigo, skin: AC.skin1 })),
    ruth:     () => cut(240, PERSON_H, figure(120, 410, 340, { skirt: true, top: AC.green, low: AC.brownDk, wrap: AC.paper2, gray: true, skin: AC.skin3, pose: "hold" })),
    holliday: () => cut(240, PERSON_H, figure(120, 410, 340, { top: AC.cream, low: AC.ink, skin: "#C9A27E", hat: AC.ink, pose: "hold" })),
    mamaWork: () => cut(240, PERSON_H, figure(80, 410, 300, { skirt: true, top: AC.brick, low: AC.indigoLt, wrap: AC.cream, skin: AC.skin2, pose: "work" })),
    lucyWork: () => cut(240, PERSON_H, figure(80, 410, 300, { skirt: true, top: AC.cream, low: AC.brick, skin: AC.skin2, pose: "work" })),
    samWork:  () => cut(240, PERSON_H, figure(80, 410, 300, { top: AC.ochreLt, low: AC.indigo, skin: AC.skin1, pose: "work" })),
    mule:     () => cut(400, 260, mule(190, 250, 2.4, { color: AC.brownDk })),
    tree1:    () => cut(300, 420, R(138, 230, 26, 190, AC.brownDk) + C(150, 150, 110, AC.green) + C(90, 200, 70, AC.greenLt) + C(210, 190, 80, AC.green)),
    tree2:    () => cut(300, 420, R(140, 250, 22, 170, AC.brownDk) + P([[150, 20], [270, 270], [30, 270]], AC.green) + P([[150, 80], [240, 300], [60, 300]], "#4D5A2E")),
    cottonSprout: () => cut(200, 200, R(97, 120, 6, 80, AC.green) + P([[100, 130], [40, 90], [70, 140]], AC.greenLt) + P([[100, 120], [165, 85], [130, 135]], AC.greenLt)),
    cottonGrow: () => cut(200, 260, R(96, 120, 8, 140, AC.green) + C(100, 110, 60, AC.green) + C(60, 150, 40, AC.greenLt) + C(140, 145, 42, AC.greenLt)),
    cottonRipe: () => cut(200, 260, R(96, 120, 8, 140, AC.brown) + C(100, 110, 58, "#6E6A3E") + C(60, 150, 40, "#7C7444") + C(140, 145, 42, "#7C7444") +
      [[80, 80], [125, 90], [100, 125], [55, 140], [150, 130], [85, 165], [125, 170], [105, 70]].map(([x, y]) => C(x, y, 17, AC.cotton)).join("")),
    cottonPicked: () => cut(200, 260, R(96, 120, 8, 140, AC.brown) + C(100, 110, 56, "#7C6A44") + C(60, 150, 38, "#8A7448") + C(140, 145, 40, "#8A7448")),
    cornSprout: () => cut(200, 300, R(96, 60, 8, 240, AC.greenLt) + P([[100, 200], [30, 120], [86, 196]], AC.greenLt) + P([[100, 150], [175, 80], [112, 150]], AC.green) + P([[100, 90], [50, 20], [94, 96]], AC.greenLt)),
    cornGrow: () => cut(200, 420, R(95, 60, 10, 360, AC.green) + P([[100, 300], [20, 220], [90, 280]], AC.greenLt) + P([[100, 230], [185, 160], [110, 215]], AC.green) + P([[100, 160], [30, 90], [92, 150]], AC.greenLt) + P([[100, 60], [85, 10], [115, 10]], AC.ochreLt)),
    cornRipe: () => cut(200, 420, R(95, 60, 10, 360, "#A08A4A") + P([[100, 300], [20, 220], [90, 280]], AC.ochre) + P([[100, 230], [185, 160], [110, 215]], "#A08A4A") + `<ellipse cx="122" cy="250" rx="16" ry="40" fill="${AC.ochreLt}"/>` + P([[100, 60], [85, 10], [115, 10]], AC.ochre)),
    cornPicked: () => cut(200, 420, R(95, 60, 10, 360, "#8F7A44") + P([[100, 300], [20, 220], [90, 280]], "#A08A4A") + P([[100, 230], [185, 160], [110, 215]], "#8F7A44")),
    flag:     () => cut(160, 420, R(74, 40, 10, 380, AC.ink) + P([[84, 44], [156, 76], [84, 112]], AC.brick)),
    hills1:   () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 300" width="1600" height="300">${P([[0, 300], [0, 170], [220, 90], [430, 150], [700, 60], [980, 140], [1230, 80], [1600, 160], [1600, 300]], AC.indigoLt)}</svg>`,
    hills2:   () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 300" width="1600" height="300">${P([[0, 300], [0, 210], [300, 140], [560, 200], [820, 120], [1100, 190], [1380, 130], [1600, 200], [1600, 300]], "#6C7A4C")}</svg>`,
    blob:     () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" width="128" height="64"><ellipse cx="50" cy="25" rx="48" ry="22" fill="#1E1B18" opacity="0.28"/></svg>`,
    dial:     () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="256" height="256"><circle cx="100" cy="100" r="94" fill="${AC.cream}" stroke="${AC.ink}" stroke-width="8"/>${Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (0.8 + i * 0.14); return L(100 + 70 * Math.cos(a), 100 + 70 * Math.sin(a), 100 + 86 * Math.cos(a), 100 + 86 * Math.sin(a), AC.ink, 5); }).join("")}</svg>`,
    needle:   () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="256" height="256">${P([[96, 100], [104, 100], [100, 22]], AC.brick)}${C(100, 100, 9, AC.ink)}</svg>`,
  };
  // Height in meters for each cutout, so any art you drop in lands at the right size.
  const HEIGHTS = {
    mama: 1.66, lucy: 1.36, sam: 1.12, ruth: 1.56, holliday: 1.9, mamaWork: 1.5, lucyWork: 1.24, samWork: 1.02,
    mule: 1.6, cottonSprout: 0.5, cottonGrow: 1.0, cottonRipe: 1.05, cottonPicked: 1.0,
    cornSprout: 0.95, cornGrow: 2.1, cornRipe: 2.1, cornPicked: 2.0, flag: 2.6,
  };
  // Optional props. Each appears only if you add its art to art/props/.
  const PROPS = [
    { name: "chickens", x: -10.6, z: 15.8, h: 0.55 },
    { name: "dog", x: -11.8, z: 11.2, h: 0.65 },
    { name: "washtub", x: -15.8, z: 9.6, h: 0.9 },
    { name: "woodpile", x: -20.8, z: 10.8, h: 1.1 },
    { name: "rocker", x: -14.6, z: 15.6, h: 1.1, onPorch: true },
    { name: "well", x: -9.2, z: 18.4, h: 1.8 },
    { name: "bench", x: 19.2, z: 8.6, h: 0.9 },
    { name: "clerk", x: 18.4, z: 8.8, h: 1.75 },
    { name: "neighbors", x: 24, z: -6, h: 1.65 },
    { name: "church", x: -36, z: -24, h: 7 },
    { name: "oak", x: -4, z: 22, h: 9 },
    { name: "fieldhand", x: -30, z: 6, h: 1.65 },
    { name: "clothesline", x: -13.4, z: 18.6, h: 1.9, face: SPOTS.home },
    { name: "baskets", x: 11.3, z: 0.6, h: 1.0, stages: ["ripe", "picked"] },
    { name: "bales", x: 21.8, z: 6.2, h: 1.4 },
    { name: "crates", x: 21.2, z: 9.0, h: 1.3 },
    { name: "ledgerTable", x: -0.7, z: -25.9, h: 1.0, y: HILL.h + 0.4, face: SPOTS.porch },
    { name: "lantern", x: -0.35, z: -25.85, h: 0.42, y: HILL.h + 0.4, onTable: 0.74, skies: ["dusk"], blob: false },
    { name: "rainBarrel", x: -20.5, z: 15.6, h: 1.2 },
    { name: "plow", x: -12.6, z: 4.6, h: 1.1, face: SPOTS.home },
    { name: "outhouse", x: -23.5, z: 18.5, h: 2.4, face: SPOTS.home },
  ];
  // fence (art/props/fence) replaces the drawn rail fence behind the field.
  const custom = (kind, name) => (typeof CUSTOM_ART !== "undefined" && CUSTOM_ART[kind] && CUSTOM_ART[kind][name]) || null;

  // ---- painted surfaces (art/textures) ----------------------------------------
  // Meters per tile. Surfaces that use a painted texture get UVs in meters,
  // so a texture tiles at the same scale on every wall, roof, and road.
  const TILE = { grass: 6, hill: 6, soil: 3.7, road: 3, roofShingle: 2, roofTin: 2.5, wallPlanks: 2.5, wallClapboard: 2.5 };
  const painted = (name) => tex["tx_" + name] || null;
  function meterUV(geo, su, sv, from = 0, to = geo.attributes.uv.count) {
    const uv = geo.attributes.uv;
    for (let i = from; i < to; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
    uv.needsUpdate = true;
    return geo;
  }
  function boxUV(geo, w, h, d) {
    [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]].forEach(([su, sv], f) => meterUV(geo, su, sv, f * 4, f * 4 + 4));
    return geo;
  }
  // A material from a painted texture if you added one, or the drawn color.
  // `tint` colors the painting (a brick-red roof from the shingle texture).
  function surface(color, name, tint = 0xffffff, fallbackMap = null) {
    const t = painted(name);
    const m = t ? lambert(tint, t) : lambert(color, fallbackMap);
    m.userData.painted = !!t;
    return m;
  }

  // ---- painted buildings (art/facades) -----------------------------------------
  // A building is a 3D box and roof wearing three painted flats: a front and
  // two sides. art/facades.json says where each painting's wall corners, base,
  // eave, and ridge are. Each flat is placed so its painted wall lands exactly
  // on the 3D wall, so the front and sides meet at the corners and eaves. The
  // building's depth and wall height come from the paintings' own shapes, so
  // nothing is stretched, and the 3D roof tucks just under the lower painted
  // roof. Roofs, porches, and chimneys painted past the wall stand out past
  // the corners, like the wings of a stage flat.
  const FIT_GUESS = { wall: [0.06, 0.94], base: 0.04, eave: 0.6, ridge: 0.97 };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function measure(name) {
    const t = tex["facade_" + name];
    if (!t) return null;
    const f = { ...FIT_GUESS, ...((typeof FACADE_FIT !== "undefined" && FACADE_FIT[name]) || {}) };
    const w = t.image.width, h = t.image.height;
    return { t, f, iw: w, ih: h, wallW: (f.wall[1] - f.wall[0]) * w, wallH: (f.eave - f.base) * h, roofH: (f.ridge - f.eave) * h };
  }
  // One painted flat. Its wall is `width` x `wallH` meters, its base sits at
  // `at`, and it faces `normal`. Built as a 3 x 3 grid so the wall part can
  // take exactly the wall's size while the rest keeps the painting's scale.
  // `o.cut` drops everything above the eave (a side whose roof the 3D roof
  // replaces); `o.cutAbove` drops it only across some spans of the picture,
  // [[u0, u1], ...]; `o.ridge` re-pitches the painted roof so its peak is that
  // many meters up (a gable side meeting a 3D roof that copies the front).
  function paintedFlat(m, width, wallH, at, normal, mirror, parent, o = {}) {
    const { t, f, iw, ih } = m;
    const [uL, uR] = f.wall;
    const sx = width / ((uR - uL) * iw);       // meters per pixel
    const natural = wallH + (f.ridge - f.eave) * ih * sx;
    const ridgeY = o.ridge || natural;
    const k = f.ridge > f.eave ? (ridgeY - wallH) / ((f.ridge - f.eave) * ih) : sx;   // roof meters per pixel
    const spans = o.cutAbove || [];
    const us = [...new Set([0, uL, uR, 1, ...spans.flat()])].filter((u) => u >= 0 && u <= 1).sort((a, b) => a - b);
    const vs = [0, f.base, f.eave, f.ridge, 1];
    const xs = us.map((u) => (u - (uL + uR) / 2) * iw * sx * (mirror ? -1 : 1));
    const ys = [-f.base * ih * sx, 0, wallH, ridgeY, ridgeY + (1 - f.ridge) * ih * k];
    const n = us.length, pos = [], uv = [], idx = [];
    for (let j = 0; j < 5; j++) for (let i = 0; i < n; i++) { pos.push(xs[i], ys[j], 0); uv.push(us[i], vs[j]); }
    for (let j = 0; j < (o.cut ? 2 : 4); j++) for (let i = 0; i < n - 1; i++) {
      const mid = (us[i] + us[i + 1]) / 2;
      if (j >= 2 && spans.some(([a, b]) => mid > a && mid < b)) continue;
      const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
      if (mirror) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
    const geo = new T3.BufferGeometry();
    geo.setAttribute("position", new T3.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new T3.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeBoundingSphere();
    const mat = new T3.MeshBasicMaterial({ map: t, alphaTest: 0.5 });
    tinted.push(mat);
    const mesh = new T3.Mesh(geo, mat);
    mesh.position.set(at.x, at.y, at.z);
    mesh.rotation.y = Math.atan2(normal.x, normal.z);
    parent.add(mesh);
    return mesh;
  }
  // A wall material cut from a painting's own plain wall (`planks` in
  // facades.json), mirrored as it tiles so the seams don't show.
  function planksFrom(m, metersPerPx, tint) {
    const [u0, v0, u1, v1] = m.f.planks;
    const img = m.t.image, c = document.createElement("canvas");
    const sx = Math.round(u0 * img.width), sy = Math.round((1 - v1) * img.height);
    c.width = Math.max(8, Math.round((u1 - u0) * img.width)); c.height = Math.max(8, Math.round((v1 - v0) * img.height));
    c.getContext("2d").drawImage(img, sx, sy, c.width, c.height, 0, 0, c.width, c.height);
    const t = new T3.CanvasTexture(c);
    t.colorSpace = T3.SRGBColorSpace;
    t.wrapS = t.wrapT = T3.MirroredRepeatWrapping;
    t.repeat.set(1 / (c.width * metersPerPx), 1 / (c.height * metersPerPx));
    const mat = lambert(tint || 0xffffff, t);
    mat.userData.painted = true;
    return mat;
  }
  // s: { at: the middle of the front wall at the ground, f: the way the front
  //   faces, width, length, wall, roof: planned sizes, gable: the roof's gable
  //   faces the front, front/side: painting names, wallMat, roofMat, porch: the
  //   share of the length that is open porch behind the painted front, parent }
  function building(s) {
    const parent = s.parent || scene;
    const F = measure(s.front), S = measure(s.side);
    let W = s.width, L = s.length, H = s.wall, porch = s.porch || 0;
    if (F) H = W * F.wallH / F.wallW;
    if (S) { if (F) L = H * S.wallW / S.wallH; else H = L * S.wallH / S.wallW; }
    H = clamp(H, s.wall * 0.7, s.wall * 1.4);
    L = clamp(L, s.length * 0.7, s.length * 1.6);
    // the 3D walls and gable ends wear the side painting's own planks, if it names some
    if (S && S.f.planks) s = { ...s, wallMat: planksFrom(S, L / S.wallW) };
    if (S && S.f.porch != null) {
      const [a, b] = S.f.wall;
      porch = clamp((S.f.front === "right" ? b - S.f.porch : S.f.porch - a) / (b - a), 0, 0.5);
    }
    // The 3D roof. With a painted front, it copies the front's roofline (ridge
    // height, pitch, and eave overhang) and the sides are cut off at the eave,
    // so the roof seen from the side carries on the front's roof. Without one,
    // it tucks under the lower painted roof, or uses the planned size.
    let R = s.roof, over = F || S ? 0 : 0.4;
    if (F) {
      const sx = W / F.wallW;
      R = F.roofH * sx * 0.98;
      const e = F.f.eaves || F.f.wall;
      over = clamp(((F.f.wall[0] - e[0]) + (e[1] - F.f.wall[1])) / 2 * F.iw * sx * 0.98, 0, 1.2);
    } else if (S) {
      R = S.roofH * L / S.wallW * 0.96;
    }
    const f = s.f, r = { x: f.z, z: -f.x };          // r: to the right, facing the front
    const alongX = Math.abs(f.x) > 0.5;
    const y0 = s.at.y || 0;
    const bodyL = L * (1 - porch);
    const bodyMid = { x: s.at.x - f.x * (L - bodyL / 2), z: s.at.z - f.z * (L - bodyL / 2) };
    const bodyFront = { x: s.at.x - f.x * L * porch, z: s.at.z - f.z * L * porch };
    // the box
    const bw = alongX ? bodyL : W, bd = alongX ? W : bodyL;
    const bgeo = new T3.BoxGeometry(bw, H, bd);
    if (s.wallMat.userData.painted) boxUV(bgeo, bw, H, bd);
    const body = new T3.Mesh(bgeo, s.wallMat);
    body.position.set(bodyMid.x, y0 + H / 2, bodyMid.z);
    parent.add(body);
    // Gable front: the profile runs across the front; the ridge runs back.
    // Eave front: the profile runs front to back; the ridge runs across.
    // Nothing overhangs the front, where it would cover the painting.
    let profW, profH, profY, len, back;
    const roofL = bodyL;
    if (s.gable) {
      const slope = R / (W / 2);
      profW = W + over * 2; profH = R + over * slope; profY = H - over * slope;
      len = roofL - 0.04 + (F ? 0.3 : over * 2); back = F ? 0.04 : -over;
    } else {
      profW = roofL - (F ? 0.04 : -over * 2); profH = R; profY = H;
      // painted gable sides: stop just inside them, or the 3D gable ends cover them
      len = S ? W - 0.06 : W + over * 2; back = F ? 0.04 : -over;
    }
    // One roof, or one per section when the front shows two buildings joined.
    // Each: gable (profile across the front, ridge running back) or eave
    // (profile front to back, ridge running across), at `side` meters to the right.
    const roofs3d = [];
    const addRoof = (gable, pw, ph, py, ln, bk, side, mat) => {
      const reach = gable ? ln : pw;
      const c = { x: s.at.x - f.x * (bk + reach / 2) + r.x * side, z: s.at.z - f.z * (bk + reach / 2) + r.z * side };
      const rf = roof(pw, ph, ln, 0, c.x, y0 + py, c.z, [s.wallMat, mat]);
      if (gable ? alongX : !alongX) rf.rotation.y = Math.PI / 2;
      if (parent !== scene) { scene.remove(rf); parent.add(rf); }
      roofs3d.push(rf);
    };
    const sections = F && F.f.sections;
    if (sections) {
      const [w0, w1] = F.f.wall, sx = W / F.wallW;
      const toR = (u) => ((u - w0) / (w1 - w0) - 0.5) * W;
      let from = w0;
      sections.forEach((sec, i) => {
        const to = i === sections.length - 1 ? w1 : sec.to;
        const width = toR(to) - toR(from), side = (toR(from) + toR(to)) / 2;
        const Rs = sec.rise || (sec.ridge - F.f.eave) * F.ih * sx * 0.98;
        const mat = surface(0x7a4a2e, sec.roof || "roofShingle", sec.roof === "roofShingle" ? 0xa08a78 : 0xffffff);
        // tin is corrugated: turn the ribs to run down the slope, not along the ridge
        if (!sec.gable && mat.map && sec.roof === "roofTin") {
          mat.map = mat.map.clone();
          mat.map.rotation = Math.PI / 2;
          mat.map.needsUpdate = true;
        }
        if (sec.gable) {
          const e = sec.eaves || [from, to];
          const o = clamp(((from - e[0]) + (e[1] - to)) / 2 * F.iw * sx, 0, 1);
          const slope = Rs / (width / 2);
          addRoof(true, width + o * 2, Rs + o * slope, H - o * slope, L + 0.26, 0.04, side, mat);
        } else {
          // its own eave lip over the front and back, at the same pitch
          const lip = 0.35, slope = Rs / (L / 2);
          addRoof(false, L + lip * 2, Rs + lip * slope, H - lip * slope, width - 0.03, -lip, side, mat);
        }
        from = to;
      });
    } else {
      addRoof(s.gable, profW, profH, profY, len, back, 0, s.roofMat);
    }
    // the paintings
    const lift = (p) => ({ x: p.x, y: y0 - 0.02, z: p.z });
    // A roof drawn flat-on over an eave-type section would stand up like a
    // sign; cut it, and let that section's 3D roof show its real slope.
    const cutAbove = [];
    if (F && F.f.sections) {
      let from = F.f.wall[0];
      F.f.sections.forEach((sec, i) => {
        const last = i === F.f.sections.length - 1, to = last ? F.f.wall[1] : sec.to;
        // the neighboring gable's 3D roof supplies its own eave tip, so cut right from the wall
        if (!sec.gable) cutAbove.push([i === 0 ? 0 : from, last ? 1 : to]);
        from = to;
      });
    }
    if (F) paintedFlat(F, W, H, lift({ x: s.at.x + f.x * 0.03, z: s.at.z + f.z * 0.03 }), f, false, parent, { cutAbove });
    if (S) {
      const mid = { x: s.at.x - f.x * L / 2, z: s.at.z - f.z * L / 2 };
      for (const k of [1, -1]) {
        const n = { x: r.x * k, z: r.z * k };
        const ry = Math.atan2(n.x, n.z);
        // which way the painting's left end points, so its front end meets the front
        const leftDot = -(Math.cos(ry) * f.x - Math.sin(ry) * f.z);
        const mirror = (S.f.front === "right") === (leftDot > 0);
        // With a painted front, an eave side loses its roof to the 3D roof; a
        // gable side keeps its painted gable, re-pitched to meet the 3D ridge.
        const cut = !!F && (s.gable || !!sections);
        paintedFlat(S, L, H, lift({ x: mid.x + n.x * (W / 2 + 0.03), z: mid.z + n.z * (W / 2 + 0.03) }), n, mirror, parent,
          { cut, ridge: F && !s.gable ? H + R / 0.98 : null });
        // a cut side's chimney, carried up through the 3D roof as a stack
        const ch = cut && S.f.chimney;
        if (ch) {
          const [c0, cv0, c1, cv1] = ch;
          const uMid = (c0 + c1) / 2, [a, b] = S.f.wall;
          const t = (uMid - a) / (b - a);                  // 0 at the painting's left wall corner
          // a flat is mirrored as needed so its front end is always at the front
          const fromFront = (S.f.front === "right" ? 1 - t : t) * L;
          const cw = (c1 - c0) * S.iw * (L / S.wallW), cd = Math.min(cw, 0.8);
          const outward = S.f.chimneyOutside ? W / 2 + cd / 2 + 0.03 : W / 2 - cd / 2 - 0.3;
          const top = H + R + over * (R / (W / 2)) + 0.5;
          const map = S.t.clone();                        // the painting's own stonework
          map.offset.set(c0, cv0); map.repeat.set(c1 - c0, cv1 - cv0); map.needsUpdate = true;
          const stack = new T3.Mesh(new T3.BoxGeometry(alongX ? cw : cd, top - H + 0.3, alongX ? cd : cw), lambert(0xffffff, map));
          stack.position.set(s.at.x - f.x * fromFront + n.x * outward, y0 + H - 0.3 + (top - H + 0.3) / 2, s.at.z - f.z * fromFront + n.z * outward);
          parent.add(stack);
        }
      }
    }
    // Papa can't walk through the walls
    if (parent === scene) {
      const xs = [s.at.x, s.at.x - f.x * L].map((v) => v), zs = [s.at.z, s.at.z - f.z * L];
      const hw = W / 2 + 0.05;
      const x0 = Math.min(...xs) - (alongX ? 0.05 : hw), x1 = Math.max(...xs) + (alongX ? 0.05 : hw);
      const z0 = Math.min(...zs) - (alongX ? hw : 0.05), z1 = Math.max(...zs) + (alongX ? hw : 0.05);
      colliders.push([x0, z0, x1, z1]);
    }
    // a point on the front painting, from fractions of the picture
    const onFront = (u, v) => {
      if (!F) return null;
      const [uL, uR] = F.f.wall, sx = W / F.wallW;
      const side = (u - (uL + uR) / 2) * F.iw * sx;
      const up = v < F.f.base ? (v - F.f.base) * F.ih * sx : v <= F.f.eave ? (v - F.f.base) / (F.f.eave - F.f.base) * H : H + (v - F.f.eave) * F.ih * sx;
      return { x: s.at.x + r.x * side + f.x * 0.05, y: y0 + up, z: s.at.z + r.z * side + f.z * 0.05 };
    };
    return { W, L, H, R, porch, bodyL, bodyFront, f, r, F: !!F, S: !!S, onFront, frontFit: F && F.f };
  }

  // ---- painted sky and horizon (art/backdrops) ----------------------------------
  // A band wrapped around the world, inside facing in, like a theater cyclorama.
  function wrapMap(t, repeats) {
    const map = t.clone();
    map.wrapS = T3.RepeatWrapping;
    map.repeat.set(-repeats, 1);   // seen from inside, so flip it back the right way
    map.needsUpdate = true;
    return map;
  }
  function band(t, radius, height, repeats, bottom, cutout) {
    const map = wrapMap(t, repeats);
    const mat = new T3.MeshBasicMaterial({ map, side: T3.BackSide, fog: false, alphaTest: cutout ? 0.5 : 0, depthWrite: !!cutout });
    const m = new T3.Mesh(new T3.CylinderGeometry(radius, radius, height, 72, 1, true), mat);
    m.position.y = bottom + height / 2;
    scene.add(m);
    return m;
  }
  // The average color along the top or bottom of a picture, for the fog and sky above.
  const edgeCache = new Map();
  function edgeColor(t, top) {
    const key = t.uuid + top;
    if (edgeCache.has(key)) return edgeCache.get(key);
    const c = t.image, g = c.getContext("2d");
    const rows = Math.max(1, Math.round(c.height * 0.06));
    const d = g.getImageData(0, top ? 0 : c.height - rows, c.width, rows).data;
    let r = 0, gr = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 32) { r += d[i]; gr += d[i + 1]; b += d[i + 2]; n++; }
    const col = new T3.Color().setRGB(r / n / 255, gr / n / 255, b / n / 255, T3.SRGBColorSpace);
    edgeCache.set(key, col);
    return col;
  }

  function loadTexture(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const t = new T3.CanvasTexture(c);
        t.colorSpace = T3.SRGBColorSpace;
        t.anisotropy = 4;
        resolve(t);
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function textTexture(lines, o = {}) {
    const c = document.createElement("canvas");
    c.width = o.w || 512; c.height = o.h || 160;
    const g = c.getContext("2d");
    g.fillStyle = o.bg || AC.cream; g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = AC.ink; g.lineWidth = 8; g.strokeRect(4, 4, c.width - 8, c.height - 8);
    g.fillStyle = o.fg || AC.ink; g.textAlign = "center"; g.textBaseline = "middle";
    lines.forEach((ln, i) => {
      g.font = `${i === 0 ? 800 : 600} ${o.size || 54}px Archivo, "Arial Narrow", sans-serif`;
      g.fillText(ln, c.width / 2, c.height / (lines.length + 1) * (i + 1));
    });
    const t = new T3.CanvasTexture(c);
    t.colorSpace = T3.SRGBColorSpace;
    return t;
  }

  function grainTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = 225 + Math.random() * 30;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const t = new T3.CanvasTexture(c);
    t.wrapS = t.wrapT = T3.RepeatWrapping;
    t.repeat.set(24, 24);
    return t;
  }

  // ---- building blocks ----------------------------------------------------
  const lambert = (color, map) => new T3.MeshLambertMaterial({ color, map: map || null, flatShading: true });
  function box(w, h, d, color, x, y, z, opts = {}) {
    const mat = opts.mat || lambert(color, opts.map);
    const geo = new T3.BoxGeometry(w, h, d);
    if (mat.userData.painted) boxUV(geo, w, h, d);
    const m = new T3.Mesh(geo, mat);
    m.position.set(x, y + h / 2, z);
    if (opts.ry) m.rotation.y = opts.ry;
    scene.add(m);
    return m;
  }
  // A pitched roof. Its gable ends face front and back (z); turn it for the sides.
  // ExtrudeGeometry's UVs are already in meters, so painted roofs tile right.
  function roof(w, h, d, color, x, y, z, mat) {
    const shape = new T3.Shape();
    shape.moveTo(-w / 2, 0); shape.lineTo(0, h); shape.lineTo(w / 2, 0); shape.lineTo(-w / 2, 0);
    const geo = new T3.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    geo.translate(0, 0, -d / 2);
    const m = new T3.Mesh(geo, mat || lambert(color));
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  }
  function planeFor(texName, height) {
    const t = tex[texName];
    const w = height * (t.image.width / t.image.height);
    const geo = new T3.PlaneGeometry(w, height);
    geo.translate(0, height / 2, 0);
    return geo;
  }
  function cutout(texName, height, x, z, o = {}) {
    const mat = new T3.MeshBasicMaterial({ map: tex[texName], transparent: true, alphaTest: 0.35, side: T3.DoubleSide });
    tinted.push(mat);
    const m = new T3.Mesh(planeFor(texName, height), mat);
    m.position.set(x, o.y != null ? o.y : heightAt(x, z), z);
    m.userData.tex = texName;
    m.userData.h = height;
    if (o.billboard !== false) billboards.push(m);
    if (o.blob !== false) {
      const w = height * (tex[texName].image.width / tex[texName].image.height);
      const s = new T3.Mesh(new T3.PlaneGeometry(w * 0.9, w * 0.35), mats.blob);
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, 0.02, 0);
      m.add(s);
    }
    scene.add(m);
    return m;
  }
  function setCutoutTex(m, texName) {
    if (m.userData.tex === texName) return;
    const h = HEIGHTS[texName] || m.userData.h;
    m.geometry.dispose();
    m.geometry = planeFor(texName, h);
    m.material.map = tex[texName];
    m.material.needsUpdate = true;
    m.userData.tex = texName;
    m.userData.h = h;
  }
  function plantMat(name) {
    return mats["plant_" + name] || (mats["plant_" + name] = new T3.MeshBasicMaterial({ map: tex[name], transparent: true, alphaTest: 0.35, side: T3.DoubleSide }));
  }
  function crossed(texName, x, z) {
    const g = new T3.Group();
    for (let i = 0; i < 2; i++) {
      const m = new T3.Mesh(planeFor(texName, HEIGHTS[texName]), plantMat(texName));
      m.rotation.y = i * Math.PI / 2 + 0.4;
      g.add(m);
    }
    g.position.set(x, 0.22, z);
    scene.add(g);
    return g;
  }

  // ---- build the farm -------------------------------------------------------
  function build() {
    const grain = grainTexture();
    mats.blob = new T3.MeshBasicMaterial({ map: tex.blob, transparent: true, depthWrite: false });

    scene.add(new T3.HemisphereLight(0xfff3dc, 0x6b5a3a, 1.7));
    const sun = new T3.DirectionalLight(0xffe7c2, 1.6);
    sun.position.set(-30, 50, 20);
    scene.add(sun);

    const groundMat = surface(0x9a9b5c, "grass", 0xffffff, grain);
    groundMats.push(groundMat);
    const groundGeo = new T3.CircleGeometry(95, 48);
    if (groundMat.userData.painted) meterUV(groundGeo, 190, 190);
    const ground = new T3.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const hillMat = surface(0x8f9355, "hill", 0xffffff, grain);
    groundMats.push(hillMat);
    const hillGeo = new T3.CylinderGeometry(HILL.top, HILL.base, HILL.h, 40, 1);
    if (hillMat.userData.painted) {
      const side = 41 * 2;   // the slope's vertices come first, then the caps
      meterUV(hillGeo, Math.PI * (HILL.top + HILL.base), Math.hypot(HILL.base - HILL.top, HILL.h), 0, side);
      meterUV(hillGeo, HILL.top * 2, HILL.top * 2, side);
    }
    const hill = new T3.Mesh(hillGeo, hillMat);
    hill.position.set(HILL.x, HILL.h / 2 - 0.01, HILL.z);
    scene.add(hill);

    const pathMat = surface(0xb48a56, "road", 0xffffff, grain);
    const strip = (x1, z1, x2, z2, w) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const geo = new T3.PlaneGeometry(w, len);
      if (pathMat.userData.painted) meterUV(geo, w, len);
      const m = new T3.Mesh(geo, pathMat);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = -Math.atan2(x2 - x1, z2 - z1);
      m.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
      scene.add(m);
    };
    strip(-16, 12, 16, 12, 2.2);
    strip(0, 12, 0, -14, 2.2);
    strip(0, -14, 0, -23, 2.2);
    strip(12.5, 12, 12.5, -4, 2);

    // the field: 15 one-acre plots, 5 across and 3 deep
    mats.soil = surface(0x7a4e31, "soil", 0xffffff, grain);
    mats.soilCorn = surface(0x9c7838, "soil", 0xf0d48a, grain);
    mats.soilHover = surface(0xa3703f, "soil", 0xffffff, grain);
    if (mats.soilHover.userData.painted) mats.soilHover.emissive.setHex(0x3a2412);
    const ridgeMat = surface(0x6a4a2c, "soil", 0xc9b8a8, grain);
    const soilUV = (geo, w, h, d) => (mats.soil.userData.painted ? boxUV(geo, w, h, d) : geo);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const i = r * 5 + c;
        const x = (c - 2) * 4.4, z = (r - 1) * 4.4;
        const tile = new T3.Mesh(soilUV(new T3.BoxGeometry(3.7, 0.18, 3.7), 3.7, 0.18, 3.7), mats.soil);
        tile.position.set(x, 0.09, z);
        tile.userData.click = { kind: "plot", index: i };
        scene.add(tile);
        clickables.push(tile);
        for (let k = -1; k <= 1; k++) {
          const ridge = new T3.Mesh(soilUV(new T3.BoxGeometry(3.5, 0.12, 0.42), 3.5, 0.12, 0.42), ridgeMat);
          ridge.position.set(x, 0.22, z + k * 1.1);
          scene.add(ridge);
        }
        const plot = { index: i, x, z, tile, corn: false, plants: [] };
        for (let k = -1; k <= 1; k++) {
          for (let j = 0; j < 4; j++) {
            const px = x - 1.3 + j * 0.86 + (k % 2 ? 0.2 : 0), pz = z + k * 1.1;
            const g = crossed("cottonSprout", px, pz);
            g.children.forEach((m) => { m.userData.click = { kind: "plot", index: i }; clickables.push(m); });
            const p = { group: g, plot: i, sown: false, picked: false, x: px, z: pz, tex: "cottonSprout" };
            plot.plants.push(p);
            plants.push(p);
          }
        }
        plots.push(plot);
      }
    }
    // fence behind the field, with a gate for the road up the hill
    const postMat = lambert(0x5a3a24);
    const fenceArt = tex.prop_fence;
    for (const [a, b] of [[-12.2, -1.6], [1.6, 12.2]]) {
      if (fenceArt) {
        // painted sections, stretched a little so a whole number fits the run
        const h = 1.25, w = h * fenceArt.image.width / fenceArt.image.height;
        const n = Math.max(1, Math.round((b - a) / w)), sw = (b - a) / n;
        const mat = new T3.MeshBasicMaterial({ map: fenceArt, alphaTest: 0.4, side: T3.DoubleSide });
        tinted.push(mat);
        for (let i = 0; i < n; i++) {
          const geo = new T3.PlaneGeometry(sw, h);
          geo.translate(0, h / 2, 0);
          const m = new T3.Mesh(geo, mat);
          m.position.set(a + sw * (i + 0.5), 0, -7.4);
          scene.add(m);
        }
      } else {
        for (let x = a; x <= b + 0.01; x += (b - a) / 5) box(0.16, 1.1, 0.16, 0, x, 0, -7.4, { mat: postMat });
        box(b - a, 0.12, 0.08, 0, (a + b) / 2, 0.85, -7.4, { mat: postMat });
        box(b - a, 0.12, 0.08, 0, (a + b) / 2, 0.45, -7.4, { mat: postMat });
      }
      colliders.push([a, -7.7, b, -7.1]);
    }

    // the cabin: its gable front, with the door and porch, faces the yard (+x)
    const cab = building({ at: { x: -15, z: 13 }, f: { x: 1, z: 0 }, width: 4.2, length: 5, wall: 3, roof: 1.9, gable: true,
      front: "cabinFront", side: "cabinSide", wallMat: surface(0x7a4a2e, "wallPlanks", 0xffffff, grain), roofMat: surface(0x4f2f1d, "roofShingle") });
    if (!cab.F) {
      box(2.2, 0.2, 4.2, 0x5a3a24, -15 + 0.9, 0, 13);                          // porch
      box(1.1, 2, 0.1, 0x1e1b18, -15 + 0.01, 0, 13, { ry: Math.PI / 2 });     // door
      box(0.1, 0.9, 1, 0x1e1b18, -15 + 0.02, 1.4, 13 - 1.4);                  // window
    } else porchY = 0;   // the porch is in the painting; the family stands in front of it
    if (!cab.S) box(0.9, cab.H + 1.4, 0.6, 0x6d5f52, -15 - 3.3, 0, 13 + 2.4, { map: grain });   // stone chimney

    // store and gin house: its front faces the road (-z)
    const st = { x: 17.5, z: 9.5 };
    const store = building({ at: st, f: { x: 0, z: -1 }, width: 7, length: 5, wall: 4, roof: 2, gable: false,
      front: "storeFront", side: "storeSide", wallMat: surface(0xc7b08a, "wallClapboard", 0xe6d3ae, grain), roofMat: surface(0x7a4a2e, "roofTin") });
    if (!store.F) box(1.4, 2.4, 0.1, 0x2e3b56, st.x - 1.6, 0, st.z - 0.01);
    // the sign goes on the painted blank board, or over the door
    const board = store.F && store.frontFit.sign;
    const p0 = board && store.onFront(board[0], board[1]), p1 = board && store.onFront(board[2], board[3]);
    const signW = board ? Math.hypot(p1.x - p0.x, p1.z - p0.z) : 4.2, signH = board ? p1.y - p0.y : 1.1;
    const signOpts = { size: Math.round(46 * Math.min(1, (signH / signW) * 3.8)), w: 512, h: Math.round(512 * signH / signW) };
    const sign = new T3.Mesh(new T3.PlaneGeometry(signW, signH), new T3.MeshBasicMaterial({ map: textTexture(["HOLLIDAY", "STORE & GIN"], signOpts) }));
    if (board) sign.position.set((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2);
    else sign.position.set(st.x + 0.6, Math.min(3.1, store.H - 0.7), st.z - 0.03);
    sign.rotation.y = Math.PI;
    sign.userData.opts = signOpts;
    scene.add(sign);
    mats.storeSign = sign;

    // the gin scale: a heavy timber platform set flush in the ground, a cast-iron
    // dial on a pillar where the man reads the needle, and a tin shed over it all
    const sc = SPOTS.gin;
    const iron = lambert(0x2c2c30), brass = lambert(0xa8823a);
    const timber = surface(0x5a3a24, "wallPlanks", 0x8c7460, grain), deck = surface(0x7a5a3c, "wallPlanks", 0xb8a088, grain);
    const PW = 3.0, PD = 3.6;                                   // platform width (x) and depth (z)
    box(PW + 0.5, 0.14, PD + 0.5, 0, sc.x, -0.02, sc.z, { mat: timber });                 // the pit frame
    for (let i = 0; i < 9; i++) {                                                        // deck planks, with gaps
      const w = PD / 9 - 0.03;
      box(PW, 0.08, w, 0, sc.x, 0.1, sc.z - PD / 2 + (i + 0.5) * (PD / 9), { mat: deck });
    }
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.34, 0.03, 0.34, 0, sc.x + cx * (PW / 2 + 0.04), 0.12, sc.z + cz * (PD / 2 + 0.04), { mat: iron });
    // the dial pillar, at the platform's west side, facing where Papa stands
    const dp = { x: sc.x - PW / 2 - 0.55, z: sc.z - 0.9 };
    const pillar = new T3.Group();
    pillar.position.set(dp.x, 0, dp.z);
    pillar.rotation.y = Math.atan2(SPOTS.ginFront.x - dp.x, SPOTS.ginFront.z - dp.z);
    const pm = (geo, mat, y) => { const m = new T3.Mesh(geo, mat); m.position.y = y; pillar.add(m); return m; };
    pm(new T3.BoxGeometry(0.62, 0.22, 0.62), iron, 0.11);                                // plinth
    pm(new T3.CylinderGeometry(0.2, 0.26, 0.24, 16), iron, 0.34);                        // base
    pm(new T3.CylinderGeometry(0.1, 0.13, 1.25, 16), iron, 1.07);                        // column
    pm(new T3.CylinderGeometry(0.2, 0.12, 0.16, 16), iron, 1.75);                        // capital
    const housing = pm(new T3.CylinderGeometry(0.52, 0.52, 0.2, 40), iron, 2.32);         // the dial's iron case
    housing.rotation.x = Math.PI / 2;
    const rim = pm(new T3.TorusGeometry(0.5, 0.045, 8, 48), brass, 2.32); rim.position.z = 0.1;
    const face = new T3.Mesh(new T3.CircleGeometry(0.47, 48), new T3.MeshBasicMaterial({ map: tex.dial }));
    face.position.set(0, 2.32, 0.105); pillar.add(face); tinted.push(face.material);
    scaleNeedle = new T3.Mesh(new T3.PlaneGeometry(0.94, 0.94), new T3.MeshBasicMaterial({ map: tex.needle, transparent: true }));
    scaleNeedle.position.set(0, 2.32, 0.115); pillar.add(scaleNeedle);
    scaleNeedle.rotation.z = Math.PI * 0.6;
    pm(new T3.SphereGeometry(0.07, 12, 8), brass, 2.32).position.z = 0.13;              // the needle's boss
    const lever = pm(new T3.BoxGeometry(0.08, 0.08, PW / 2), iron, 0.08);                // linkage to the platform
    lever.position.z = -PW / 4; lever.rotation.y = 0;
    scene.add(pillar);
    // a tin shed over the scale, open on all sides
    const SH = 3.7, slope = 0.5;
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const h = SH - (cz > 0 ? slope : 0);
      box(0.16, h, 0.16, 0, sc.x + cx * (PW / 2 + 0.35), 0, sc.z + cz * (PD / 2 + 0.35), { mat: timber });
    }
    for (const cz of [-1, 1]) box(PW + 0.9, 0.16, 0.16, 0, sc.x, SH - (cz > 0 ? slope : 0) - 0.16, sc.z + cz * (PD / 2 + 0.35), { mat: timber });
    const shedRoof = new T3.Mesh(new T3.BoxGeometry(PW + 1.5, 0.05, PD + 1.6), surface(0x8a8a86, "roofTin"));
    if (shedRoof.material.userData.painted) boxUV(shedRoof.geometry, PW + 1.5, 0.05, PD + 1.6);
    shedRoof.position.set(sc.x, SH - slope / 2 + 0.03, sc.z);
    shedRoof.rotation.x = Math.atan2(slope, PD + 0.7);
    scene.add(shedRoof);
    colliders.push([dp.x - 0.35, dp.z - 0.35, dp.x + 0.35, dp.z + 0.35]);
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const px = sc.x + cx * (PW / 2 + 0.35), pz = sc.z + cz * (PD / 2 + 0.35);
      colliders.push([px - 0.12, pz - 0.12, px + 0.12, pz + 0.12]);
    }

    // the big house on the hill: its front and open porch face down the hill (+z)
    const bhFront = { x: 0, y: HILL.h, z: -26.1 };
    const bh = building({ at: bhFront, f: { x: 0, z: 1 }, width: 13, length: 9.9, wall: 6.4, roof: 2.6, gable: false, porch: 2.9 / 9.9,
      front: "bigHouseFront", side: "bigHouseSide", wallMat: surface(0xefe6d2, "wallClapboard", 0xffffff, grain), roofMat: surface(0xa3271f, "roofShingle", 0xe08c7c) });
    const porchD = bh.L * bh.porch;
    box(bh.W, 0.4, porchD, 0xe2d4b6, 0, HILL.h, bhFront.z - porchD / 2);                      // porch floor
    if (!bh.F) {
      for (let i = 0; i < 6; i++) box(0.36, bh.H * 0.72, 0.36, 0xf6efdf, -5.6 + i * 2.24, HILL.h + 0.4, bhFront.z - 0.2);
      box(bh.W, 0.4, porchD + 0.4, 0xe2d4b6, 0, HILL.h + bh.H * 0.78, bhFront.z - porchD / 2);   // porch roof
    }
    // windows and door on the house front, seen past the columns or through the side openings
    const wz = bh.bodyFront.z + 0.03;
    const sash = (x, y) => {
      box(1.36, 1.76, 0.08, 0xf6efdf, x, y - 0.13, wz);            // trim
      box(1.1, 1.5, 0.1, 0x2e3b56, x, y, wz + 0.02);                 // glass
      for (const k of [-1, 1]) box(0.36, 1.6, 0.1, 0x253048, x + k * 0.92, y - 0.05, wz + 0.02);   // shutters
    };
    for (let i = 0; i < 4; i++) { sash(-4.5 + i * 3, HILL.h + bh.H * 0.18); sash(-4.5 + i * 3, HILL.h + bh.H * 0.58); }
    box(1.9, 2.8, 0.08, 0xf6efdf, 0, HILL.h + 0.4, wz);
    box(1.6, 2.6, 0.1, 0x6b5440, 0, HILL.h + 0.4, wz + 0.02);
    // a shaded porch ceiling, so the porch reads as covered through the openings
    if (bh.F) box(bh.W - 0.1, 0.1, porchD - 0.1, 0xb9ad94, 0, HILL.h + bh.H * 0.96, bhFront.z - porchD / 2, { mat: lambert(0xb9ad94) });
    for (let i = 0; i < 3; i++) box(3, 0.14, 0.5, 0xe2d4b6, 0, HILL.h - 0.14 * (i + 1) + 0.28, bhFront.z + 0.4 + i * 0.5);

    // the church school, shown once the school card is drawn; its gable front,
    // with the bell tower, faces +x toward the road
    school = new T3.Group();
    const sch = building({ at: { x: -24.5, z: -9 }, f: { x: 1, z: 0 }, width: 6, length: 5, wall: 3.2, roof: 2.2, gable: true, parent: school,
      front: "schoolFront", side: "schoolSide", wallMat: surface(0xf6efdf, "wallClapboard", 0xffffff, grain), roofMat: surface(0xa3271f, "roofShingle", 0xe08c7c) });
    if (!sch.F) {
      const tower = new T3.Mesh(new T3.BoxGeometry(1.1, 2.4, 1.1), lambert(0xf6efdf));
      tower.position.set(-24.5 - 0.3, sch.H + sch.R * 0.8, -9);
      school.add(tower);
    }
    school.visible = false;
    scene.add(school);

    // trees and distant paper hills
    const treeSpots = [[-30, 18], [-24, 24], [-8, 26], [10, 25], [26, 22], [32, 4], [30, -14], [16, -22], [-16, -22], [-32, -2], [-36, 10], [22, -34], [-22, -36], [38, -26], [-40, -22], [6, 30], [-14, 32]];
    treeSpots.forEach(([x, z], i) => cutout(i % 2 ? "tree1" : "tree2", 6 + (i % 3), x, z));
    // painted sky and horizon bands, where you added them
    if (tex.bd_skyDay || tex.bd_skyDusk) {
      sky = band(tex.bd_skyDay || tex.bd_skyDusk, 150, 177, 3, -20, false);
      sky.renderOrder = -1;
      sky.userData.maps = { day: tex.bd_skyDay && wrapMap(tex.bd_skyDay, 3), dusk: tex.bd_skyDusk && wrapMap(tex.bd_skyDusk, 3) };
    }
    const far = tex.bd_hillsFar && band(tex.bd_hillsFar, 130, 40, 12, -3, true);
    const near = tex.bd_treeLine && band(tex.bd_treeLine, 110, 24, 16, -2, true);
    [far, near].forEach((m) => m && tinted.push(m.material));
    [[110, "hills2", 18], [130, "hills1", 30]].filter(([, t]) => !(t === "hills2" ? near : far)).forEach(([rad, t, h]) => {
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2;
        const m = new T3.Mesh(new T3.PlaneGeometry(rad * 0.58, h), new T3.MeshBasicMaterial({ map: tex[t], transparent: true, fog: false }));
        m.position.set(Math.cos(ang) * rad, h / 2 - 2, Math.sin(ang) * rad);
        m.lookAt(0, h / 2 - 2, 0);
        scene.add(m);
      }
    });

    // optional props from your own art
    PROPS.forEach((p) => {
      if (!tex["prop_" + p.name]) return;
      const y = (p.onPorch ? porchY : p.y != null ? p.y : heightAt(p.x, p.z)) + (p.onTable && tex.prop_ledgerTable ? p.onTable : 0);
      const m = cutout("prop_" + p.name, p.h, p.x, p.z, { y, billboard: !p.face, blob: p.blob });
      // wide things (a clothesline, a plow) keep one facing, toward where Papa usually stands
      if (p.face) m.rotation.y = Math.atan2(p.face.x - p.x, p.face.z - p.z);
      m.userData.click = { kind: "person", id: p.name };
      clickables.push(m);
      if (p.stages || p.skies) propMeshes.push({ m, p });
    });

    // the family and the planter
    people.mama = cutout("mama", HEIGHTS.mama, -12.3, 11.4);
    people.lucy = cutout("lucy", HEIGHTS.lucy, -13.4, 13.8, { y: porchY });
    people.sam = cutout("sam", HEIGHTS.sam, -12.6, 12.6);
    people.ruth = cutout("ruth", HEIGHTS.ruth, -14.4, 14.6, { y: porchY });
    people.holliday = cutout("holliday", HEIGHTS.holliday, 0.6, -25.9, { y: HILL.h + 0.4 });
    Object.entries(people).forEach(([id, m]) => { m.userData.click = { kind: "person", id }; clickables.push(m); });
    muleCut = cutout("mule", HEIGHTS.mule, -9.5, 15.5);
    muleCut.userData.click = { kind: "person", id: "mule" };
    muleCut.userData.home = muleCut.position.clone();
    clickables.push(muleCut);

    // the wagon: a plank farm wagon on spoked wheels, its tongue forward (-z)
    wagon = new T3.Group();
    const wood = surface(0x7d5a3c, "wallPlanks", 0xcdb69a, grain), dark = lambert(0x3e2a1c), ironW = lambert(0x262628);
    const part = (w, h, d, mat, x, y, z, parentG = wagon) => {
      const geo = new T3.BoxGeometry(w, h, d);
      if (mat.userData.painted) boxUV(geo, w, h, d);
      const m = new T3.Mesh(geo, mat); m.position.set(x, y, z); parentG.add(m); return m;
    };
    const wheel = (r, x, z) => {
      const g = new T3.Group(), spin = new T3.Group();   // spin turns as the wagon rolls
      g.add(spin);
      spin.add(new T3.Mesh(new T3.TorusGeometry(r, 0.03, 6, 36), ironW));                       // iron tire
      spin.add(new T3.Mesh(new T3.TorusGeometry(r - 0.06, 0.05, 6, 36), dark));                 // wooden felloe
      const hub = new T3.Mesh(new T3.CylinderGeometry(0.09, 0.11, 0.24, 12), dark); hub.rotation.x = Math.PI / 2; spin.add(hub);
      for (let i = 0; i < 12; i++) {                                                            // spokes
        const sp = new T3.Mesh(new T3.BoxGeometry(0.035, r - 0.1, 0.03), dark);
        const a = (i / 12) * Math.PI * 2;
        sp.position.set(Math.sin(a) * (r - 0.1) / 2, Math.cos(a) * (r - 0.1) / 2, 0); sp.rotation.z = -a; spin.add(sp);
      }
      g.rotation.y = Math.PI / 2;
      g.position.set(x, r, z);
      wagon.add(g);
      spin.userData.r = r;
      return spin;
    };
    const RR = 0.58, FR = 0.45, TRACK = 0.9, REAR = 0.95, FRONT = -1.0;
    wagon.userData.wheels = [wheel(RR, -TRACK, REAR), wheel(RR, TRACK, REAR), wheel(FR, -TRACK, FRONT), wheel(FR, TRACK, FRONT)];
    part(TRACK * 2 + 0.2, 0.08, 0.08, dark, 0, RR, REAR); part(TRACK * 2 + 0.2, 0.08, 0.08, dark, 0, FR, FRONT);     // axles
    part(1.2, 0.16, 0.14, wood, 0, 0.86, REAR); part(1.2, 0.16, 0.14, wood, 0, 0.86, FRONT);                   // bolsters
    part(0.1, 0.08, 2.1, dark, 0, 0.62, (REAR + FRONT) / 2);                                                    // reach
    // the box: floor, two-board sides with stakes, end gates, and a seat
    const BW = 1.12, BL = 3.0, FL = 0.98;
    part(BW, 0.06, BL, wood, 0, FL, 0);
    for (const sx of [-1, 1]) {
      for (const [y, hgt] of [[FL + 0.17, 0.26], [FL + 0.46, 0.24]]) part(0.05, hgt, BL, wood, sx * BW / 2, y, 0);
      for (const z of [-1.2, -0.4, 0.4, 1.2]) part(0.07, 0.7, 0.07, dark, sx * (BW / 2 + 0.05), FL + 0.3, z);
    }
    for (const z of [-BL / 2, BL / 2]) part(BW, 0.56, 0.05, wood, 0, FL + 0.3, z);
    part(BW - 0.1, 0.05, 0.36, wood, 0, FL + 0.66, -1.05);                                                     // seat
    for (const sx of [-1, 1]) part(0.05, 0.3, 0.3, dark, sx * (BW / 2 - 0.1), FL + 0.5, -1.05);
    // the tongue and doubletree, where the mule is hitched
    const tongue = part(0.09, 0.09, 1.9, dark, 0, 0.55, FRONT - 0.95);
    tongue.rotation.x = -0.12;
    part(1.0, 0.07, 0.07, dark, 0, 0.45, FRONT - 1.75);
    wagon.userData.bales = [];
    wagon.position.set(SPOTS.wagon.x, 0, SPOTS.wagon.z);
    wagon.visible = false;
    scene.add(wagon);
    // the bales wear the painted bale's own burlap and ties, if there is one
    if (tex.prop_bales) {
      const img = tex.prop_bales.image, c = document.createElement("canvas");
      c.width = Math.round(img.width * 0.3); c.height = Math.round(img.height * 0.66);
      c.getContext("2d").drawImage(img, img.width * 0.1, img.height * 0.14, c.width, c.height, 0, 0, c.width, c.height);
      const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace;
      mats.bale = lambert(0xffffff, t);
    } else mats.bale = lambert(0xc9a77a);
    mats.baleTie = lambert(0x3a3030);

    // the flag that marks where to go next
    flag = cutout("flag", HEIGHTS.flag, 0, 0, { blob: false });
    flag.visible = false;

    // flood water and rain
    flood = new T3.Mesh(new T3.PlaneGeometry(30, 12), new T3.MeshLambertMaterial({ color: 0x4c5c7e, transparent: true, opacity: 0.78 }));
    flood.rotation.x = -Math.PI / 2;
    flood.position.set(0, 0.32, -1.6);
    flood.visible = false;
    scene.add(flood);
    const drops = new Float32Array(900 * 6);
    const rg = new T3.BufferGeometry();
    rg.setAttribute("position", new T3.BufferAttribute(drops, 3));
    rain = new T3.LineSegments(rg, new T3.LineBasicMaterial({ color: 0xf6efdf, transparent: true, opacity: 0.55 }));
    rain.visible = false;
    rain.frustumCulled = false;
    scene.add(rain);
    for (let i = 0; i < 900; i++) resetDrop(i, true);
  }

  function resetDrop(i, any) {
    const a = rain.geometry.attributes.position.array;
    const x = pos.x + (Math.random() - 0.5) * 40, z = pos.z + (Math.random() - 0.5) * 40;
    const y = any ? Math.random() * 14 : 14;
    a.set([x, y, z, x - 0.08, y - 0.7, z], i * 6);
  }

  // ---- input: drag to look, tap people to talk, tap plots to plan --------------
  let raycaster;
  const isVisible = (m) => { let o = m; while (o) { if (!o.visible) return false; o = o.parent; } return true; };
  function pickAt(clientX, clientY) {
    const r = renderer.domElement.getBoundingClientRect();
    v.ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(v.ndc, camera);
    const hits = raycaster.intersectObjects(clickables.filter(isVisible), false);
    for (const h of hits) if (h.object.userData.click) return { ...h.object.userData.click, distance: h.distance };
    return null;
  }
  function onPointerDown(e) {
    if (mode === "locked") return;
    drag = { x: e.clientX, y: e.clientY, yaw: look.yaw, pitch: look.pitch, moved: false };
    renderer.domElement.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
      if (drag.moved) {
        look.yaw = drag.yaw - dx * 0.0042;
        look.pitch = Math.max(-1.1, Math.min(0.7, drag.pitch - dy * 0.0036));
      }
      return;
    }
    if (mode === "locked" || e.pointerType === "touch") return;
    setHover(pickAt(e.clientX, e.clientY), e.clientX, e.clientY);
  }
  function onPointerUp(e) {
    if (!drag) return;
    const wasDrag = drag.moved;
    drag = null;
    if (wasDrag || mode === "locked") return;
    const hit = pickAt(e.clientX, e.clientY);
    if (!hit) return;
    if (hit.kind === "plot" && mode === "plan") handlers.plot?.(hit.index);
    else if (hit.kind === "person" && hit.distance < 14) handlers.interact?.(hit.id);
  }

  function setHover(hit, x, y) {
    if (hovered && hovered.kind === "plot") plots[hovered.index].tile.material = plots[hovered.index].corn ? mats.soilCorn : mats.soil;
    hovered = hit;
    let label = "";
    if (hit && hit.kind === "plot" && mode === "plan") {
      plots[hit.index].tile.material = mats.soilHover;
      label = plots[hit.index].corn ? "Corn · tap for cotton" : "Cotton · tap for corn";
    } else if (hit && hit.kind === "person" && hit.distance < 14) {
      label = handlers.nameOf?.(hit.id) || "";
    }
    renderer.domElement.style.cursor = label ? "pointer" : (mode === "locked" ? "default" : "grab");
    if (label) {
      tagEl.textContent = label;
      tagEl.hidden = false;
      const r = container.getBoundingClientRect();
      tagEl.style.left = (x - r.left + 14) + "px";
      tagEl.style.top = (y - r.top + 14) + "px";
    } else tagEl.hidden = true;
  }

  const MOVE_KEYS = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "q", "e", "shift"];
  function onKey(e, down) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (!MOVE_KEYS.includes(k)) return;
    keys[k] = down;
    if (mode !== "locked" && k !== "shift") e.preventDefault();
  }

  // ---- movement -------------------------------------------------------------
  function collide(x, z) {
    const pad = 0.35;
    for (const [a, b, c, d] of colliders) {
      if (x > a - pad && x < c + pad && z > b - pad && z < d + pad) {
        const dl = x - (a - pad), dr = c + pad - x, dt = z - (b - pad), db = d + pad - z;
        const m = Math.min(dl, dr, dt, db);
        if (m === dl) x = a - pad; else if (m === dr) x = c + pad; else if (m === dt) z = b - pad; else z = d + pad;
      }
    }
    const rr = Math.hypot(x, z);
    if (rr > 60) { x *= 60 / rr; z *= 60 / rr; }
    return [x, z];
  }
  const angleDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

  function step(dt) {
    if (mode !== "locked") {
      const fwd = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0);
      const side = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
      const turn = (keys.arrowleft || keys.q ? 1 : 0) - (keys.arrowright || keys.e ? 1 : 0);
      look.yaw += turn * dt * 1.7;
      if (fwd || side) {
        const sp = (keys.shift ? RUN : WALK) * dt / (fwd && side ? Math.SQRT2 : 1);
        const fx = -Math.sin(look.yaw), fz = -Math.cos(look.yaw);
        const rx = Math.cos(look.yaw), rz = -Math.sin(look.yaw);
        [pos.x, pos.z] = collide(pos.x + (fx * fwd + rx * side) * sp, pos.z + (fz * fwd + rz * side) * sp);
      }
    }
    camera.position.set(pos.x, heightAt(pos.x, pos.z) + EYE, pos.z);
    camera.rotation.set(look.pitch, look.yaw, 0, "YXZ");

    // walking the rows: Papa plants, or brings in the crop, as he passes
    if (mode === "sow" || mode === "harvest") {
      let changed = false;
      for (const p of plants) {
        if (mode === "harvest" && (!p.group.visible || p.picked)) continue;
        if (mode === "sow" && p.sown) continue;
        if (Math.hypot(p.x - pos.x, p.z - pos.z) < 2.6) {
          if (mode === "sow") { p.sown = true; p.group.visible = true; } else p.picked = true;
          setPlantTex(p, plantTexFor(p));
          pop(p.group);
          changed = true;
        }
      }
      if (changed) handlers.progress?.(progress());
    }

    // the wagon follows behind Papa once it is hitched
    if (wagonFollow) {
      const bx = pos.x + Math.sin(look.yaw) * 5.4, bz = pos.z + Math.cos(look.yaw) * 5.4;
      const k = Math.min(1, dt * 3);
      wagon.position.x += (bx - wagon.position.x) * k;
      wagon.position.z += (bz - wagon.position.z) * k;
      const moved = Math.hypot(bx - wagon.position.x, bz - wagon.position.z) * k;
      wagon.rotation.y += angleDiff(look.yaw, wagon.rotation.y) * k;
      rollWheels(moved);
      // the mule walks just ahead of Papa, on his right, where he can see it
      muleCut.position.set(pos.x - Math.sin(look.yaw) * 3.4 + Math.cos(look.yaw) * 2.2, 0, pos.z - Math.cos(look.yaw) * 3.4 - Math.sin(look.yaw) * 2.2);
    }

    // objectives: arriving at the flag moves the story on
    if (objective) {
      const dx = objective.x - pos.x, dz = objective.z - pos.z;
      const dist = Math.hypot(dx, dz);
      const rel = angleDiff(Math.atan2(-dx, -dz), look.yaw);
      compassEl.style.setProperty("--turn", (-rel * 180 / Math.PI) + "deg");
      compassEl.querySelector(".c-dist").textContent = Math.max(0, Math.round(dist - objective.r)) + " m";
      if (flag.visible) flag.position.y = heightAt(objective.x, objective.z) + Math.sin(performance.now() / 400) * 0.08;
      if (mode !== "locked" && dist < objective.r) {
        const id = objective.id;
        clearObjective();
        handlers.arrive?.(id);
      }
    }

    for (const b of billboards) {
      if (!b.visible) continue;
      b.rotation.y = Math.atan2(camera.position.x - b.position.x, camera.position.z - b.position.z);
    }
    for (let i = tweens.length - 1; i >= 0; i--) {
      const t = tweens[i];
      t.t += dt / t.dur;
      const k = Math.min(1, t.t);
      t.fn(k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, k);
      if (k >= 1) { tweens.splice(i, 1); t.done?.(); }
    }
    if (rain.visible) {
      const a = rain.geometry.attributes.position.array;
      for (let i = 0; i < 900; i++) {
        a[i * 6 + 1] -= dt * 16; a[i * 6 + 4] -= dt * 16;
        if (a[i * 6 + 4] < 0) resetDrop(i, false);
      }
      rain.geometry.attributes.position.needsUpdate = true;
    }
    if (bubble) {
      const m = people[bubble.id] || muleCut;
      v.tmp.copy(m.position); v.tmp.y += (m.userData.h || 1.6) + 0.25;
      v.tmp.project(camera);
      const r = container.getBoundingClientRect();
      if (v.tmp.z < 1 && Math.abs(v.tmp.x) < 1.1) {
        bubbleEl.style.left = ((v.tmp.x + 1) / 2) * r.width + "px";
        bubbleEl.style.top = Math.max(110, ((1 - v.tmp.y) / 2) * r.height) + "px";
        bubbleEl.hidden = false;
      } else bubbleEl.hidden = true;
      bubble.t -= dt;
      if (bubble.t <= 0) { bubble = null; bubbleEl.hidden = true; }
    }
  }

  function progress() {
    const list = mode === "sow" ? plants : plants.filter((p) => p.group.visible);
    if (!list.length) return 1;
    return list.filter((p) => (mode === "sow" ? p.sown : p.picked)).length / list.length;
  }
  function tween(dur, fn, done) {
    if (reduceMotion) { fn(1, 1); done?.(); return; }
    tweens.push({ t: 0, dur, fn, done });
  }
  // turn the wagon wheels as it moves
  function rollWheels(dist) {
    (wagon.userData.wheels || []).forEach((spin) => { spin.rotation.z -= dist / spin.userData.r; });
  }
  function pop(g) {
    tween(0.3, (k, raw) => { const b = 1 + Math.sin(raw * Math.PI) * 0.22; g.scale.set(b, b, b); }, () => g.scale.set(1, 1, 1));
  }

  function loop(t) {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    const dt = Math.min(0.1, (t - lastT) / 1000 || 0.016);
    lastT = t;
    step(dt);
    renderer.render(scene, camera);
  }
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 72 : 60;
    camera.updateProjectionMatrix();
  }

  // ---- crops and seasons ------------------------------------------------------
  function plantTexFor(p) {
    const corn = plots[p.plot].corn;
    if (stage === "plan" || stage === "sown") return corn ? "cornSprout" : "cottonSprout";
    if (stage === "grow") return corn ? "cornGrow" : "cottonGrow";
    if (stage === "ripe") return p.picked ? (corn ? "cornPicked" : "cottonPicked") : (corn ? "cornRipe" : "cottonRipe");
    return corn ? "cornPicked" : "cottonPicked";
  }
  function setPlantTex(p, name) {
    if (p.tex === name) return;
    p.group.children.forEach((m) => {
      m.material = plantMat(name);
      m.geometry.dispose();
      m.geometry = planeFor(name, HEIGHTS[name]);
    });
    p.tex = name;
  }
  function refreshPlants() {
    plots.forEach((plot) => {
      plot.tile.material = plot.corn ? mats.soilCorn : mats.soil;
      plot.plants.forEach((p) => {
        p.group.visible = stage !== "plan" && (stage !== "sown" || p.sown);
        setPlantTex(p, plantTexFor(p));
      });
    });
  }

  const SKIES = {
    spring: [0xe8d6a8, 0x9fa262], summer: [0xe3c587, 0x8c9550], fall: [0xd9b16a, 0xa38f54],
    dusk: [0x3a4466, 0x5b5a40], drought: [0xe7b56a, 0xb9965a],
  };
  // A painted sky is warmed or darkened to suit the season.
  const SKY_TINT = { spring: 0xffffff, summer: 0xfff4e0, fall: 0xf6e2c0, dusk: 0x5c6690, drought: 0xffdcae };
  function setSky(name) {
    skyName = name;
    const [skyHex, grass] = SKIES[name] || SKIES.spring;
    scene.background.setHex(skyHex);
    scene.fog.color.setHex(skyHex);
    // A dusk painting never stands in for the daytime sky; a day sky can be dimmed for dusk.
    const skyTex = name === "dusk" ? tex.bd_skyDusk || tex.bd_skyDay : tex.bd_skyDay;
    if (sky) sky.visible = !!skyTex;
    if (sky && skyTex) {
      const own = name === "dusk" ? tex.bd_skyDusk : tex.bd_skyDay;
      const t = skyTex;
      const maps = sky.userData.maps;
      sky.material.map = t === tex.bd_skyDusk ? maps.dusk : maps.day;
      sky.material.needsUpdate = true;
      sky.material.color.setHex(own ? 0xffffff : SKY_TINT[name] || 0xffffff);
      // the fog fades into the painted horizon; above the band, the top of the sky
      const k = sky.material.color;
      scene.fog.color.copy(edgeColor(t, false)).multiply(k);
      scene.background.copy(edgeColor(t, true)).multiply(k);
    }
    // a painted ground keeps its own colors; the season only tints it
    groundMats.forEach((m) => {
      if (!m.userData.painted) m.color.setHex(grass);
      else if (name === "dusk") m.color.setHex(0x767b96);
      else m.color.setHex(0xffffff).lerp(new T3.Color(grass), 0.25);
    });
    const tint = name === "dusk" ? 0xb8bccc : 0xffffff;
    tinted.forEach((m) => m.color.setHex(tint));
    Object.keys(mats).forEach((k) => { if (k.startsWith("plant_")) mats[k].color.setHex(tint); });
    showProps();
    handlers.sky?.(skyName, weatherName);
  }
  // Seasonal props: cotton baskets at harvest, the lantern at settling time.
  function showProps() {
    propMeshes.forEach(({ m, p }) => {
      m.visible = (!p.stages || p.stages.includes(stage)) && (!p.skies || p.skies.includes(skyName));
    });
  }

  function clearObjective() {
    objective = null;
    if (flag) flag.visible = false;
    if (compassEl) compassEl.hidden = true;
  }

  // ---- start up ---------------------------------------------------------------
  async function init(el) {
    container = el;
    reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || false;
    try {
      if (!T3) throw new Error("3D library missing");
      const test = document.createElement("canvas");
      if (!(test.getContext("webgl2") || test.getContext("webgl"))) throw new Error("no webgl");
      v.ndc = new T3.Vector2(); v.tmp = new T3.Vector3();
      raycaster = new T3.Raycaster();
      renderer = new T3.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = T3.SRGBColorSpace;
      el.prepend(renderer.domElement);
      renderer.domElement.className = "world-canvas";
      renderer.domElement.setAttribute("role", "img");
      renderer.domElement.setAttribute("aria-label", "The farm, seen through Papa's eyes. Use W A S D or the arrow keys to walk, and drag to look around.");
      scene = new T3.Scene();
      scene.background = new T3.Color(SKIES.spring[0]);
      scene.fog = new T3.Fog(SKIES.spring[0], 45, 140);
      camera = new T3.PerspectiveCamera(60, 1, 0.1, 400);

      const jobs = Object.keys(SPRITES).map(async (n) => {
        const mine = custom("sprites", n);
        tex[n] = (mine && await loadTexture(mine)) || await loadTexture(svgURL(SPRITES[n]()));
      });
      [...PROPS.map((p) => p.name), "fence"].forEach((n) => {
        const src = custom("props", n);
        if (src) jobs.push(loadTexture(src).then((t) => { if (t) tex["prop_" + n] = t; }));
      });
      // painted building fronts, ground and wall textures, sky and horizon
      for (const [kind, prefix] of [["facades", "facade_"], ["textures", "tx_"], ["backdrops", "bd_"]]) {
        const all = (typeof CUSTOM_ART !== "undefined" && CUSTOM_ART[kind]) || {};
        Object.entries(all).forEach(([n, src]) => jobs.push(loadTexture(src).then((t) => {
          if (!t) return;
          if (kind === "textures") {
            t.wrapS = t.wrapT = T3.RepeatWrapping;
            t.repeat.set(1 / (TILE[n] || 3), 1 / (TILE[n] || 3));
          }
          tex[prefix + n] = t;
        })));
      }
      await Promise.all(jobs);
      if (Object.keys(SPRITES).some((n) => !tex[n])) throw new Error("art failed to load");

      build();
      refreshPlants();
      tagEl = el.querySelector(".world-tag");
      bubbleEl = document.querySelector(".world-bubble");
      compassEl = document.querySelector("#compass");
      const c = renderer.domElement;
      c.addEventListener("pointerdown", onPointerDown);
      c.addEventListener("pointermove", onPointerMove);
      c.addEventListener("pointerup", onPointerUp);
      c.addEventListener("pointercancel", () => { drag = null; });
      c.addEventListener("pointerleave", () => { if (!drag) setHover(null); });
      window.addEventListener("keydown", (e) => onKey(e, true));
      window.addEventListener("keyup", (e) => onKey(e, false));
      window.addEventListener("blur", () => Object.keys(keys).forEach((k) => { keys[k] = false; }));
      new ResizeObserver(resize).observe(el);
      resize();
      ok = true;
      requestAnimationFrame(loop);
      return true;
    } catch (err) {
      console.warn("3D world unavailable, using flat screens.", err);
      ok = false;
      return false;
    }
  }

  return {
    get ok() { return ok; },
    get debug() { return { x: pos.x, z: pos.z, yaw: look.yaw, mode, objective: objective && objective.id, ox: objective && objective.x, oz: objective && objective.z }; },
    init,
    on(h) { handlers = { ...handlers, ...h }; },
    setMode(m) {
      mode = m;
      if (!ok) return;
      renderer.domElement.style.cursor = m === "locked" ? "default" : "grab";
      if (m === "locked") { setHover(null); Object.keys(keys).forEach((k) => { keys[k] = false; }); }
    },
    // A cut between scenes, such as a new year starting at home.
    place(name) {
      const p = SPOTS[name];
      if (!ok || !p) return;
      pos.x = p.x; pos.z = p.z;
      if (p.face) look.yaw = Math.atan2(-(p.face[0] - p.x), -(p.face[2] - p.z));
      look.pitch = -0.1;
    },
    // Put a flag where Papa should walk next. Arriving calls on({arrive}).
    objective(id, spot, r = 2.6) {
      if (!ok) { setTimeout(() => handlers.arrive?.(id), 0); return; }
      const p = SPOTS[spot] || spot;
      objective = { id, x: p.x, z: p.z, r };
      flag.position.set(p.x, heightAt(p.x, p.z), p.z);
      flag.visible = true;
      compassEl.hidden = false;
    },
    clearObjective() { if (ok) clearObjective(); },
    press(k, down) { keys[k] = down; },
    setCorn(set) {
      if (!ok) return;
      plots.forEach((p) => { p.corn = set.has(p.index); });
      refreshPlants();
    },
    setStage(s) {
      stage = s;
      if (!ok) return;
      if (s === "plan") plants.forEach((p) => { p.sown = false; p.picked = false; });
      if (s === "grow") plants.forEach((p) => { p.sown = true; p.picked = false; });
      refreshPlants();
      showProps();
    },
    // The family finishes whatever rows Papa didn't walk.
    finishRows() {
      if (!ok) return;
      plants.forEach((p) => { if (stage === "sown") p.sown = true; else if (p.group.visible) p.picked = true; });
      refreshPlants();
    },
    progress() { return ok ? progress() : 1; },
    setSky(name) { if (ok) setSky(name); else { skyName = name; handlers.sky?.(skyName, weatherName); } },
    setWeather(w) {
      weatherName = w;
      if (!ok) { handlers.sky?.(skyName, weatherName); return; }
      rain.visible = w === "rain";
      flood.visible = w === "flood";
      plots.forEach((p) => p.plants.forEach((pl) => { if (p.corn && w === "flood") pl.group.visible = false; }));
      if (w === "drought") setSky("drought");
      else handlers.sky?.(skyName, weatherName);
    },
    setFlags({ mule: muleState, school: schoolOn } = {}) {
      if (!ok) return;
      if (muleState != null) muleCut.visible = muleState !== "none";
      if (schoolOn != null) school.visible = schoolOn;
    },
    setPeople(where) {
      if (!ok) return;
      const spots = {
        home: { mama: [-12.3, 11.4, "mama"], lucy: [-13.4, 13.8, "lucy", porchY], sam: [-12.6, 12.6, "sam"], ruth: [-14.4, 14.6, "ruth", porchY] },
        field: { mama: [-6.6, 4.4, "mamaWork"], lucy: [4.4, 0, "lucyWork"], sam: [6.6, -4.4, "samWork"], ruth: [-13.9, 12.4, "ruth"] },
        porch: { mama: [1.8, -21.8, "mama"], lucy: [-13.4, 13.8, "lucy", porchY], sam: [-12.6, 12.6, "sam"], ruth: [-14.4, 14.6, "ruth", porchY] },
      }[where] || {};
      Object.entries(spots).forEach(([id, [x, z, t, y]]) => {
        const m = people[id];
        m.position.set(x, y != null ? y : heightAt(x, z), z);
        setCutoutTex(m, t);
      });
    },
    hush() { bubble = null; if (bubbleEl) bubbleEl.hidden = true; },
    say(id, text, seconds = 5) {
      if (!ok || !bubbleEl) return;
      bubbleEl.textContent = text;
      bubble = { id, t: seconds };
    },
    // Harvest: bales go on the wagon, which waits at the end of the field.
    readyWagon(bales) {
      if (!ok) return;
      wagon.userData.bales.forEach((b) => wagon.remove(b));
      wagon.userData.bales = [];
      // bales laid flat, two across and two along, then a second layer
      const n = Math.max(1, Math.round(bales));
      for (let i = 0; i < n; i++) {
        const b = new T3.Mesh(new T3.BoxGeometry(0.5, 0.48, 1.0), mats.bale);
        const layer = Math.floor(i / 4), slot = i % 4;
        b.position.set((slot % 2) * 0.52 - 0.26, 1.25 + layer * 0.49, -0.1 + Math.floor(slot / 2) * 1.04);
        for (const z of [-0.3, 0, 0.3]) {
          const tie = new T3.Mesh(new T3.BoxGeometry(0.52, 0.5, 0.03), mats.baleTie);
          tie.position.z = z; b.add(tie);
        }
        wagon.add(b);
        wagon.userData.bales.push(b);
      }
      wagon.position.set(SPOTS.wagon.x, 0, SPOTS.wagon.z - 1.2);
      wagon.rotation.y = 0;
      wagon.visible = true;
      muleCut.visible = true;
      muleCut.position.set(SPOTS.wagon.x + 0.7, 0, SPOTS.wagon.z - 1.2 - 3.4);   // at the end of the tongue
      scaleNeedle.rotation.z = Math.PI * 0.6;
    },
    hitchWagon() { if (ok) wagonFollow = true; },
    // Papa has led the wagon onto the scale. The needle swings to his weight.
    weigh(scaleLbs, maxLbs) {
      if (!ok) return Promise.resolve();
      wagonFollow = false;
      // the wagon rolls onto the platform, the mule beyond it; Papa turns to the dial
      wagon.position.set(SPOTS.gin.x, 0.18, SPOTS.gin.z + 0.2);   // on top of the deck planks
      wagon.rotation.y = Math.PI;
      muleCut.position.set(SPOTS.gin.x + 0.5, 0, SPOTS.gin.z + 3.8);
      // look between the dial and the loaded wagon, nearer the dial, so both are in view
      const dial = scaleNeedle.parent;
      const tx = dial.position.x * 0.62 + SPOTS.gin.x * 0.38, tz = dial.position.z * 0.62 + SPOTS.gin.z * 0.38;
      const want = Math.atan2(-(tx - pos.x), -(tz - pos.z));
      const y0 = look.yaw, p0 = look.pitch, dy = angleDiff(want, y0);
      tween(0.9, (k) => { look.yaw = y0 + dy * k; look.pitch = p0 + (0.05 - p0) * k; });
      return new Promise((resolve) => {
        const frac = Math.min(1, scaleLbs / maxLbs);
        const rest = Math.PI * 0.6, to = rest - frac * Math.PI * 1.4;
        // the needle swings past, wobbles, and settles, the way a spring dial does
        setTimeout(() => tween(2.4, (k, raw) => {
          const wob = Math.sin(raw * Math.PI * 3) * Math.exp(-raw * 3) * 0.18;
          scaleNeedle.rotation.z = rest + (to - rest) * k - wob;
        }, resolve), 600);
      });
    },
    resetWagon() {
      if (!ok) return;
      wagonFollow = false;
      wagon.visible = false;
      muleCut.position.copy(muleCut.userData.home);
    },
    setPlanter(name) {
      if (!ok || mats.storeSign.userData.name === name) return;
      mats.storeSign.material.map?.dispose();
      mats.storeSign.material.map = textTexture([name.toUpperCase(), "STORE & GIN"], mats.storeSign.userData.opts);
      mats.storeSign.material.needsUpdate = true;
      mats.storeSign.userData.name = name;
    },
    // For the automated playtest only: jump Papa to a point.
    _teleport(x, z, yaw) { pos.x = x; pos.z = z; if (yaw != null) look.yaw = yaw; },
  };
})();
