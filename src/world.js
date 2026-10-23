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
  const tinted = [];                 // painted materials that dim at dusk
  const propMeshes = [];             // props that only show in some seasons
  let sky = null;                    // the painted sky, if there is one

  // ---- where things are --------------------------------------------------
  const SPOTS = {
    home:   { x: -11.5, z: 10, face: [0, 0, 0] },
    field:  { x: 0, z: 8.6 },
    cabin:  { x: -14, z: 13 },
    store:  { x: 15.9, z: 8.4 },
    wagon:  { x: 12.5, z: 2 },
    gin:    { x: 13.6, z: 8 },
    ginFront: { x: 11.6, z: 5.2 },
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
    { name: "rocker", x: -14.6, z: 15.6, h: 1.1, y: 0.2 },
    { name: "well", x: -9.2, z: 18.4, h: 1.8 },
    { name: "bench", x: 19.2, z: 8.6, h: 0.9 },
    { name: "clerk", x: 18.4, z: 8.8, h: 1.75 },
    { name: "neighbors", x: 24, z: -6, h: 1.65 },
    { name: "church", x: -36, z: -24, h: 7 },
    { name: "oak", x: -4, z: 22, h: 9 },
    { name: "fieldhand", x: -30, z: 6, h: 1.65 },
    { name: "clothesline", x: -13.4, z: 18.6, h: 1.9, face: SPOTS.home },
    { name: "baskets", x: 11.4, z: -3.4, h: 1.0, stages: ["ripe", "picked"] },
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

  // ---- painted building fronts (art/facades) ----------------------------------
  // Each stands on its 3D building like a stage flat. The width is set here;
  // the height comes from the picture, so the roofline is the painter's.
  const flats = {};
  function flat(name, w, x, y, z, ry, parent = scene) {
    const t = tex["facade_" + name];
    if (!t) return null;
    const h = w * t.image.height / t.image.width;
    const geo = new T3.PlaneGeometry(w, h);
    geo.translate(0, h / 2, 0);
    const mat = new T3.MeshBasicMaterial({ map: t, alphaTest: 0.5 });
    tinted.push(mat);
    const m = new T3.Mesh(geo, mat);
    m.position.set(x, y - 0.04, z);
    m.rotation.y = ry;
    parent.add(m);
    (flats[name] = flats[name] || []).push(m);
    // Papa can't walk into a flat
    if (parent === scene) {
      const along = Math.abs(Math.sin(ry)) > 0.5 ? "z" : "x";
      colliders.push(along === "x" ? [x - w / 2, z - 0.08, x + w / 2, z + 0.08] : [x - 0.08, z - w / 2, x + 0.08, z + w / 2]);
    }
    return m;
  }
  const hasFlat = (name) => !!tex["facade_" + name];
  // With a painted side, the 3D wall and roof take that painting's height,
  // so the roof never pokes out above the painted roofline.
  function fit(side, w, wallH, roofH) {
    const t = tex["facade_" + side];
    if (!t) return [wallH, roofH];
    const k = Math.min(1.3, Math.max(0.7, (w * t.image.height / t.image.width - 0.06) / (wallH + roofH)));
    return [wallH * k, roofH * k];
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
    strip(12.5, 12, 12.5, 2, 2);

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

    // the cabin
    // Its gable front (door and porch) faces the yard, +x; the long sides are
    // the eave walls, as in the painted cabinFront and cabinSide.
    const cab = { x: -17.5, z: 13 };
    const [cw, cr] = fit("cabinSide", 5.4, 3, 1.9);
    box(5, cw, 4.2, 0x7a4a2e, cab.x, 0, cab.z, { mat: surface(0x7a4a2e, "wallPlanks", 0xffffff, grain) });
    roof(5.8, cr, 5.4, 0x4f2f1d, cab.x, cw, cab.z, surface(0x4f2f1d, "roofShingle")).rotation.y = Math.PI / 2;
    box(2.2, 0.2, 4.2, 0x5a3a24, cab.x + 3.4, 0, cab.z);
    if (!flat("cabinFront", 5.8, cab.x + 2.73, 0, cab.z, Math.PI / 2)) {
      box(1.1, 2, 0.1, 0x1e1b18, cab.x + 2.51, 0, cab.z, { ry: Math.PI / 2 });
      box(0.1, 0.9, 1, 0x1e1b18, cab.x + 2.52, 1.4, cab.z - 1.4);
    }
    if (!hasFlat("cabinSide")) box(0.9, 4.4, 0.6, 0x6d5f52, cab.x - 0.8, 0, cab.z + 2.4, { map: grain });   // stone chimney
    flat("cabinSide", 5.4, cab.x, 0, cab.z + 2.93, 0);
    flat("cabinSide", 5.4, cab.x, 0, cab.z - 2.93, Math.PI);
    colliders.push([cab.x - 2.6, cab.z - 2.2, cab.x + 2.6, cab.z + 2.2]);

    // store and gin house
    // Its front faces the road, -z; the tin roof's gables are the sides.
    const st = { x: 17.5, z: 12 };
    const [stW, stR] = fit("storeSide", 5.6, 4, 2);
    box(7, stW, 5, 0xc7b08a, st.x, 0, st.z, { mat: surface(0xc7b08a, "wallClapboard", 0xe6d3ae, grain) });
    roof(5.6, stR, 7.8, 0x7a4a2e, st.x, stW, st.z, surface(0x7a4a2e, "roofTin")).rotation.y = Math.PI / 2;
    const storeFlat = flat("storeFront", 7.8, st.x, 0, st.z - 2.83, Math.PI);
    if (!storeFlat) box(1.4, 2.4, 0.1, 0x2e3b56, st.x - 1.6, 0, st.z - 2.51);
    flat("storeSide", 5.6, st.x + 3.93, 0, st.z, Math.PI / 2);
    flat("storeSide", 5.6, st.x - 3.93, 0, st.z, -Math.PI / 2);
    const sign = new T3.Mesh(new T3.PlaneGeometry(4.2, 1.1), new T3.MeshBasicMaterial({ map: textTexture(["HOLLIDAY", "STORE & GIN"], { size: 46 }) }));
    sign.position.set(st.x + 0.6, storeFlat ? 3.1 : Math.min(3.1, stW - 0.7), st.z - (storeFlat ? 2.9 : 2.53));
    sign.rotation.y = Math.PI;
    scene.add(sign);
    mats.storeSign = sign;
    colliders.push([st.x - 3.6, st.z - 2.6, st.x + 3.6, st.z + 2.6]);

    // the gin scale
    const sc = SPOTS.gin;
    box(2.4, 0.25, 2.4, 0x5a3a24, sc.x, 0, sc.z);
    box(0.25, 2.6, 0.25, 0x3e2718, sc.x + 1.3, 0, sc.z - 1.3);
    const dial = new T3.Mesh(new T3.PlaneGeometry(1.1, 1.1), new T3.MeshBasicMaterial({ map: tex.dial, transparent: true, side: T3.DoubleSide }));
    dial.position.set(sc.x + 1.3, 2.7, sc.z - 1.15);
    dial.rotation.y = -0.6;
    scene.add(dial);
    scaleNeedle = new T3.Mesh(new T3.PlaneGeometry(1.1, 1.1), new T3.MeshBasicMaterial({ map: tex.needle, transparent: true, side: T3.DoubleSide }));
    scaleNeedle.position.set(0, 0, 0.01);
    dial.add(scaleNeedle);
    scaleNeedle.rotation.z = Math.PI * 0.6;
    colliders.push([sc.x - 1.2, sc.z - 1.2, sc.x + 1.5, sc.z + 1.2]);

    // the big house on the hill
    // Its front and porch face down the hill, +z; the roof's gables are the sides.
    const bh = { x: 0, z: -32.5, y: HILL.h };
    const [bw, br] = fit("bigHouseSide", 10.4, 6.4, 2.6);
    box(13, bw, 7, 0xefe6d2, bh.x, bh.y, bh.z, { mat: surface(0xefe6d2, "wallClapboard", 0xffffff, grain) });
    roof(7.8, br, 14, 0xa3271f, bh.x, bh.y + bw, bh.z, surface(0xa3271f, "roofShingle", 0xe08c7c)).rotation.y = Math.PI / 2;
    box(13, 0.4, 3, 0xe2d4b6, bh.x, bh.y, bh.z + 5);
    // the painted front stands at the porch's edge, columns and all
    if (!flat("bigHouseFront", 14, bh.x, bh.y, bh.z + 6.4, 0)) {
      for (let i = 0; i < 6; i++) box(0.36, 4.6, 0.36, 0xf6efdf, bh.x - 5.6 + i * 2.24, bh.y + 0.4, bh.z + 6.2);
      box(13, 0.4, 3.4, 0xe2d4b6, bh.x, bh.y + 5, bh.z + 5);
    }
    flat("bigHouseSide", 10.4, bh.x + 7.03, bh.y, bh.z + 1.3, Math.PI / 2);
    flat("bigHouseSide", 10.4, bh.x - 7.03, bh.y, bh.z + 1.3, -Math.PI / 2);
    for (let i = 0; i < 4; i++) box(1.1, 1.5, 0.1, 0x2e3b56, bh.x - 4.5 + i * 3, bh.y + 1.4, bh.z + 3.52);
    box(1.6, 2.6, 0.1, 0x2e3b56, bh.x, bh.y + 0.4, bh.z + 3.53);
    for (let i = 0; i < 3; i++) box(3, 0.14, 0.5, 0xe2d4b6, bh.x, bh.y - 0.14 * (i + 1) + 0.28, bh.z + 6.8 + i * 0.5);
    colliders.push([bh.x - 6.8, bh.z - 3.6, bh.x + 6.8, bh.z + 6.5]);

    // the church school, shown once the school card is drawn
    school = new T3.Group();
    const sx = -27, sz = -9;
    // Its gable front, with the bell tower, faces +x toward the road.
    const wallMat = surface(0xf6efdf, "wallClapboard", 0xffffff, grain);
    const [hw, hr] = fit("schoolSide", 5.8, 3.2, 2.2);
    const sbGeo = new T3.BoxGeometry(5, hw, 6);
    if (wallMat.userData.painted) boxUV(sbGeo, 5, hw, 6);
    const sb = new T3.Mesh(sbGeo, wallMat);
    sb.position.set(sx, hw / 2, sz); school.add(sb);
    const sr = roof(6.6, hr, 5.8, 0xa3271f, sx, hw, sz, surface(0xa3271f, "roofShingle", 0xe08c7c)); scene.remove(sr); sr.rotation.y = Math.PI / 2; school.add(sr);
    if (!flat("schoolFront", 6.6, sx + 2.93, 0, sz, Math.PI / 2, school)) {
      const st2 = new T3.Mesh(new T3.BoxGeometry(1.1, 2.4, 1.1), lambert(0xf6efdf)); st2.position.set(sx + 2.2, 5, sz); school.add(st2);
    }
    flat("schoolSide", 5.8, sx, 0, sz + 3.33, 0, school);
    flat("schoolSide", 5.8, sx, 0, sz - 3.33, Math.PI, school);
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
      const y = (p.y != null ? p.y : heightAt(p.x, p.z)) + (p.onTable && tex.prop_ledgerTable ? p.onTable : 0);
      const m = cutout("prop_" + p.name, p.h, p.x, p.z, { y, billboard: !p.face, blob: p.blob });
      // wide things (a clothesline, a plow) keep one facing, toward where Papa usually stands
      if (p.face) m.rotation.y = Math.atan2(p.face.x - p.x, p.face.z - p.z);
      m.userData.click = { kind: "person", id: p.name };
      clickables.push(m);
      if (p.stages || p.skies) propMeshes.push({ m, p });
    });

    // the family and the planter
    people.mama = cutout("mama", HEIGHTS.mama, -12.3, 11.4);
    people.lucy = cutout("lucy", HEIGHTS.lucy, -13.4, 13.8, { y: 0.2 });
    people.sam = cutout("sam", HEIGHTS.sam, -12.6, 12.6);
    people.ruth = cutout("ruth", HEIGHTS.ruth, -14.4, 14.6, { y: 0.2 });
    people.holliday = cutout("holliday", HEIGHTS.holliday, 0.6, -25.9, { y: HILL.h + 0.4 });
    Object.entries(people).forEach(([id, m]) => { m.userData.click = { kind: "person", id }; clickables.push(m); });
    muleCut = cutout("mule", HEIGHTS.mule, -9.5, 15.5);
    muleCut.userData.click = { kind: "person", id: "mule" };
    muleCut.userData.home = muleCut.position.clone();
    clickables.push(muleCut);

    // the wagon
    wagon = new T3.Group();
    const bed = new T3.Mesh(new T3.BoxGeometry(1.6, 0.5, 2.6), lambert(0x7a4a2e));
    bed.position.y = 0.9; wagon.add(bed);
    for (const [wx, wz] of [[-0.85, -0.9], [0.85, -0.9], [-0.85, 0.9], [0.85, 0.9]]) {
      const wh = new T3.Mesh(new T3.CylinderGeometry(0.5, 0.5, 0.12, 12), lambert(0x3e2718));
      wh.rotation.z = Math.PI / 2; wh.position.set(wx, 0.5, wz); wagon.add(wh);
    }
    wagon.userData.bales = [];
    wagon.position.set(SPOTS.wagon.x, 0, SPOTS.wagon.z);
    wagon.visible = false;
    scene.add(wagon);

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
      const bx = pos.x + Math.sin(look.yaw) * 3.4, bz = pos.z + Math.cos(look.yaw) * 3.4;
      const k = Math.min(1, dt * 3);
      wagon.position.x += (bx - wagon.position.x) * k;
      wagon.position.z += (bz - wagon.position.z) * k;
      wagon.rotation.y += angleDiff(look.yaw, wagon.rotation.y) * k;
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
    setSky(name) { if (ok) setSky(name); },
    setWeather(w) {
      if (!ok) return;
      rain.visible = w === "rain";
      flood.visible = w === "flood";
      plots.forEach((p) => p.plants.forEach((pl) => { if (p.corn && w === "flood") pl.group.visible = false; }));
      if (w === "drought") setSky("drought");
    },
    setFlags({ mule: muleState, school: schoolOn } = {}) {
      if (!ok) return;
      if (muleState != null) muleCut.visible = muleState !== "none";
      if (schoolOn != null) school.visible = schoolOn;
    },
    setPeople(where) {
      if (!ok) return;
      const spots = {
        home: { mama: [-12.3, 11.4, "mama"], lucy: [-13.4, 13.8, "lucy", 0.2], sam: [-12.6, 12.6, "sam"], ruth: [-14.4, 14.6, "ruth", 0.2] },
        field: { mama: [-6.6, 4.4, "mamaWork"], lucy: [4.4, 0, "lucyWork"], sam: [6.6, -4.4, "samWork"], ruth: [-13.9, 12.4, "ruth"] },
        porch: { mama: [1.8, -21.8, "mama"], lucy: [-13.4, 13.8, "lucy", 0.2], sam: [-12.6, 12.6, "sam"], ruth: [-14.4, 14.6, "ruth", 0.2] },
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
      const n = Math.max(1, Math.round(bales));
      for (let i = 0; i < n; i++) {
        const b = new T3.Mesh(new T3.BoxGeometry(0.6, 0.6, 0.75), lambert(0xf6efdf));
        b.position.set((i % 2) * 0.66 - 0.33, 1.45 + Math.floor(i / 4) * 0.62, -0.8 + (Math.floor(i / 2) % 2) * 0.8);
        b.add(new T3.Mesh(new T3.BoxGeometry(0.62, 0.62, 0.06), lambert(0x4f2f1d)));
        wagon.add(b);
        wagon.userData.bales.push(b);
      }
      wagon.position.set(SPOTS.wagon.x, 0, SPOTS.wagon.z - 1.6);
      wagon.rotation.y = 0;
      wagon.visible = true;
      muleCut.visible = true;
      muleCut.position.set(SPOTS.wagon.x + 1.6, 0, SPOTS.wagon.z - 3);
      scaleNeedle.rotation.z = Math.PI * 0.6;
    },
    hitchWagon() { if (ok) wagonFollow = true; },
    // Papa has led the wagon onto the scale. The needle swings to his weight.
    weigh(scaleLbs, maxLbs) {
      if (!ok) return Promise.resolve();
      wagonFollow = false;
      wagon.position.set(SPOTS.gin.x, 0.25, SPOTS.gin.z);
      wagon.rotation.y = 0;
      muleCut.position.set(SPOTS.gin.x - 0.2, 0, SPOTS.gin.z - 2.6);
      return new Promise((resolve) => {
        const frac = Math.min(1, scaleLbs / maxLbs);
        tween(2, (k) => { scaleNeedle.rotation.z = Math.PI * 0.6 - k * frac * Math.PI * 1.4; }, resolve);
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
      mats.storeSign.material.map = textTexture([name.toUpperCase(), "STORE & GIN"], { size: 46 });
      mats.storeSign.material.needsUpdate = true;
      mats.storeSign.userData.name = name;
    },
    // For the automated playtest only: jump Papa to a point.
    _teleport(x, z, yaw) { pos.x = x; pos.z = z; if (yaw != null) look.yaw = yaw; },
  };
})();
