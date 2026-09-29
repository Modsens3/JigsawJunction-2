// Φλωρεντία: Santa Maria del Fiore με τον τρούλο του Μπρουνελέσκι, καμπαναριό του Τζιόττο, Βαπτιστήριο, Ponte Vecchio, Palazzo Vecchio.
import { THREE, mat, metal, add, box, boxAt, instanced, M4, lathe, frustum, mergeGeometries, TAU, lerp, rng, archWall } from './lib.js';

const GREEN = 0x2f6b4a, PINK = 0xd79aa2;
export function florMat(o = {}) { return mat('florentine', o.color ?? 0xf3ede0, { tile: o.tile ?? 14, bump: 0.5, strength: 0.6, tint2: GREEN, tint3: PINK }); }

// οκταγωνικό πρίσμα με «εσωτερική ακτίνα» a (οι έδρες κοιτούν ±x, ±z)
function octGeo(a, h, aTop = a) { const g = new THREE.CylinderGeometry(aTop / Math.cos(Math.PI / 8), a / Math.cos(Math.PI / 8), h, 8, 1); g.rotateY(Math.PI / 8); g.translate(0, h / 2, 0); return g; }

function domeGeometry(R, rise, J = 16) {
  // οξυκόρυφο προφίλ «quinto acuto»: a(y) = sqrt(Rp² − y²) − k, Rp = R + k, ύψος = sqrt(R² + 2Rk) = rise
  const k = (rise * rise - R * R) / (2 * R), Rp = R + k, pos = [], ringR = [];
  const ys = []; for (let j = 0; j <= J; j++) { const y = rise * Math.pow(j / J, 0.92) * 0.9995; ys.push(y); ringR.push((Math.sqrt(Math.max(0, Rp * Rp - y * y)) - k) / Math.cos(Math.PI / 8)); }
  const v = (j, i) => { const a = (i + 0.0) * TAU / 8 + Math.PI / 8 * 0 ; return [Math.cos(a) * ringR[j], ys[j], Math.sin(a) * ringR[j]]; };
  for (let j = 0; j < J; j++) for (let i = 0; i < 8; i++) {
    const a = v(j, i), b = v(j, i + 1), c = v(j + 1, i + 1), d = v(j + 1, i);
    pos.push(...a, ...c, ...b, ...a, ...d, ...c);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  return { geo: g, ringR, ys, k, Rp };
}

export function buildDuomo(o = {}) {
  const g = new THREE.Group(), flor = florMat(), terr = mat('tiles', 0xd0653d, { tile: 2.4, bump: 1.6, strength: 0.6 }), white = mat('marble', 0xf6f0e2, { tile: 5, strength: 0.4 }), dark = mat(null, 0x1a1a22), glass = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3f5f9a).multiplyScalar(0.9) }), gold = metal(0xe6b84a, 0.3, o.envMap);
  const IN = 27.5, WALL = 34;
  // οκταγωνική βάση και τύμπανο με οφθαλμούς (στρογγυλά παράθυρα)
  add(g, octGeo(IN, WALL), flor);
  add(g, octGeo(IN - 1.4, 20), flor, { p: [0, WALL, 0] });
  add(g, octGeo(IN + 0.8, 1.6), white, { p: [0, WALL + 19.6, 0] });
  const oc = [];
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8; oc.push(M4([Math.cos(a) * (IN - 1.4 + 0.05), WALL + 10, Math.sin(a) * (IN - 1.4 + 0.05)], [0, -a + Math.PI / 2, 0])); }
  instanced(g, new THREE.CylinderGeometry(3.2, 3.2, 0.5, 20).rotateX(Math.PI / 2), dark, oc, { cast: false });
  // τρούλος: 8 όψεις με κεραμίδια + 8 λευκές νευρώσεις
  const y0 = WALL + 20.4, R = IN - 1.4, rise = 36;
  const { geo, ringR, ys } = domeGeometry(R, rise);
  add(g, geo, terr, { p: [0, y0, 0] });
  const ribs = [];
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8, pts = []; for (let j = 0; j < ringR.length; j++) pts.push(new THREE.Vector3(Math.cos(a) * (ringR[j] + 0.25), ys[j] + 0.1, Math.sin(a) * (ringR[j] + 0.25)));
    const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.75, 4); tg.translate(0, y0, 0); ribs.push(tg.toNonIndexed());
  }
  const rm = new THREE.Mesh(mergeGeometries(ribs), white); rm.castShadow = true; rm.receiveShadow = true; g.add(rm);
  // φανός (lantern): 8 πεσσοί, κωνικό στέγαστρο, μπάλα και σταυρός
  const ly = y0 + rise - 0.5;
  add(g, octGeo(6.2, 2, 6.8), white, { p: [0, ly, 0] });
  add(g, octGeo(4.7, 14), white, { p: [0, ly + 2, 0] });
  const pil = []; for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + Math.PI / 8; pil.push(M4([Math.cos(a) * 5.2, ly + 9, Math.sin(a) * 5.2])); }
  instanced(g, new THREE.CylinderGeometry(0.42, 0.42, 12, 8), white, pil);
  add(g, new THREE.CylinderGeometry(0.2, 5.6, 6, 8), white, { p: [0, ly + 18.5, 0], r: [0, Math.PI / 8, 0] });
  add(g, new THREE.SphereGeometry(1.8, 16, 12), gold, { p: [0, ly + 22.4, 0] });
  add(g, box(0.4, 5, 0.4), gold, { p: [0, ly + 25.4, 0] }); add(g, box(2.4, 0.4, 0.4), gold, { p: [0, ly + 26.4, 0] });
  // τρεις τρίβουνες (νότια, βόρεια, ανατολικά) με ημικωνικά κεραμίδια
  for (const [dx, dz, ang] of [[1, 0, 0], [0, 1, Math.PI / 2], [0, -1, -Math.PI / 2]]) {
    const t = new THREE.Group(); t.position.set(dx * IN, 0, dz * IN); t.rotation.y = -ang;
    const semi = new THREE.CylinderGeometry(22, 22, WALL - 3, 8, 1, false, -Math.PI / 2 - 0.0, Math.PI); semi.rotateY(Math.PI / 8 * 0); semi.translate(0, (WALL - 3) / 2, 0);
    add(t, semi, flor);
    add(t, new THREE.CylinderGeometry(3, 22, 16, 8, 1, false, -Math.PI / 2, Math.PI), terr, { p: [0, WALL - 3 + 8, 0] });
    add(t, new THREE.CylinderGeometry(1.2, 1.5, 9, 8), white, { p: [0, WALL + 17, 0] }); add(t, new THREE.ConeGeometry(1.6, 3, 8), terr, { p: [0, WALL + 23, 0] });
    for (let i = -2; i <= 2; i++) { const a = i * Math.PI / 6; add(t, box(2.2, 10, 0.4), glass, { p: [Math.sin(a) * 22.1, 18, Math.cos(a) * 22.1], r: [0, a, 0], cast: false }); }
    g.add(t);
  }
  // κλίτος (nave): 80 × 34, δίρριχτη στέγη
  const NL = 80, NX = -IN - NL / 2 + 6, NW = 19;
  boxAt(g, NL, 32, NW * 2, flor, NX, 0, 0);
  boxAt(g, NL, 15, NW * 2 + 26, flor, NX, 0, 0);
  const rs = new THREE.Shape([new THREE.Vector2(-NW - 1.5, 0), new THREE.Vector2(NW + 1.5, 0), new THREE.Vector2(0, 11)]); const rg = new THREE.ExtrudeGeometry(rs, { depth: NL + 2, bevelEnabled: false }); rg.rotateY(Math.PI / 2); rg.translate(NX - NL / 2 - 1, 32, 0);
  add(g, rg, terr);
  for (const s of [-1, 1]) {
    archWall(g, { n: 10, bw: 8, th: 13, aw: 2.4, ah: 11, depth: 1.0, from: [NX - NL / 2, s * (NW + 13.05)], dir: [1, 0], y: 1, material: flor, darkMaterial: glass, pointed: true, flip: s < 0 });
    archWall(g, { n: 9, bw: 8.6, th: 13, aw: 2.4, ah: 11, depth: 1.0, from: [NX - NL / 2, s * (NW + 0.05)], dir: [1, 0], y: 16, material: flor, darkMaterial: glass, pointed: true, flip: s < 0 });
  }
  // πρόσοψη (ουδέτερη, μαρμάρινη)
  boxAt(g, 3, 44, NW * 2 + 26, flor, NX - NL / 2 - 1.5, 0, 0);
  const tg = new THREE.Shape([new THREE.Vector2(-(NW + 13), 0), new THREE.Vector2(NW + 13, 0), new THREE.Vector2(0, 16)]); const tge = new THREE.ExtrudeGeometry(tg, { depth: 3, bevelEnabled: false }); tge.rotateY(Math.PI / 2); tge.translate(NX - NL / 2 - 3, 44, 0); add(g, tge, flor);
  g.userData.nave = { NX, NL };
  return g;
}

export function buildCampanile(o = {}) {
  const g = new THREE.Group(), flor = florMat({ tile: 9 }), white = mat('marble', 0xf6f0e2, { tile: 5, strength: 0.4 }), glass = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3f5f9a).multiplyScalar(0.8) }), dark = mat(null, 0x1a1a22);
  const W = 15, levels = [[0, 24], [24, 38], [38, 54], [54, 72], [72, 84.7]];
  boxAt(g, W + 1, 2, W + 1, white, 0, 0, 0);
  for (const [y0, y1] of levels) { boxAt(g, W, y1 - y0, W, flor, 0, y0, 0); boxAt(g, W + 0.8, 0.9, W + 0.8, white, 0, y1 - 0.45, 0); }
  // δίφωτα παράθυρα (bifora) στους ορόφους 3-4 και τρίφωτο στον 5ο
  const faces = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  faces.forEach(([nx, nz]) => {
    const rot = Math.atan2(nx, nz);
    const at = (lx, y, w, h, m) => { const p = new THREE.Vector3(lx, y + h / 2, W / 2 + 0.05).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot); add(g, box(w, h, 0.3), m, { p: [p.x, p.y, p.z], r: [0, rot, 0], cast: false }); };
    for (const [y0, y1] of [[24, 38]]) { at(-2.2, y0 + 3, 2.2, 6, dark); at(2.2, y0 + 3, 2.2, 6, dark); }
    for (const [y0, y1] of [[38, 54], [54, 72]]) { at(-2, y0 + 3.5, 2.4, 8, glass); at(2, y0 + 3.5, 2.4, 8, glass); }
    at(-3.6, 75, 2.0, 8, glass); at(0, 75, 2.0, 8, glass); at(3.6, 75, 2.0, 8, glass);
  });
  // στέψη και μικροί πύργισκοι
  boxAt(g, W + 2, 1.5, W + 2, white, 0, 84.7, 0);
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) add(g, new THREE.ConeGeometry(0.9, 4, 6), white, { p: [x * (W / 2 + 0.6), 88, z * (W / 2 + 0.6)] });
  return g;
}

export function buildBaptistery(o = {}) {
  const g = new THREE.Group(), flor = florMat({ tile: 9 }), white = mat('marble', 0xf6f0e2, { tile: 5 }), lead = mat('stone', 0xb0aea6, { tile: 6, strength: 0.4 });
  add(g, octGeo(12.8, 14), flor); add(g, octGeo(13.2, 1.0), white, { p: [0, 13.6, 0] });
  add(g, new THREE.ConeGeometry(15.6, 15, 8, 1, false, Math.PI / 8), lead, { p: [0, 14.6 + 7.5, 0] });
  add(g, octGeo(2.2, 5), white, { p: [0, 29, 0] }); add(g, new THREE.ConeGeometry(2.8, 3, 8), lead, { p: [0, 35.5, 0] });
  return g;
}

export function buildPalazzoVecchio(o = {}) {
  const g = new THREE.Group(), rust = mat('blocks', 0xd9c19a, { tile: 4.8, bump: 1.8, strength: 0.7 }), roofM = mat('tiles', 0xb5502e, { tile: 3 }), dark = mat(null, 0x1a1512);
  boxAt(g, 44, 26, 32, rust, 0, 0, 0);
  const cm = []; for (let i = 0; i < 14; i++) { cm.push(M4([-21 + i * 3.23, 27.4, 15.4]), M4([-21 + i * 3.23, 27.4, -15.4])); }
  boxAt(g, 46, 2, 34, rust, 0, 26, 0);
  instanced(g, box(1.8, 2.6, 1.6), rust, cm);
  boxAt(g, 7.5, 70, 7.5, rust, 6, 26, 6);
  boxAt(g, 11, 6, 11, rust, 6, 96, 6);
  const tm = []; for (let i = 0; i < 6; i++) { tm.push(M4([6 - 5 + i * 2, 103.4, 6 + 5.3]), M4([6 - 5 + i * 2, 103.4, 6 - 5.3]), M4([6 + 5.3, 103.4, 6 - 5 + i * 2]), M4([6 - 5.3, 103.4, 6 - 5 + i * 2])); }
  instanced(g, box(1.4, 2.2, 1.2), rust, tm);
  boxAt(g, 7, 12, 7, rust, 6, 102, 6); add(g, new THREE.ConeGeometry(6, 9, 4), roofM, { p: [6, 121, 6], r: [0, Math.PI / 4, 0] });
  archWall(g, { n: 6, bw: 7, th: 8, aw: 3, ah: 6.4, depth: 1.2, from: [-21, 16.05], dir: [1, 0], y: 4, material: rust, darkMaterial: dark });
  return g;
}

export function buildPonteVecchio(o = {}) {
  const g = new THREE.Group(), stone = mat('blocks', 0xd6c3a0, { tile: 4.8, strength: 0.5, bump: 1 }), shopM = mat('plaster', 0xe0c08a, { tile: 4 }), wood = mat('wood', 0x6b4a2a, { tile: 2 });
  const len = 96, wd = 30, dh = 11;
  const s = new THREE.Shape([[-len / 2, 0], [len / 2, 0], [len / 2, dh], [-len / 2, dh]].map(([x, y]) => new THREE.Vector2(x, y)));
  for (const cx of [-30, 0, 30]) { const w = cx === 0 ? 30 : 26, hh = cx === 0 ? 7.6 : 6.2, h = new THREE.Path(); h.moveTo(cx - w / 2, 0.3); h.quadraticCurveTo(cx, 0.3 + 2 * hh, cx + w / 2, 0.3); h.lineTo(cx - w / 2, 0.3); s.holes.push(h); }
  const gg = new THREE.ExtrudeGeometry(s, { depth: wd, bevelEnabled: false }); gg.translate(0, 0, -wd / 2); add(g, gg, stone);
  const r = rng(5), sh = [];
  for (const sz of [-1, 1]) for (let i = 0; i < 12; i++) { const x = -42 + i * 7.6, hh = 7 + r() * 3; sh.push(M4([x, dh + hh / 2, sz * (wd / 2 - 3.5)], [0, 0, 0], [7.2, hh, 7])); }
  const im = instanced(g, box(1, 1, 1), shopM, sh);
  const rc = new THREE.Color(); sh.forEach((_, i) => { rc.setHex([0xe0c08a, 0xd8b078, 0xe8cf9c, 0xd0a06a][i % 4]); im.setColorAt(i, rc); });
  for (const sz of [-1, 1]) for (let i = 0; i < 12; i++) { const x = -42 + i * 7.6; add(g, new THREE.ConeGeometry(4.6, 2.8, 4), mat('tiles', 0xb5502e, { tile: 3 }), { p: [x, dh + 9.5, sz * (wd / 2 - 3.5)], r: [0, Math.PI / 4, 0], s: [1, 1, 0.95] }); }
  // κεντρικό ανοιχτό «παράθυρο» με θέα (Vasari corridor)
  boxAt(g, len, 5, 4, shopM, 0, dh + 8, -wd / 2 + 1);
  return g;
}
