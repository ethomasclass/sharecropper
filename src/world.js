// ============================================================================
// WORLD — first-person 3D farm through Papa's eyes. Buildings and ground are
// simple 3D shapes; people, the mule, trees, and crops are flat paper
// cutouts standing in the world. If 3D can't load, World.ok stays false and
// the game runs on its flat screens instead.
// ============================================================================
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js";

const World = (() => {
  let THREE, renderer, scene, camera, container, tagEl, bubbleEl, hintEl;
  let ok = false;
  const EYE = 1.68;
  const v = {};                      // shared vectors, set after load
  const look = { yaw: 0, pitch: -0.12 };
  const pos = { x: -12, z: 9 };
  const keys = {};
  const tweens = [];
  const billboards = [];             // cutouts that turn to face Papa
  const clickables = [];             // meshes with userData.click
  const people = {};
  const plots = [];
  const plants = [];                 // { mesh, plot, kind, picked }
  const colliders = [];              // [minX, minZ, maxX, maxZ]
  const tex = {};
  const mats = {};
  let mode = "locked";
  let handlers = {};
  let walk = null;                   // { x, z, yaw, pitch, resolve }
  let hovered = null;
  let rain = null, flood = null, school = null, muleCut = null, wagon = null, scaleNeedle = null;
  let bubble = null;
  let groundMats = [];
  let reduceMotion = false;
  let lastT = 0;
  let drag = null;

  // ---- places Papa can walk to -------------------------------------------
  const PLACES = {
    home:   { x: -12, z: 9.5, face: [0, 0, 0], pitch: -0.14 },
    field:  { x: 2.2, z: 12, face: [-3.2, 0, 0], pitch: -0.34 },
    cabin:  { x: -11.2, z: 12.2, face: [-15, 1.4, 13], pitch: -0.08 },
    store:  { x: 15.6, z: 5.4, face: [15.9, 1.6, 9.5], pitch: 0.02 },
    gin:    { x: 9.6, z: 11.6, face: [13.6, 1.1, 8], pitch: -0.1 },
    porch:  { x: -1.2, z: -20.2, face: [0.6, 3.9, -25.9], pitch: 0.04 },
    school: { x: -22, z: -4, face: [-27, 2, -9], pitch: 0 },
  };

  // ---- terrain -----------------------------------------------------------
  const HILL = { x: 0, z: -31, top: 9, base: 19, h: 2.4 };
  function heightAt(x, z) {
    const d = Math.hypot(x - HILL.x, z - HILL.z);
    if (d <= HILL.top) return HILL.h;
    if (d >= HILL.base) return 0;
    return HILL.h * (HILL.base - d) / (HILL.base - HILL.top);
  }

  // ---- paper cutout textures -----------------------------------------------
  const EDGE = `<filter id="e" x="-10%" y="-10%" width="120%" height="120%"><feMorphology operator="dilate" radius="5" in="SourceAlpha" result="d"/><feFlood flood-color="${AC.cream}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  const cut = (w, h, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 2}" height="${h * 2}"><defs>${EDGE}</defs><g filter="url(#e)">${inner}</g></svg>`;

  const PERSON_H = 420;
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
    sprout:   () => cut(200, 200, R(97, 120, 6, 80, AC.green) + P([[100, 130], [40, 90], [70, 140]], AC.greenLt) + P([[100, 120], [165, 85], [130, 135]], AC.greenLt)),
    cottonGrow: () => cut(200, 260, R(96, 120, 8, 140, AC.green) + C(100, 110, 60, AC.green) + C(60, 150, 40, AC.greenLt) + C(140, 145, 42, AC.greenLt)),
    cottonRipe: () => cut(200, 260, R(96, 120, 8, 140, AC.brown) + C(100, 110, 58, "#6E6A3E") + C(60, 150, 40, "#7C7444") + C(140, 145, 42, "#7C7444") +
      [[80, 80], [125, 90], [100, 125], [55, 140], [150, 130], [85, 165], [125, 170], [105, 70]].map(([x, y]) => C(x, y, 17, AC.cotton)).join("")),
    cottonPicked: () => cut(200, 260, R(96, 120, 8, 140, AC.brown) + C(100, 110, 56, "#7C6A44") + C(60, 150, 38, "#8A7448") + C(140, 145, 40, "#8A7448")),
    cornSprout: () => cut(200, 300, R(96, 60, 8, 240, AC.greenLt) + P([[100, 200], [30, 120], [86, 196]], AC.greenLt) + P([[100, 150], [175, 80], [112, 150]], AC.green) + P([[100, 90], [50, 20], [94, 96]], AC.greenLt)),
    cornGrow: () => cut(200, 420, R(95, 60, 10, 360, AC.green) + P([[100, 300], [20, 220], [90, 280]], AC.greenLt) + P([[100, 230], [185, 160], [110, 215]], AC.green) + P([[100, 160], [30, 90], [92, 150]], AC.greenLt) + P([[100, 60], [85, 10], [115, 10]], AC.ochreLt)),
    cornRipe: () => cut(200, 420, R(95, 60, 10, 360, "#A08A4A") + P([[100, 300], [20, 220], [90, 280]], AC.ochre) + P([[100, 230], [185, 160], [110, 215]], "#A08A4A") + `<ellipse cx="122" cy="250" rx="16" ry="40" fill="${AC.ochreLt}"/>` + P([[100, 60], [85, 10], [115, 10]], AC.ochre)),
    hills1:   () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 300" width="1600" height="300">${P([[0, 300], [0, 170], [220, 90], [430, 150], [700, 60], [980, 140], [1230, 80], [1600, 160], [1600, 300]], AC.indigoLt)}</svg>`,
    hills2:   () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 300" width="1600" height="300">${P([[0, 300], [0, 210], [300, 140], [560, 200], [820, 120], [1100, 190], [1380, 130], [1600, 200], [1600, 300]], "#6C7A4C")}</svg>`,
    blob:     () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" width="128" height="64"><ellipse cx="50" cy="25" rx="48" ry="22" fill="#1E1B18" opacity="0.28"/></svg>`,
    dial:     () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="256" height="256"><circle cx="100" cy="100" r="94" fill="${AC.cream}" stroke="${AC.ink}" stroke-width="8"/>${Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (0.8 + i * 0.14); return L(100 + 70 * Math.cos(a), 100 + 70 * Math.sin(a), 100 + 86 * Math.cos(a), 100 + 86 * Math.sin(a), AC.ink, 5); }).join("")}</svg>`,
    needle:   () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="256" height="256">${P([[96, 100], [104, 100], [100, 22]], AC.brick)}${C(100, 100, 9, AC.ink)}</svg>`,
  };

  function svgToTexture(svg) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        resolve(t);
      };
      img.onerror = () => resolve(null);
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
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
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
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
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(24, 24);
    return t;
  }

  // ---- building blocks ----------------------------------------------------
  function lambert(color, map) {
    const m = new THREE.MeshLambertMaterial({ color, map: map || null, flatShading: true });
    return m;
  }
  function box(w, h, d, color, x, y, z, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), opts.mat || lambert(color, opts.map));
    m.position.set(x, y + h / 2, z);
    if (opts.ry) m.rotation.y = opts.ry;
    scene.add(m);
    return m;
  }
  function roof(w, h, d, color, x, y, z) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0); shape.lineTo(0, h); shape.lineTo(w / 2, 0); shape.lineTo(-w / 2, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    geo.translate(0, 0, -d / 2);
    const m = new THREE.Mesh(geo, lambert(color));
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  }
  function cutout(texName, height, x, z, o = {}) {
    const t = tex[texName];
    const img = t.image;
    const aspect = img.width / img.height;
    const w = height * aspect;
    const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(w, height);
    geo.translate(0, height / 2, 0);
    const m = new THREE.Mesh(geo, mat);
    const y = (o.y != null ? o.y : heightAt(x, z));
    m.position.set(x, y, z);
    if (o.billboard !== false) billboards.push(m);
    if (o.blob !== false) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, w * 0.35), mats.blob);
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, 0.02, 0);
      m.add(s);
      m.userData.blob = s;
    }
    scene.add(m);
    return m;
  }
  function crossed(texName, height, x, z, y = 0) {
    const t = tex[texName];
    const aspect = t.image.width / t.image.height;
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
    for (let i = 0; i < 2; i++) {
      const geo = new THREE.PlaneGeometry(height * aspect, height);
      geo.translate(0, height / 2, 0);
      const m = new THREE.Mesh(geo, mat);
      m.rotation.y = i * Math.PI / 2 + 0.4;
      g.add(m);
    }
    g.position.set(x, y, z);
    scene.add(g);
    return g;
  }

  // ---- build the farm -------------------------------------------------------
  function build() {
    const grain = grainTexture();
    mats.blob = new THREE.MeshBasicMaterial({ map: tex.blob, transparent: true, depthWrite: false });

    scene.add(new THREE.HemisphereLight(0xfff3dc, 0x6b5a3a, 1.7));
    const sun = new THREE.DirectionalLight(0xffe7c2, 1.6);
    sun.position.set(-30, 50, 20);
    scene.add(sun);

    // ground
    const groundMat = lambert(0x9a9b5c, grain);
    groundMats.push(groundMat);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(95, 48), groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    ground.userData.click = { kind: "ground" };
    clickables.push(ground);

    // the hill under the big house
    const hillMat = lambert(0x8f9355, grain);
    groundMats.push(hillMat);
    const hill = new THREE.Mesh(new THREE.CylinderGeometry(HILL.top, HILL.base, HILL.h, 40, 1), hillMat);
    hill.position.set(HILL.x, HILL.h / 2 - 0.01, HILL.z);
    hill.userData.click = { kind: "ground" };
    scene.add(hill);
    clickables.push(hill);

    // paths
    const pathMat = lambert(0xb48a56, grain);
    const strip = (x1, z1, x2, z2, w) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), pathMat);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = -Math.atan2(x2 - x1, z2 - z1);
      m.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
      scene.add(m);
    };
    strip(-16, 12, 16, 12, 2.2);
    strip(0, 12, 0, -14, 2.2);
    strip(0, -14, 0, -22, 2.2);

    // the field: 15 one-acre plots, 5 across and 3 deep
    const soilMat = lambert(0x7a4e31, grain);
    const soilCorn = lambert(0x9c7838, grain);
    const ridgeMat = lambert(0x6a4a2c, grain);
    mats.soil = soilMat; mats.soilCorn = soilCorn;
    mats.soilHover = lambert(0xa3703f, grain);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const i = r * 5 + c;
        const x = (c - 2) * 4.4, z = (r - 1) * 4.4;
        const tile = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.18, 3.7), soilMat);
        tile.position.set(x, 0.09, z);
        tile.userData.click = { kind: "plot", index: i };
        scene.add(tile);
        clickables.push(tile);
        for (let k = -1; k <= 1; k++) {
          const ridge = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.12, 0.42), ridgeMat);
          ridge.position.set(x, 0.22, z + k * 1.1);
          scene.add(ridge);
        }
        const plot = { index: i, x, z, tile, corn: false, plants: [] };
        for (let k = -1; k <= 1; k++) {
          for (let j = 0; j < 4; j++) {
            const px = x - 1.3 + j * 0.86 + (k % 2 ? 0.2 : 0), pz = z + k * 1.1;
            const g = crossed("sprout", 0.5, px, pz, 0.22);
            g.children.forEach((m) => { m.userData.click = { kind: "plant", plot: i }; clickables.push(m); });
            const p = { group: g, plot: i, picked: false, x: px, z: pz };
            plot.plants.push(p);
            plants.push(p);
          }
        }
        plots.push(plot);
      }
    }
    // fence around the field
    const postMat = lambert(0x5a3a24);
    for (let x = -12; x <= 12; x += 2) {
      box(0.16, 1.1, 0.16, 0, x, 0, -7.4, { mat: postMat });
    }
    box(24.2, 0.12, 0.08, 0, 0, 0.85, -7.4, { mat: postMat });
    box(24.2, 0.12, 0.08, 0, 0, 0.45, -7.4, { mat: postMat });

    // the cabin
    const cab = { x: -17.5, z: 13 };
    box(5, 3, 4.2, 0x7a4a2e, cab.x, 0, cab.z, { map: grain });
    roof(5.8, 1.9, 4.8, 0x4f2f1d, cab.x, 3, cab.z).rotation.y = Math.PI / 2;
    box(1.1, 2, 0.1, 0x1e1b18, cab.x + 2.51, 0, cab.z, { ry: Math.PI / 2 });
    box(0.1, 0.9, 1, 0x1e1b18, cab.x + 2.52, 1.4, cab.z - 1.4);
    box(0.7, 1.4, 0.7, 0x4f2f1d, cab.x - 1.6, 3.4, cab.z + 1.3);
    box(2.2, 0.2, 4.2, 0x5a3a24, cab.x + 3.4, 0, cab.z);
    colliders.push([cab.x - 2.8, cab.z - 2.4, cab.x + 2.8, cab.z + 2.4]);
    const cabinHot = box(1.2, 2, 1.2, 0, cab.x + 2.9, 0, cab.z, { mat: new THREE.MeshBasicMaterial({ visible: false }) });
    cabinHot.userData.click = { kind: "place", name: "cabin" };
    clickables.push(cabinHot);

    // store and gin house
    const st = { x: 17.5, z: 12 };
    box(7, 4, 5, 0xc7b08a, st.x, 0, st.z, { map: grain });
    roof(7.8, 2, 5.6, 0x7a4a2e, st.x, 4, st.z);
    box(1.4, 2.4, 0.1, 0x2e3b56, st.x - 1.6, 0, st.z - 2.51);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.1), new THREE.MeshBasicMaterial({ map: textTexture(["HOLLIDAY", "STORE & GIN"], { size: 46 }) }));
    sign.position.set(st.x + 0.6, 3.1, st.z - 2.53);
    sign.rotation.y = Math.PI;
    scene.add(sign);
    mats.storeSign = sign;
    colliders.push([st.x - 3.8, st.z - 2.8, st.x + 3.8, st.z + 2.8]);
    const storeHot = box(1.6, 2.4, 1, 0, st.x - 1.6, 0, st.z - 3, { mat: new THREE.MeshBasicMaterial({ visible: false }) });
    storeHot.userData.click = { kind: "place", name: "store" };
    clickables.push(storeHot);

    // the gin scale
    const sc = { x: 13.6, z: 8 };
    box(2.4, 0.25, 2.4, 0x5a3a24, sc.x, 0, sc.z);
    box(0.25, 2.6, 0.25, 0x3e2718, sc.x + 1.3, 0, sc.z - 1.3);
    const dial = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: tex.dial, transparent: true }));
    dial.position.set(sc.x + 1.3, 2.7, sc.z - 1.15);
    dial.rotation.y = -0.6;
    scene.add(dial);
    scaleNeedle = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: tex.needle, transparent: true }));
    scaleNeedle.position.set(0, 0, 0.01);
    dial.add(scaleNeedle);
    scaleNeedle.rotation.z = Math.PI * 0.6;
    const ginHot = box(2.4, 1.4, 2.4, 0, sc.x, 0, sc.z, { mat: new THREE.MeshBasicMaterial({ visible: false }) });
    ginHot.userData.click = { kind: "place", name: "gin" };
    clickables.push(ginHot);

    // the big house on the hill
    const bh = { x: 0, z: -32.5, y: HILL.h };
    box(13, 6.4, 7, 0xefe6d2, bh.x, bh.y, bh.z, { map: grain });
    roof(14, 2.6, 7.8, 0xa3271f, bh.x, bh.y + 6.4, bh.z);
    box(13, 0.4, 3, 0xe2d4b6, bh.x, bh.y, bh.z + 5);
    for (let i = 0; i < 6; i++) box(0.36, 4.6, 0.36, 0xf6efdf, bh.x - 5.6 + i * 2.24, bh.y + 0.4, bh.z + 6.2);
    box(13.4, 0.4, 3.4, 0xe2d4b6, bh.x, bh.y + 5, bh.z + 5);
    for (let i = 0; i < 4; i++) box(1.1, 1.5, 0.1, 0x2e3b56, bh.x - 4.5 + i * 3, bh.y + 1.4, bh.z + 3.52);
    box(1.6, 2.6, 0.1, 0x2e3b56, bh.x, bh.y + 0.4, bh.z + 3.53);
    for (let i = 0; i < 3; i++) box(3, 0.14, 0.5, 0xe2d4b6, bh.x, bh.y - 0.14 * (i + 1) + 0.28, bh.z + 6.8 + i * 0.5);
    colliders.push([bh.x - 7, bh.z - 3.8, bh.x + 7, bh.z + 6.6]);
    const bigHot = box(4, 3, 1, 0, bh.x, bh.y, bh.z + 6.8, { mat: new THREE.MeshBasicMaterial({ visible: false }) });
    bigHot.userData.click = { kind: "place", name: "porch" };
    clickables.push(bigHot);

    // the church school (shown when the school card is drawn)
    school = new THREE.Group();
    const sx = -27, sz = -9;
    const sb = new THREE.Mesh(new THREE.BoxGeometry(5, 3.2, 6), lambert(0xf6efdf, grain));
    sb.position.set(sx, 1.6, sz); school.add(sb);
    const sr = roof(5.8, 2.2, 6.6, 0xa3271f, sx, 3.2, sz); scene.remove(sr); sr.rotation.y = Math.PI / 2; school.add(sr);
    const st2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.4, 1.1), lambert(0xf6efdf)); st2.position.set(sx + 2.2, 5, sz); school.add(st2);
    const sch = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 1.2), new THREE.MeshBasicMaterial({ visible: false }));
    sch.position.set(sx + 2.8, 1, sz); sch.userData.click = { kind: "place", name: "school" }; school.add(sch); clickables.push(sch);
    school.visible = false;
    scene.add(school);

    // trees and distant hills
    const treeSpots = [[-30, 18], [-24, 24], [-8, 26], [10, 25], [26, 22], [32, 4], [30, -14], [16, -22], [-16, -22], [-32, -2], [-36, 10], [22, -34], [-22, -36], [38, -26], [-40, -22], [6, 30], [-14, 32]];
    treeSpots.forEach(([x, z], i) => cutout(i % 2 ? "tree1" : "tree2", 6 + (i % 3), x, z));
    [[110, "hills2", 18], [130, "hills1", 30]].forEach(([rad, t, h]) => {
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(rad * 0.58, h), new THREE.MeshBasicMaterial({ map: tex[t], transparent: true, fog: false }));
        m.position.set(Math.cos(ang) * rad, h / 2 - 2, Math.sin(ang) * rad);
        m.lookAt(0, h / 2 - 2, 0);
        scene.add(m);
      }
    });

    // the family and the planter, as paper cutouts
    people.mama = cutout("mama", 1.66, -12.3, 11.4);
    people.lucy = cutout("lucy", 1.36, -13.4, 13.8);
    people.sam = cutout("sam", 1.12, -12.6, 12.6);
    people.ruth = cutout("ruth", 1.56, -14.4, 14.6, { y: 0.2 });
    people.holliday = cutout("holliday", 1.9, 0.6, -25.9, { y: HILL.h + 0.4 });
    Object.entries(people).forEach(([id, m]) => { m.userData.click = { kind: "person", id }; clickables.push(m); });
    muleCut = cutout("mule", 1.6, -9.5, 15.5);
    muleCut.userData.click = { kind: "person", id: "mule" };
    clickables.push(muleCut);

    // wagon for harvest
    wagon = new THREE.Group();
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 1.6), lambert(0x7a4a2e));
    bed.position.y = 0.9; wagon.add(bed);
    for (const [wx, wz] of [[-0.9, -0.85], [0.9, -0.85], [-0.9, 0.85], [0.9, 0.85]]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 12), lambert(0x3e2718));
      wh.rotation.x = Math.PI / 2; wh.position.set(wx, 0.5, wz); wagon.add(wh);
    }
    wagon.userData.bales = [];
    wagon.position.set(4, 0, 8);
    wagon.visible = false;
    scene.add(wagon);

    // flood water and rain, hidden until a card calls for them
    flood = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), new THREE.MeshLambertMaterial({ color: 0x4c5c7e, transparent: true, opacity: 0.78 }));
    flood.rotation.x = -Math.PI / 2;
    flood.position.set(0, 0.32, -1.6);
    flood.visible = false;
    scene.add(flood);
    const drops = new Float32Array(900 * 6);
    const rg = new THREE.BufferGeometry();
    rg.setAttribute("position", new THREE.BufferAttribute(drops, 3));
    rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xf6efdf, transparent: true, opacity: 0.55 }));
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

  // ---- input ----------------------------------------------------------------
  const ray = () => new THREE.Raycaster();
  let raycaster;
  function pickAt(clientX, clientY) {
    const r = renderer.domElement.getBoundingClientRect();
    v.ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(v.ndc, camera);
    const hits = raycaster.intersectObjects(clickables.filter((m) => isVisible(m)), false);
    for (const h of hits) {
      const c = h.object.userData.click;
      if (!c) continue;
      return { ...c, point: h.point, distance: h.distance, object: h.object };
    }
    return null;
  }
  function isVisible(m) {
    let o = m;
    while (o) { if (!o.visible) return false; o = o.parent; }
    return true;
  }

  function onPointerDown(e) {
    if (mode === "locked") return;
    drag = { x: e.clientX, y: e.clientY, yaw: look.yaw, pitch: look.pitch, moved: false, id: e.pointerId };
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
    const hit = pickAt(e.clientX, e.clientY);
    setHover(hit && hit.kind !== "ground" ? hit : null, e.clientX, e.clientY);
  }
  function onPointerUp(e) {
    if (!drag) return;
    const wasDrag = drag.moved;
    drag = null;
    if (wasDrag || mode === "locked") return;
    const hit = pickAt(e.clientX, e.clientY);
    if (!hit) return;
    handleClick(hit);
  }

  function handleClick(hit) {
    if (hit.kind === "ground") {
      if (mode === "free" || mode === "plant" || mode === "harvest") walkToPoint(hit.point.x, hit.point.z);
      return;
    }
    if (hit.kind === "plot" || hit.kind === "plant") {
      const index = hit.kind === "plot" ? hit.index : hit.plot;
      if (mode === "plant") handlers.plot?.(index);
      else if (mode === "free" || mode === "harvest") walkToPoint(hit.point.x, hit.point.z);
      return;
    }
    if (hit.kind === "place" || hit.kind === "person") handlers.interact?.(hit.kind === "place" ? hit.name : hit.id);
  }

  function setHover(hit, x, y) {
    if (hovered && hovered.kind === "plot") plots[hovered.index].tile.material = plots[hovered.index].corn ? mats.soilCorn : mats.soil;
    hovered = hit;
    let label = "";
    if (hit) {
      if (hit.kind === "plot" && mode === "plant") {
        plots[hit.index].tile.material = mats.soilHover;
        label = plots[hit.index].corn ? "Corn · tap for cotton" : "Cotton · tap for corn";
      } else if (hit.kind === "person") {
        const names = { mama: "Mama", lucy: "Lucy", sam: "Sam", ruth: "Grandma Ruth", holliday: "Mr. " + (handlers.planterName?.() || "Holliday"), mule: "The mule" };
        label = names[hit.id] || "";
      } else if (hit.kind === "place") {
        label = { cabin: "Your cabin", store: "The store", gin: "The gin scale", porch: "The big house", school: "The church school" }[hit.name] || "";
      }
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

  function onKey(e, down) {
    if (e.target && /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName) && e.key !== "Escape") return;
    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "q", "e"].includes(k)) {
      keys[k] = down;
      if (down && mode !== "locked") { walk = null; e.preventDefault(); }
    }
  }

  // ---- movement -------------------------------------------------------------
  function collide(x, z) {
    for (const [a, b, c, d] of colliders) {
      if (x > a && x < c && z > b && z < d) {
        const dl = x - a, dr = c - x, dt = z - b, db = d - z;
        const m = Math.min(dl, dr, dt, db);
        if (m === dl) x = a; else if (m === dr) x = c; else if (m === dt) z = b; else z = d;
      }
    }
    const rr = Math.hypot(x, z);
    if (rr > 60) { x *= 60 / rr; z *= 60 / rr; }
    return [x, z];
  }

  function walkToPoint(x, z, faceTo) {
    return new Promise((resolve) => {
      const dx = x - pos.x, dz = z - pos.z;
      const yaw = faceTo ? Math.atan2(-(faceTo[0] - x), -(faceTo[2] - z)) : Math.atan2(-dx, -dz);
      walk = { x, z, yaw, pitch: null, resolve, turnFirst: true };
    });
  }

  function walkTo(name) {
    const p = PLACES[name];
    if (!p) return Promise.resolve();
    return new Promise((resolve) => {
      const yaw = Math.atan2(-(p.face[0] - p.x), -(p.face[2] - p.z));
      walk = { x: p.x, z: p.z, yaw, pitch: p.pitch, resolve };
      if (reduceMotion || !ok) { pos.x = p.x; pos.z = p.z; look.yaw = yaw; look.pitch = p.pitch; finishWalk(); }
    });
  }
  function finishWalk() {
    const w = walk;
    walk = null;
    if (w && w.path && w.path.length) {
      const [nx, nz] = w.path[0];
      walk = { ...w, x: nx, z: nz, yaw: Math.atan2(-(nx - w.x), -(nz - w.z)), path: w.path.slice(1) };
      return;
    }
    w?.resolve?.();
  }

  function angleDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  function step(dt) {
    // keyboard walking
    const fwd = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0);
    const side = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const turn = (keys.arrowleft || keys.q ? 1 : 0) - (keys.arrowright || keys.e ? 1 : 0);
    if (mode !== "locked") {
      look.yaw += turn * dt * 1.6;
      if (fwd || side) {
        const sp = 5 * dt;
        const fx = -Math.sin(look.yaw), fz = -Math.cos(look.yaw);
        const rx = Math.cos(look.yaw), rz = -Math.sin(look.yaw);
        const nx = pos.x + (fx * fwd + rx * side) * sp;
        const nz = pos.z + (fz * fwd + rz * side) * sp;
        [pos.x, pos.z] = collide(nx, nz);
      }
    }
    // auto walking
    if (walk) {
      const dx = walk.x - pos.x, dz = walk.z - pos.z;
      const dist = Math.hypot(dx, dz);
      const heading = dist > 0.3 ? Math.atan2(-dx, -dz) : walk.yaw;
      const target = dist > 1.2 ? heading : walk.yaw;
      look.yaw += angleDiff(target, look.yaw) * Math.min(1, dt * 4);
      if (walk.pitch != null) look.pitch += (walk.pitch - look.pitch) * Math.min(1, dt * 3);
      if (dist > 0.05) {
        const sp = Math.min(dist, 6.5 * dt);
        [pos.x, pos.z] = collide(pos.x + (dx / dist) * sp, pos.z + (dz / dist) * sp);
        if (Math.hypot(walk.x - pos.x, walk.z - pos.z) > dist - 0.0001 && dist < 1) { pos.x = walk.x; pos.z = walk.z; }
      }
      if (dist < 0.06 && Math.abs(angleDiff(walk.yaw, look.yaw)) < 0.06 && (walk.pitch == null || Math.abs(walk.pitch - look.pitch) < 0.04)) {
        look.yaw = walk.yaw;
        if (walk.pitch != null) look.pitch = walk.pitch;
        finishWalk();
      }
    }
    camera.position.set(pos.x, heightAt(pos.x, pos.z) + EYE, pos.z);
    camera.rotation.set(look.pitch, look.yaw, 0, "YXZ");

    // harvest: the cotton comes off the plants Papa walks past
    if (mode === "harvest") {
      let changed = false;
      for (const p of plants) {
        if (p.picked || plots[p.plot].corn || !p.group.visible) continue;
        if (Math.hypot(p.x - pos.x, p.z - pos.z) < 2.4) {
          p.picked = true;
          setPlantTexture(p, "cottonPicked");
          pop(p.group);
          changed = true;
        }
      }
      if (changed) handlers.harvest?.(harvestFraction());
    }

    // cutouts turn to face Papa, like paper standees
    for (const b of billboards) {
      if (!b.visible) continue;
      b.rotation.y = Math.atan2(camera.position.x - b.position.x, camera.position.z - b.position.z);
    }
    // tweens
    for (let i = tweens.length - 1; i >= 0; i--) {
      const t = tweens[i];
      t.t += dt / t.dur;
      const k = Math.min(1, t.t);
      t.fn(k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, k);
      if (k >= 1) { tweens.splice(i, 1); t.done?.(); }
    }
    // rain
    if (rain.visible) {
      const a = rain.geometry.attributes.position.array;
      for (let i = 0; i < 900; i++) {
        a[i * 6 + 1] -= dt * 16; a[i * 6 + 4] -= dt * 16;
        if (a[i * 6 + 4] < 0) resetDrop(i, false);
      }
      rain.geometry.attributes.position.needsUpdate = true;
    }
    // speech bubble follows its speaker
    if (bubble) {
      const m = people[bubble.id] || muleCut;
      v.tmp.copy(m.position); v.tmp.y += (m.geometry.parameters?.height || 1.6) + 0.25;
      v.tmp.project(camera);
      const r = container.getBoundingClientRect();
      if (v.tmp.z < 1) {
        bubbleEl.style.left = ((v.tmp.x + 1) / 2) * r.width + "px";
        bubbleEl.style.top = ((1 - v.tmp.y) / 2) * r.height + "px";
        bubbleEl.hidden = false;
      } else bubbleEl.hidden = true;
      bubble.t -= dt;
      if (bubble.t <= 0) { bubble = null; bubbleEl.hidden = true; }
    }
  }

  function harvestFraction() {
    const cotton = plants.filter((p) => !plots[p.plot].corn && p.group.visible);
    return cotton.length ? cotton.filter((p) => p.picked).length / cotton.length : 1;
  }

  function tween(dur, fn, done) {
    if (reduceMotion) { fn(1, 1); done?.(); return; }
    tweens.push({ t: 0, dur, fn, done });
  }
  function pop(g) {
    const s = g.scale.x;
    tween(0.25, (k, raw) => { const b = 1 + Math.sin(raw * Math.PI) * 0.25; g.scale.set(s * b, s * b, s * b); });
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
    camera.fov = w / h < 0.9 ? 70 : 58;
    camera.updateProjectionMatrix();
  }

  // ---- crop and season state ---------------------------------------------
  let stage = "plan";
  function setPlantTexture(p, name) {
    const t = tex[name];
    const isCorn = name.startsWith("corn");
    const h = { sprout: 0.5, cornSprout: 0.95, cottonGrow: 1.0, cottonRipe: 1.05, cottonPicked: 1.0, cornGrow: 2.1, cornRipe: 2.1 }[name] || 1;
    p.group.children.forEach((m) => {
      m.material = mats["plant_" + name] || (mats["plant_" + name] = new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide }));
      const aspect = t.image.width / t.image.height;
      m.geometry.dispose();
      const g = new THREE.PlaneGeometry(h * aspect, h);
      g.translate(0, h / 2, 0);
      m.geometry = g;
    });
    p.kind = isCorn ? "corn" : "cotton";
  }
  function refreshPlants() {
    plots.forEach((plot) => {
      plot.tile.material = plot.corn ? mats.soilCorn : mats.soil;
      plot.plants.forEach((p) => {
        let name;
        if (plot.corn) name = stage === "plan" ? "cornSprout" : stage === "grow" ? "cornGrow" : "cornRipe";
        else if (stage === "plan") name = "sprout";
        else if (stage === "grow") name = "cottonGrow";
        else name = p.picked || stage === "picked" ? "cottonPicked" : "cottonRipe";
        setPlantTexture(p, name);
      });
    });
  }

  const SKIES = {
    spring: [0xe8d6a8, 0x9fa262], summer: [0xe3c587, 0x8c9550], fall: [0xd9b16a, 0xa38f54],
    dusk: [0x3a4466, 0x5b5a40], drought: [0xe7b56a, 0xb9965a],
  };
  function setSky(name) {
    const [sky, grass] = SKIES[name] || SKIES.spring;
    scene.background.setHex(sky);
    scene.fog.color.setHex(sky);
    groundMats.forEach((m) => m.color.setHex(grass));
    const dusk = name === "dusk";
    Object.values(mats).forEach((m) => { if (m && m.isMeshBasicMaterial && m.map && m !== mats.blob) m.color.setHex(dusk ? 0x9aa0b8 : 0xffffff); });
    billboards.forEach((b) => b.material.color.setHex(dusk ? 0xb8bccc : 0xffffff));
  }

  // ---- public API -----------------------------------------------------------
  async function init(el) {
    container = el;
    reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || false;
    try {
      THREE = await import(THREE_URL);
      const test = document.createElement("canvas");
      if (!(test.getContext("webgl2") || test.getContext("webgl"))) throw new Error("no webgl");
      v.ndc = new THREE.Vector2(); v.tmp = new THREE.Vector3();
      raycaster = ray();
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.prepend(renderer.domElement);
      renderer.domElement.className = "world-canvas";
      renderer.domElement.setAttribute("aria-label", "The farm, seen through Papa's eyes. Drag to look around, tap to walk or act.");
      renderer.domElement.setAttribute("role", "img");
      scene = new THREE.Scene();
      scene.background = new THREE.Color(SKIES.spring[0]);
      scene.fog = new THREE.Fog(SKIES.spring[0], 45, 140);
      camera = new THREE.PerspectiveCamera(58, 1, 0.1, 400);
      const names = Object.keys(SPRITES);
      const loaded = await Promise.all(names.map((n) => svgToTexture(SPRITES[n]())));
      if (loaded.some((t) => !t)) throw new Error("sprites");
      names.forEach((n, i) => { tex[n] = loaded[i]; });
      build();
      refreshPlants();
      tagEl = el.querySelector(".world-tag");
      bubbleEl = el.querySelector(".world-bubble");
      hintEl = el.querySelector(".world-hint");
      const c = renderer.domElement;
      c.addEventListener("pointerdown", onPointerDown);
      c.addEventListener("pointermove", onPointerMove);
      c.addEventListener("pointerup", onPointerUp);
      c.addEventListener("pointercancel", () => { drag = null; });
      c.addEventListener("pointerleave", () => { if (!drag) setHover(null); });
      window.addEventListener("keydown", (e) => onKey(e, true));
      window.addEventListener("keyup", (e) => onKey(e, false));
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
    get debug() { return { x: pos.x, z: pos.z, yaw: look.yaw, pitch: look.pitch, walking: !!walk, mode }; },
    init,
    on(h) { handlers = { ...handlers, ...h }; },
    setMode(m) {
      mode = m;
      if (!ok) return;
      renderer.domElement.style.cursor = m === "locked" ? "default" : "grab";
      if (m === "locked") { setHover(null); Object.keys(keys).forEach((k) => { keys[k] = false; }); }
    },
    walkTo(name) { return ok ? walkTo(name) : Promise.resolve(); },
    place(name) {
      const p = PLACES[name];
      if (!ok || !p) return;
      pos.x = p.x; pos.z = p.z;
      look.yaw = Math.atan2(-(p.face[0] - p.x), -(p.face[2] - p.z));
      look.pitch = p.pitch;
      walk = null;
    },
    setCorn(set) {
      if (!ok) return;
      plots.forEach((p) => { p.corn = set.has(p.index); });
      refreshPlants();
    },
    setStage(s) {
      stage = s;
      if (!ok) return;
      if (s !== "ripe") plants.forEach((p) => { p.picked = false; });
      refreshPlants();
    },
    setSky(name) { if (ok) setSky(name); },
    setWeather(w) {
      if (!ok) return;
      rain.visible = w === "rain";
      flood.visible = w === "flood";
      if (w === "flood") plots.forEach((p) => p.plants.forEach((pl) => { if (p.corn) pl.group.visible = false; }));
      else plants.forEach((pl) => { pl.group.visible = true; });
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
        home: { mama: [-12.3, 11.4, "mama"], lucy: [-13.4, 13.8, "lucy"], sam: [-12.6, 12.6, "sam"], ruth: [-14.4, 14.6, "ruth"] },
        field: { mama: [-2.2, 5.6, "mamaWork"], lucy: [3.4, 5.8, "lucyWork"], sam: [5.6, 6.6, "samWork"], ruth: [-13.9, 12.4, "ruth"] },
        porch: { mama: [1.6, -21.6, "mama"], lucy: [-13.4, 13.8, "lucy"], sam: [-12.6, 12.6, "sam"], ruth: [-14.4, 14.6, "ruth"] },
        store: { mama: [12.2, 5.4, "mama"], lucy: [-13.4, 13.8, "lucy"], sam: [-12.6, 12.6, "sam"], ruth: [-14.4, 14.6, "ruth"] },
      }[where] || {};
      Object.entries(spots).forEach(([id, [x, z, t]]) => {
        const m = people[id];
        m.position.set(x, heightAt(x, z) + (id === "ruth" && where !== "field" ? 0.2 : 0), z);
        m.material.map = tex[t];
        m.material.needsUpdate = true;
      });
    },
    say(id, text, seconds = 4.5) {
      if (!ok || !bubbleEl) return;
      bubbleEl.textContent = text;
      bubble = { id, t: seconds };
    },
    hint(text) {
      if (!hintEl) return;
      hintEl.textContent = text || "";
      hintEl.hidden = !text;
    },
    harvestFraction() { return ok ? harvestFraction() : 0; },
    // Walk every row of the field, front to back.
    walkRows() {
      if (!ok) return Promise.resolve();
      const route = [[-10.5, 6.6], [10.5, 6.6], [10.5, 2.2], [-10.5, 2.2], [-10.5, -2.2], [10.5, -2.2], [10.5, -6.4], [-10.5, -6.4]];
      return new Promise((resolve) => {
        const [x, z] = route[0];
        walk = { x, z, yaw: Math.atan2(-(x - pos.x), -(z - pos.z)), pitch: -0.42, resolve, path: route.slice(1) };
      });
    },
    // Harvest: load the wagon and roll it to the scale. Calls back with the
    // planter's weight once the needle settles.
    harvestRun(bales, scaleLbs, maxLbs) {
      if (!ok) return Promise.resolve();
      return new Promise((resolve) => {
        wagon.userData.bales.forEach((b) => wagon.remove(b));
        wagon.userData.bales = [];
        const n = Math.max(1, Math.round(bales));
        for (let i = 0; i < n; i++) {
          const b = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.6, 0.6), lambert(0xf6efdf));
          b.position.set(-0.8 + (i % 3) * 0.8, 1.45 + Math.floor(i / 3) * 0.62, (i % 2) * 0.1 - 0.05);
          const tie = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.62, 0.06), lambert(0x4f2f1d));
          b.add(tie);
          wagon.add(b);
          wagon.userData.bales.push(b);
        }
        wagon.visible = true;
        wagon.position.set(4, 0, 8);
        muleCut.userData.home = muleCut.userData.home || muleCut.position.clone();
        const muleWasVisible = muleCut.visible;
        muleCut.visible = true;
        scaleNeedle.rotation.z = Math.PI * 0.6;
        walkTo("gin");
        tween(3.2, (k) => {
          wagon.position.set(4 + (13.6 - 4) * k, 0.25 * k, 8);
          muleCut.position.set(wagon.position.x + 2.4, 0, wagon.position.z);
        }, () => {
          const frac = Math.min(1, scaleLbs / maxLbs);
          tween(1.8, (k) => { scaleNeedle.rotation.z = Math.PI * 0.6 - k * frac * Math.PI * 1.4; }, () => {
            setTimeout(() => {
              muleCut.position.copy(muleCut.userData.home);
              muleCut.visible = muleWasVisible;
              resolve();
            }, 250);
          });
        });
      });
    },
    hideWagon() { if (ok) wagon.visible = false; },
    setPlanter(name) {
      if (!ok || mats.storeSign.userData.name === name) return;
      mats.storeSign.material.map?.dispose();
      mats.storeSign.material.map = textTexture([name.toUpperCase(), "STORE & GIN"], { size: 46 });
      mats.storeSign.material.needsUpdate = true;
      mats.storeSign.userData.name = name;
    },
  };
})();
